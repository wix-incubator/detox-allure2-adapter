import type { AndroidEntry, IosEntry } from 'logkitten';
import type { VideokittenOptionsIOS, VideokittenOptionsAndroid } from 'videokitten';

export type OnErrorHandler = ((error: Error) => void) | 'throw' | 'ignore';

export type DetoxAllure2AdapterOptions = {
  /**
   * Device logs configuration for per-step logging
   */
  deviceLogs?: boolean | DetoxAllure2AdapterDeviceLogsOptions;
  /**
   * Device screenshots configuration for per-step logging
   */
  deviceScreenshots?: boolean | DetoxAllure2AdapterDeviceScreenshotOptions;
  /**
   * Device video recording for failed tests
   */
  deviceVideos?: boolean | DetoxAllure2AdapterDeviceVideoOptions;
  /**
   * View hierarchy XML visualization for test failures
   */
  deviceViewHierarchy?: boolean | DetoxAllure2AdapterDeviceViewHierarchyOptions;
  /**
   * Callback to handle errors
   */
  onError?: OnErrorHandler;
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
  /**
   * Whether to save all screenshots
   * @default false
   */
  saveAll?: boolean;
}

export interface DetoxAllure2AdapterDeviceVideoOptions {
  /**
   * Whether to save all videos
   * @default false
   */
  saveAll?: boolean;
  /**
   * Controls when video recording starts.
   * - If `true` (default), recording begins lazily on the first device interaction (step).
   * - If `false`, recording starts immediately at the beginning of each test.
   * @default true
   */
  lazyStart?: boolean;
  ios?: Partial<VideokittenOptionsIOS>;
  android?: Partial<VideokittenOptionsAndroid>;
}

export interface DetoxAllure2AdapterDeviceViewHierarchyOptions {
  // TODO: Add options
}
