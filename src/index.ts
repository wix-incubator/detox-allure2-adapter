import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import { worker } from 'detox/internals';
// eslint-disable-next-line import/no-internal-modules
import { allure } from 'jest-allure2-reporter/api';
// eslint-disable-next-line node/no-extraneous-import
import type { EnvironmentListenerFn } from 'jest-environment-emit';

const listener: EnvironmentListenerFn = ({ testEvents }) => {
  testEvents.on('setup', () => {
    const artifactsManager = (worker as any)._artifactsManager;
    artifactsManager.on('trackArtifact', onTrackArtifact);
  });

  function onTrackArtifact(artifact: any) {
    const $allure = allure.$bind();
    const originalSave = artifact.doSave.bind(artifact);
    artifact.doSave = async (artifactPath: string, ...args: unknown[]) => {
      const result = await originalSave(artifactPath, ...args);
      // if not directory
      if (!fs.lstatSync(artifactPath).isDirectory()) {
        const mimeType = path.extname(artifactPath) === '.log' ? 'text/plain' : undefined;
        $allure.fileAttachment(artifactPath, { name: path.basename(artifactPath), mimeType });
      }

      return result;
    };
  }
};

export default listener;
