import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import detox from 'detox';
// eslint-disable-next-line import/no-internal-modules
import { worker } from 'detox/internals';
// eslint-disable-next-line import/no-internal-modules
import { allure, type MIMEInferer } from 'jest-allure2-reporter/api';
// eslint-disable-next-line node/no-extraneous-import
import type { EnvironmentListenerFn } from 'jest-environment-emit';

import { createLogHandler, createZipHandler } from './file-handlers';
import { LogBuffer } from './logs';
import { ScreenshotHelper } from './screenshots';
import { wrapWithSteps } from './steps';
import type { DetoxAllure2AdapterOptions } from './types';
import { DeviceWrapper, WorkerWrapper, once } from './utils';
import { VideoManager } from './video';

export const listener: EnvironmentListenerFn = (
  { testEvents },
  {
    useSteps = false,
    deviceLogs = false,
    deviceScreenshots = false,
    deviceVideos = false,
    onError,
  }: DetoxAllure2AdapterOptions = {},
) => {
  let logHandler: ReturnType<typeof createLogHandler>;
  let zipHandler: ReturnType<typeof createZipHandler>;
  let inferMimeType: MIMEInferer;
  let workerWrapper: WorkerWrapper | undefined;
  let logs: LogBuffer | undefined;
  let screenshots: ScreenshotHelper | undefined;
  let videoManager: VideoManager | undefined;

  let $test: ReturnType<typeof allure.$bind> | undefined;
  let $hook: ReturnType<typeof allure.$bind> | undefined;
  let failing = false;

  const flushArtifacts = once(async () => {
    await workerWrapper?.artifactsManager?._idlePromise;
    await Promise.all([logs?.close(), videoManager?.stopAndAttach($hook, failing)]);
    workerWrapper = undefined;
    logs = undefined;
    videoManager = undefined;
  });

  testEvents
    .on('setup', () => {
      allure.$plug((context) => {
        logHandler = createLogHandler(context);
        zipHandler = createZipHandler(context);
        inferMimeType = context.inferMimeType;
      });

      workerWrapper = new WorkerWrapper(worker);
      workerWrapper.artifactsManager.on('trackArtifact', onTrackArtifact);

      const device = new DeviceWrapper(detox.device);
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
        const effectiveOptions = useSteps ? baseOptions : { ...baseOptions, lazyStart: false };
        videoManager = new VideoManager({ device, options: effectiveOptions });
      }
    })
    .on('setup', async () => {
      if (useSteps) {
        wrapWithSteps({ detox, worker, allure, logs, screenshots, videoManager });
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

  function onTrackArtifact(artifact: any) {
    const $step = allure.$bind();
    const $$test = $test;
    const originalSave = artifact.doSave.bind(artifact);

    artifact.doSave = async (artifactPath: string, ...args: unknown[]) => {
      const result = await originalSave(artifactPath, ...args);
      if (logs && artifactPath.endsWith('.log')) {
        return result;
      }

      if (screenshots && artifactPath.includes('DETOX_VISIBILITY_')) {
        return result;
      }

      if (!fs.existsSync(artifactPath)) {
        return result;
      }

      const isDirectory = fs.lstatSync(artifactPath).isDirectory();
      const isLog = path.extname(artifactPath) === '.log';
      const isVideo = !!inferMimeType({ sourcePath: artifactPath })?.startsWith('video/');
      const handler = isDirectory ? zipHandler : isLog ? logHandler : 'copy';
      const mimeType = isLog ? 'text/plain' : isDirectory ? 'application/zip' : undefined;
      const $allure = (isLog || isVideo ? $$test : $step) ?? $step;
      const name = path.basename(artifactPath);

      $allure.fileAttachment(artifactPath, {
        name,
        mimeType,
        handler,
      });

      return result;
    };
  }
};
