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
import { wrapWithSteps } from './steps';

export type DetoxAllure2AdapterOptions = {
  /**
   * Whether to wrap device, element and other actions in Allure steps
   * @default false
   */
  useSteps?: boolean;
};

const listener: EnvironmentListenerFn = (
  { testEvents },
  { useSteps = false }: DetoxAllure2AdapterOptions = {},
) => {
  let logHandler: ReturnType<typeof createLogHandler>;
  let zipHandler: ReturnType<typeof createZipHandler>;
  let inferMimeType: MIMEInferer;
  let $test: ReturnType<typeof allure.$bind> | undefined;
  let artifactsManager: any;

  testEvents
    .on('setup', () => {
      allure.$plug((context) => {
        logHandler = createLogHandler(context);
        zipHandler = createZipHandler(context);
        inferMimeType = context.inferMimeType;
      });

      artifactsManager = (worker as any)._artifactsManager;
      artifactsManager.on('trackArtifact', onTrackArtifact);
    })
    .on('setup', async () => {
      if (useSteps) wrapWithSteps(detox, worker, allure);
    })
    .on('test_start', () => {
      $test = allure.$bind();
    })
    .on('test_done', () => {
      $test = undefined;
    })
    .on('teardown', flushArtifacts, -1)
    .on('test_environment_teardown', flushArtifacts, -1);

  async function flushArtifacts() {
    await artifactsManager?._idlePromise;
    artifactsManager = undefined;
  }

  function onTrackArtifact(artifact: any) {
    const $step = allure.$bind();
    const $$test = $test;
    const originalSave = artifact.doSave.bind(artifact);

    artifact.doSave = async (artifactPath: string, ...args: unknown[]) => {
      const result = await originalSave(artifactPath, ...args);
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

export default listener;
