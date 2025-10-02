// eslint-disable-next-line import/no-internal-modules
import detox from 'detox';
// eslint-disable-next-line import/no-internal-modules
import { worker } from 'detox/internals';
// eslint-disable-next-line import/no-internal-modules
import { allure } from 'jest-allure2-reporter/api';
// eslint-disable-next-line node/no-extraneous-import
import type { EnvironmentListenerFn } from 'jest-environment-emit';

import {
  createDelayedMvHandler,
  createViewHierarchyHandlerFactory,
  createZipHandler,
  createZipRmHandler,
  ViewHierarchyHandlerFactory$1,
  RecycleBin,
} from './file-handlers';
import { LogBuffer } from './logs';
import { ScreenshotHelper } from './screenshots';
import { wrapWithSteps } from './steps';
import type { DetoxAllure2AdapterOptions } from './types';
import { DeviceWrapper, WorkerWrapper, createErrorHandler, once } from './utils';
import { VideoManager } from './video';
import { ViewHierarchyHelper } from './view-hierarchy';

export const listener: EnvironmentListenerFn = (
  { testEvents },
  {
    deviceLogs = true,
    deviceScreenshots = true,
    deviceVideos = true,
    deviceViewHierarchy = true,
    userArtifacts = 'move',
    onError: onErrorOption,
  }: DetoxAllure2AdapterOptions = {},
) => {
  let workerWrapper: WorkerWrapper | undefined;
  let logs: LogBuffer | undefined;
  let screenshots: ScreenshotHelper | undefined;
  let videoManager: VideoManager | undefined;
  let viewHierarchy: ViewHierarchyHelper | undefined;
  let viewHierarchyFactory: ViewHierarchyHandlerFactory$1 | undefined;

  let $test: ReturnType<typeof allure.$bind> | undefined;
  let $hook: ReturnType<typeof allure.$bind> | undefined;
  let failing = false;

  const onError = createErrorHandler(onErrorOption ?? 'warn');
  const recycleBin = RecycleBin.instance(onError);

  const flushArtifacts = once(async () => {
    await Promise.all([
      logs?.close(),
      videoManager?.stopAndAttach($hook, failing),
      recycleBin.clear(),
    ]);
    workerWrapper = logs = screenshots = viewHierarchy = videoManager = undefined;
  });

  testEvents
    .on('setup', () => {
      allure.$plug((context) => {
        viewHierarchyFactory = createViewHierarchyHandlerFactory(context);

        context.fileAttachmentHandlers['mv-delayed'] ??= createDelayedMvHandler(context);
        context.fileAttachmentHandlers['zip'] ??= createZipHandler(context);
        context.fileAttachmentHandlers['zip-rm'] ??= createZipRmHandler(context);
        context.handlebars.registerHelper(
          'firstOr',
          function (this: unknown[], defaultValue: unknown) {
            return this[0] || defaultValue;
          },
        );
      });

      workerWrapper = new WorkerWrapper(worker);

      const device = new DeviceWrapper(detox.device);
      if (device.platform !== 'ios' && device.platform !== 'android') {
        return;
      }

      if (workerWrapper.artifactsManager) {
        const noop = () => Promise.resolve();
        const artifactsManager = workerWrapper.artifactsManager;

        if (artifactsManager._artifactPlugins.uiHierarchy) {
          artifactsManager._artifactPlugins.uiHierarchy._registerSnapshot = noop;
        }

        if (artifactsManager._artifactPlugins.screenshot) {
          artifactsManager._artifactPlugins.screenshot._registerSnapshot = noop;
        }

        artifactsManager._callPlugins = noop;
        artifactsManager._callSinglePlugin = noop;
      }

      if (deviceLogs) {
        logs = new LogBuffer({
          device,
          options: deviceLogs,
          onError,
        });

        workerWrapper.eventEmitter.on('beforeLaunchApp', () => logs?.setPid(Number.NaN));
        workerWrapper.eventEmitter.on('launchApp', ({ pid }) => logs?.setPid(pid));
        workerWrapper.eventEmitter.on('terminateApp', () => logs?.setPid(Number.NaN));
      }

      if (deviceScreenshots) {
        screenshots = new ScreenshotHelper({
          device,
          options: deviceScreenshots,
          onError,
        });
      }

      if (deviceVideos) {
        const baseOptions = deviceVideos === true ? {} : deviceVideos;
        videoManager = new VideoManager({ device, options: baseOptions, onError });
      }

      if (deviceViewHierarchy && viewHierarchyFactory) {
        viewHierarchy = new ViewHierarchyHelper({
          createContentHandler: viewHierarchyFactory({
            platform: device.platform,
            stylesheet: deviceViewHierarchy === true ? undefined : deviceViewHierarchy?.stylesheet,
          }),
          onError,
          screenshotsHelper: new ScreenshotHelper({
            device,
            options: true,
            onError,
          }),
        });
      }

      if (device.platform === 'ios') {
        workerWrapper.eventEmitter.on('beforeLaunchApp', (event) => {
          if (viewHierarchy) {
            event.launchArgs.detoxDebugVisibility = 'YES';
            event.launchArgs.detoxDisableHierarchyDump = 'NO';
          } else {
            event.launchArgs.detoxDebugVisibility = 'NO';
            event.launchArgs.detoxDisableHierarchyDump = 'YES';
          }
        });
      }
    })
    .on('setup', async () => {
      if (workerWrapper) {
        wrapWithSteps({
          detox,
          worker: workerWrapper,
          allure,
          logs,
          screenshots,
          videoManager,
          viewHierarchy,
          userArtifacts,
        });
      }
    })
    .on('run_start', async () => {
      // Only start early if configured (lazyStart === false)
      await videoManager?.ensureRecordingEager();
    })
    .on('test_started', async () => {
      // Start recording eagerly if configured or when not using step wrappers
      await videoManager?.ensureRecordingEager();
    })
    .on('test_start', async () => {
      $test = allure.$bind();
      $hook = undefined;
      logs?.attachBefore(allure);
      failing = false;
    })
    .on('hook_start', async ({ event }) => {
      logs?.attachBefore(allure);

      if (event.hook.type === 'beforeAll' || event.hook.type === 'afterAll') {
        $hook ??= allure.$bind();
        await videoManager?.ensureRecordingEager();
      }
    })
    .on('hook_failure', async () => {
      failing = true;
      await Promise.all([logs?.attachAfterFailure(allure), screenshots?.attachFailure(allure)]);
    })
    .on('hook_success', async () => {
      await Promise.all([logs?.attachAfterSuccess(allure), screenshots?.attachSuccess(allure)]);
    })
    .on('test_fn_failure', async () => {
      failing = true;
      await Promise.all([logs?.attachAfterFailure(allure), screenshots?.attachFailure(allure)]);
    })
    .on('test_fn_success', async () => {
      await Promise.all([logs?.attachAfterSuccess(allure), screenshots?.attachSuccess(allure)]);
    })
    .on('test_done', async () => {
      await videoManager?.stopAndAttach($test, failing);
      $test = undefined;
    })
    .once('teardown', flushArtifacts, -1)
    .once('test_environment_teardown', flushArtifacts, -1);
};
