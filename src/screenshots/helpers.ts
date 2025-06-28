import fs from 'node:fs/promises';
import path from 'node:path';
// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';
import { screenkitten, type Screenkitten, ScreenkittenOptions } from 'screenkitten';

import type { DetoxAllure2AdapterDeviceScreenshotOptions } from '../types';
import type { DeviceWrapper } from '../utils';

export interface ScreenshotHelperConfig {
  device: DeviceWrapper;
  options: true | DetoxAllure2AdapterDeviceScreenshotOptions;
  onError?: ScreenkittenOptions['onError'];
}

export class ScreenshotHelper {
  private readonly _device: DeviceWrapper;
  private readonly _options: DetoxAllure2AdapterDeviceScreenshotOptions;
  private readonly _kitten: Screenkitten;

  constructor({ device, options, onError = 'ignore' }: ScreenshotHelperConfig) {
    this._device = device;
    this._options = typeof options === 'boolean' ? {} : options;
    this._kitten =
      this._device.platform === 'ios'
        ? screenkitten({
            platform: 'ios',
            onError,
          })
        : screenkitten({
            platform: 'android',
            adbPath: this._device.adbPath,
            onError,
          });
  }

  async attachFailure(allure: AllureRuntime) {
    return this.attach(allure, true);
  }

  async attachSuccess(allure: AllureRuntime) {
    return this.attach(allure, false);
  }

  async attach(allure: AllureRuntime, failed: boolean) {
    if (this._options.saveAll) {
      await this._attachScreenshot(allure, failed ? 'failure' : 'screenshot');
    } else if (failed) {
      await this._attachScreenshot(allure, 'failure');
    }
  }

  async extractFromResult(allure: AllureRuntime, result: unknown) {
    if (!result) {
      return false;
    }

    const wsResult = result as WebSocketResult;
    if (wsResult.type !== 'testFailed' || !wsResult.params) {
      return false;
    }

    const { params } = wsResult;
    const visibilityArtifactDirs = [
      params.visibilityFailingScreenshotsURL,
      params.visibilityFailingRectsURL,
    ].filter(Boolean) as string[];

    let attached = false;

    for (const visibilityDir of visibilityArtifactDirs) {
      const files = await fs.readdir(visibilityDir).catch(() => []);
      for (const name of files) {
        const filePath = path.join(visibilityDir, name);
        allure.fileAttachment(filePath, { name, handler: 'copy' });
        attached = true;
      }
    }

    return attached;
  }

  private async _attachScreenshot(allure: AllureRuntime, name = 'screenshot') {
    const filePath = await this._kitten.takeScreenshot({ deviceId: this._device.id });

    allure.fileAttachment(filePath, {
      name: `${name}.png`,
      handler: 'move',
    });
  }
}

/**
 * Private interface for Detox WebSocket result that may contain testFailed payload
 */
interface WebSocketResult {
  type?: string;
  params?: {
    visibilityFailingScreenshotsURL?: string;
    visibilityFailingRectsURL?: string;
  };
}
