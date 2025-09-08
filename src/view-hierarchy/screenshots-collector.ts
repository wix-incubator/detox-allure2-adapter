import fs from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';

import type { ScreenshotHelper } from '../screenshots';
import type { OnErrorHandler } from '../types';
import { createErrorHandler } from '../utils';

export interface ScreenshotsCollectorConfig {
  screenshotsHelper: ScreenshotHelper;
  onError: OnErrorHandler;
}

/**
 * Collects and attaches screenshots to Allure reports
 */
export class ScreenshotsCollector {
  private readonly _screenshotsHelper: ScreenshotHelper;
  private readonly _handleError: (error: Error) => void;

  constructor({ screenshotsHelper, onError }: ScreenshotsCollectorConfig) {
    this._handleError = createErrorHandler(onError);
    this._screenshotsHelper = screenshotsHelper;
  }

  /**
   * Get base64 screenshot from directory or capture using Screenkitten
   */
  async getBase64Screenshot(dir?: string): Promise<string | undefined> {
    // First, try to get screenshot from the provided directory
    const directoryScreenshot = await this.getScreenshotFromDirectory(dir).catch(this._handleError);
    if (directoryScreenshot) {
      return directoryScreenshot;
    }

    return this.captureScreenshotWithScreenkitten();
  }

  /**
   * Attach all screenshots from a directory to Allure
   */
  async attachAllScreenshots(allure: AllureRuntime, dirPath?: string): Promise<boolean> {
    if (!dirPath || !fs.existsSync(dirPath)) {
      return false;
    }

    const files = await fs.promises.readdir(dirPath);
    await Promise.all(
      files.map((name) => {
        const screenshotPath = path.join(dirPath, name);
        return allure.fileAttachment(screenshotPath, { handler: 'copy' });
      }),
    );

    return files.length > 0;
  }

  /**
   * Get base64 screenshot from a directory
   */
  private async getScreenshotFromDirectory(dir?: string): Promise<string | undefined> {
    if (!dir || !fs.existsSync(dir)) {
      return undefined;
    }

    const files = await fs.promises.readdir(dir);
    const imageFiles = files.filter((file) => file.endsWith('.png'));
    if (imageFiles.length > 0) {
      const screenshotPath = path.join(dir, imageFiles[0]);
      const buffer = await fs.promises.readFile(screenshotPath);
      return buffer.toString('base64');
    }

    return undefined;
  }

  /**
   * Capture screenshot using Screenkitten and return as base64
   */
  private async captureScreenshotWithScreenkitten(): Promise<string | undefined> {
    let filePath: string | undefined;
    try {
      filePath = await this._screenshotsHelper.takeScreenshot();
      const buffer = await fs.promises.readFile(filePath).catch(this._handleError);
      return buffer ? buffer.toString('base64') : undefined;
    } finally {
      if (filePath) {
        await fs.promises.unlink(filePath).catch(this._handleError);
      }
    }
  }
}
