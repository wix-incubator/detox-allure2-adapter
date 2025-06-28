// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';

import type { Emitter, AndroidEntry, IosEntry, Entry } from 'logkitten';
import { Level, logkitten } from 'logkitten';
import type { DetoxAllure2AdapterDeviceLogsOptions } from '../types';
import type { DeviceWrapper } from '../utils';

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
  resetPid(): void;
  refreshPid(): void;
  close(): Promise<void>;
}

const noop = () => {};

export class LogBuffer implements StepLogRecorder {
  private readonly _emitter: Emitter;
  private _entries: AnyEntry[] = [];
  private _purgatory: AnyEntry[] = [];
  private _pid = Number.NaN;
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

  public resetPid() {
    this._pid = Number.NaN;
  }

  public refreshPid() {
    this._pid = this._config.device.getPid();

    if (Number.isFinite(this._pid) && this._purgatory.length > 0) {
      this._entries = [...this._entries, ...this._purgatory.splice(0).filter(this._matchesPid)];
    }
  }

  public flush(failed?: boolean): string {
    if (this._entries.length === 0) {
      return '';
    }

    const entries = this._entries.splice(0);

    // Check if we should save logs based on failure status
    const saveAll = this._options.saveAll ?? false;
    if (!saveAll && !failed) {
      return '';
    }

    const result = entries
      .map((entry) => {
        const levelLetter = Level[entry.level as Level] || 'UNKNOWN';
        const tagOrCategory = entry.tag || `${entry.subsystem}:${entry.category}`;
        const msg = entry.msg;

        return `${levelLetter}\t${tagOrCategory}\t${msg}`;
      })
      .join('\n');

    return result + '\n';
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
    const content = this.flush(failed);

    if (content) {
      const name = after ? 'app.log' : 'app-before.log';
      allure.attachment(name, content, 'text/plain');
    }
  };

  private readonly _onEntry = (entry: AnyEntry) => {
    if (Number.isFinite(this._pid)) {
      this._entries.push(entry);
    } else {
      this._purgatory.push(entry);
    }
  };

  private readonly _matchesPid = (entry: Entry) => entry.pid === this._pid;

  private _iosFilter(entry: IosEntry): boolean {
    const userFilter = this._options.ios;
    const override = this._options.override;
    if (!override && !this._defaultIosFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private _androidFilter(entry: AndroidEntry): boolean {
    const userFilter = this._options.android;
    const override = this._options.override;
    if (!override && !this._defaultAndroidFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private readonly _defaultIosFilter = (entry: IosEntry) => {
    if (entry.subsystem.startsWith('com.facebook.react.')) {
      return true;
    }

    if (entry.level >= Level.ERROR) {
      return !entry.subsystem.startsWith('com.apple.'); // && !entry.msg.includes('(CFNetwork)');
    }

    return false;
  };

  private readonly _defaultAndroidFilter = (entry: AndroidEntry) => {
    if (entry.tag.startsWith('Detox') || entry.tag.startsWith('React')) {
      return true;
    }

    if (entry.level >= Level.ERROR) {
      return true;
    }

    return false;
  };
}
