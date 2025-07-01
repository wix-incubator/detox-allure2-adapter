import type { AndroidEntry, IosEntry } from 'logkitten';

export type DetoxAllure2AdapterOptions = {
  /**
   * Whether to wrap device, element and other actions in Allure steps
   * @default false
   */
  useSteps?: boolean;
  /**
   * Device logs configuration for per-step logging
   */
  deviceLogs?: boolean | DetoxAllure2AdapterDeviceLogsOptions;
  /**
   * Device screenshots configuration for per-step logging
   */
  deviceScreenshots?: boolean | DetoxAllure2AdapterDeviceScreenshotOptions;
  /**
   * Callback to handle errors
   */
  onError?: (error: Error) => void;
};

export interface DetoxAllure2AdapterDeviceLogsOptions {
  ios?: (entry: IosEntry) => boolean;
  android?: (entry: AndroidEntry) => boolean;
  override?: boolean;
  saveAll?: boolean;
  /**
   * Synchronization delay (ms) for log collection. 0 disables, number for both, or { ios, android } for per-platform.
   * @default 500
   */
  syncDelay?: number | { ios?: number; android?: number };
}

export interface DetoxAllure2AdapterDeviceScreenshotOptions {
  saveAll?: boolean;
}
