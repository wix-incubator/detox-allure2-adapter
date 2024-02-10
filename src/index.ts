import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import { worker } from 'detox/internals';
// eslint-disable-next-line import/no-internal-modules
import { allure, type MIMEInferer } from 'jest-allure2-reporter/api';
// eslint-disable-next-line node/no-extraneous-import
import type { EnvironmentListenerFn } from 'jest-environment-emit';

import { createLogHandler, createZipHandler } from './file-handlers';

const listener: EnvironmentListenerFn = ({ testEvents }) => {
  let logHandler: ReturnType<typeof createLogHandler>;
  let zipHandler: ReturnType<typeof createZipHandler>;
  let inferMimeType: MIMEInferer;
  let $test: ReturnType<typeof allure.$bind> | undefined;

  testEvents
    .on('setup', () => {
      allure.$plug((context) => {
        logHandler = createLogHandler(context);
        zipHandler = createZipHandler(context);
        inferMimeType = context.inferMimeType;
      });

      const artifactsManager = (worker as any)._artifactsManager;
      artifactsManager.on('trackArtifact', onTrackArtifact);
    })
    .on('test_start', () => {
      $test = allure.$bind();
    })
    .on('test_done', () => {
      $test = undefined;
    });

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
      const mimeType = isLog ? 'text/plain' : undefined;
      const $allure = (isLog || isVideo ? $$test : $step) ?? $step;

      $allure.fileAttachment(artifactPath, {
        name: path.basename(artifactPath),
        mimeType,
        handler,
      });

      return result;
    };
  }
};

export default listener;
