// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';
import { screenkitten, type Screenkitten } from 'screenkitten';

import type { DetoxAllure2AdapterDeviceScreenshotOptions } from '../types';

export interface ScreenshotHelperConfig {
  device: Detox.Device;
  options: true | DetoxAllure2AdapterDeviceScreenshotOptions;
}

export class ScreenshotHelper {
  private readonly _device: Detox.Device;
  private readonly _platform: 'ios' | 'android';
  private readonly _options: DetoxAllure2AdapterDeviceScreenshotOptions;
  private readonly _kitten: Screenkitten;

  constructor({ device, options }: ScreenshotHelperConfig) {
    this._device = device;
    this._platform = device.getPlatform();
    this._options = typeof options === 'boolean' ? {} : options;
    this._kitten = screenkitten({
      platform: this._platform,
      onError: 'ignore', // Don't throw on errors, just log them
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

  private async _attachScreenshot(allure: AllureRuntime, name = 'screenshot') {
    const filePath = await this._kitten.takeScreenshot({ deviceId: this._device.id });

    allure.fileAttachment(filePath, {
      name: `${name}.png`,
      handler: 'move',
    });
  }
}
