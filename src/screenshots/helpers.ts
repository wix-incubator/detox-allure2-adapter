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

  async takeScreenshot(): Promise<string> {
    return this._kitten.takeScreenshot({ deviceId: this._device.id });
  }

  private async _attachScreenshot(allure: AllureRuntime, name = 'screenshot') {
    const filePath = await this.takeScreenshot();

    allure.fileAttachment(filePath, {
      name: `${name}.png`,
      handler: 'move',
    });
  }
}
