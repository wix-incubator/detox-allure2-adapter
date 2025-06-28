// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';

import type { Emitter, AndroidEntry, IosEntry } from 'logkitten';
import { Level, logkitten } from 'logkitten';
import type { DetoxAllure2AdapterDeviceLogsOptions } from '../types';
import type { DeviceWrapper } from '../utils';

import { PIDEntryCollection } from './pid-entry-collection';

type AnyEntry = AndroidEntry & IosEntry;

export interface LogBufferOptions {
  device: DeviceWrapper;
  options: true | DetoxAllure2AdapterDeviceLogsOptions;
  onError?: (error: Error) => void;
}

export interface StepLogRecorder {
  attachBefore(allure: AllureRuntime): void;
  attachAfter(allure: AllureRuntime, failed: boolean): void;
  attachAfterSuccess(allure: AllureRuntime): void;
  attachAfterFailure(allure: AllureRuntime): void;
  setPid(pid: number): void;
  close(): Promise<void>;
}

const noop = () => {};

export class LogBuffer implements StepLogRecorder {
  private readonly _emitter: Emitter;
  private readonly _appEntries = new PIDEntryCollection();
  private readonly _detoxEntries = new PIDEntryCollection();
  private _options: DetoxAllure2AdapterDeviceLogsOptions;

  constructor(readonly _config: LogBufferOptions) {
    const deviceId = this._config.device.id;
    const platform = this._config.device.platform;

    this._options = typeof this._config.options === 'boolean' ? {} : this._config.options;
    this._emitter =
      platform === 'android'
        ? logkitten({
            platform: 'android',
            deviceId,
            adbPath: this._config.device.adbPath,
            filter: this._androidFilter.bind(this),
          })
        : logkitten({
            platform: 'ios',
            deviceId,
            filter: this._iosFilter.bind(this),
          });

    this._emitter.on('entry', this._onEntry);
    this._emitter.on('error', this._config.onError ?? noop);
  }

  public setPid(pid: number) {
    this._appEntries.pid = pid;
    this._detoxEntries.pid = pid;
  }

  public async close() {
    await this._emitter.close();
    this._emitter.removeAllListeners();
  }

  public attachBefore(allure: AllureRuntime) {
    return this._attachLogs(allure, false, false);
  }

  public attachAfter(allure: AllureRuntime, failed: boolean) {
    return this._attachLogs(allure, failed, true);
  }

  public attachAfterSuccess(allure: AllureRuntime) {
    return this._attachLogs(allure, false, true);
  }

  public attachAfterFailure(allure: AllureRuntime) {
    return this._attachLogs(allure, true, true);
  }

  private readonly _attachLogs = (allure: AllureRuntime, failed: boolean, after: boolean) => {
    // Check if we should save logs based on failure status
    const saveAll = this._options.saveAll ?? false;
    if (!saveAll && !failed) {
      return;
    }

    const appContent = this._appEntries.flushAsString();
    if (appContent) {
      const name = after ? 'app.log' : 'app-before.log';
      allure.attachment(name, appContent, 'text/plain');
    }

    const detoxContent = this._detoxEntries.flushAsString();
    if (detoxContent) {
      const name = after ? 'detox.log' : 'detox-before.log';
      allure.attachment(name, detoxContent, 'text/plain');
    }
  };

  private readonly _onEntry = (entry: AnyEntry) => {
    this._appEntries.push(entry);
  };

  private _iosFilter(entry: IosEntry): boolean {
    if (entry.subsystem === 'com.wix.Detox') {
      this._detoxEntries.push(entry);

      // Exclude Detox logs from app logs unless they are errors
      if (entry.level < Level.ERROR) {
        return false;
      }
    }

    const userFilter = this._options.ios;
    const override = this._options.override;
    if (!override && !this._defaultIosFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private _androidFilter(entry: AndroidEntry): boolean {
    if (entry.tag && entry.tag.startsWith('Detox')) {
      this._detoxEntries.push(entry);

      // Exclude Detox logs from app logs unless they are errors
      if (entry.level < Level.ERROR) {
        return false;
      }
    }

    const userFilter = this._options.android;
    const override = this._options.override;
    if (!override && !this._defaultAndroidFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private readonly _defaultIosFilter = (entry: IosEntry) => {
    // Only handle React Native app logs, not Detox logs
    if (entry.subsystem.startsWith('com.facebook.react.')) {
      if (entry.msg.startsWith('Unbalanced calls start/end for tag')) {
        return false;
      }

      return true;
    }

    if (entry.processImagePath.endsWith('/proactiveeventtrackerd')) {
      return false;
    }

    if (entry.level >= Level.ERROR) {
      return !entry.subsystem.startsWith('com.apple.'); // && !entry.msg.includes('(CFNetwork)');
    }

    return false;
  };

  private readonly _defaultAndroidFilter = (entry: AndroidEntry) => {
    // Only handle React Native app logs, not Detox logs
    if (entry.tag.startsWith('React')) {
      return true;
    }

    if (entry.level >= Level.ERROR) {
      return true;
    }

    return false;
  };
}
