// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';

import type { ScreenshotHelper } from '../screenshots';
import type { OnErrorHandlerFn } from '../types';
import type { DetoxTestFailedResult, DeviceWrapper } from '../utils';
import { ScreenshotsCollector } from './screenshots-collector';
import { XmlBuilder } from './xml-processor';

const POINTER_REGEX = /(0x[\da-f]+)/;

export interface ViewHierarchyHelperConfig {
  device: DeviceWrapper;
  screenshotsHelper: ScreenshotHelper;
  onError: OnErrorHandlerFn;
}

/**
 * Helper class for handling viewHierarchy XML data from test failures
 */
export class ViewHierarchyHelper {
  private readonly _screenshotsCollector: ScreenshotsCollector;
  private readonly _platform: 'ios' | 'android';
  private readonly _handleError: OnErrorHandlerFn;

  constructor({ device, screenshotsHelper, onError }: ViewHierarchyHelperConfig) {
    this._platform = device.platform;
    this._handleError = onError;
    this._screenshotsCollector = new ScreenshotsCollector({
      onError,
      screenshotsHelper,
    });
  }

  /**
   * Attach various failure artifacts from the test result payload to the Allure report.
   * This includes the interactive view hierarchy, native view hierarchy zip, and any failure screenshots.
   *
   * @returns An object indicating what was attached, e.g. { screenshotsAttached: boolean; viewHierarchyAttached: boolean; }.
   */
  async attachFromResult(
    allure: AllureRuntime,
    result: DetoxTestFailedResult | undefined,
  ): Promise<{ screenshotsAttached: boolean; viewHierarchyAttached: boolean }> {
    const defaultResponse = { screenshotsAttached: false, viewHierarchyAttached: false };
    const params = result?.params;
    if (!params) {
      return defaultResponse;
    }

    // First, get the screenshot content to avoid race conditions with file moving.
    const screenshotBase64 = params.viewHierarchy
      ? await this._screenshotsCollector.getBase64Screenshot(params.visibilityFailingScreenshotsURL)
      : undefined;

    // Now, all attachment operations can run in parallel.
    const [interactiveAttached, nativeAttached, screenshotsAttached] = await Promise.all([
      this.attachInteractiveViewHierarchy(allure, params, screenshotBase64),
      this.attachNativeViewHierarchy(allure, params.viewHierarchyURL),
      this._screenshotsCollector.attachAllScreenshots(
        allure,
        params.visibilityFailingScreenshotsURL,
      ),
      this._screenshotsCollector.attachAllScreenshots(allure, params.visibilityFailingRectsURL),
    ]);

    return {
      screenshotsAttached: screenshotsAttached || !!screenshotBase64,
      viewHierarchyAttached: interactiveAttached || nativeAttached,
    };
  }

  private async attachInteractiveViewHierarchy(
    allure: AllureRuntime,
    params: DetoxTestFailedResult['params'],
    screenshotBase64?: string,
  ): Promise<boolean> {
    if (!params.viewHierarchy) {
      return false;
    }

    const activePtr = this.extractPointer(params.viewDescription);

    const xml = new XmlBuilder(params.viewHierarchy)
      .withScreenshot(screenshotBase64)
      .withActivePointer(activePtr)
      .withErrorMessage(params.details)
      .withPlatform(this._platform);

    allure.attachment('viewhierarchy.xml', `${xml}`, 'text/html');
    return true;
  }

  private async attachNativeViewHierarchy(
    allure: AllureRuntime,
    dirPath?: string,
  ): Promise<boolean> {
    if (!dirPath) {
      return false;
    }

    try {
      await allure.fileAttachment(dirPath, {
        name: 'ui.viewhierarchy.zip',
        mimeType: 'application/zip',
        handler: 'zip',
      });
      return true;
    } catch (error) {
      this._handleError(error as Error);
      return false;
    }
  }

  private extractPointer(str?: string): string | undefined {
    if (typeof str !== 'string') {
      return undefined;
    }

    const match = str.match(POINTER_REGEX);
    return match ? match[1] : undefined;
  }
}
