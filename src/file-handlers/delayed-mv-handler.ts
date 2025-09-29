// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntimePluginContext, FileAttachmentHandler } from 'jest-allure2-reporter/api';

import { RecycleBin } from './RecycleBin';

export function createDelayedMvHandler(
  pluginContext: AllureRuntimePluginContext,
): FileAttachmentHandler {
  return function delayedMvHandler(context) {
    RecycleBin.instance().add(context.sourcePath);
    return pluginContext.fileAttachmentHandlers.copy(context);
  };
}
