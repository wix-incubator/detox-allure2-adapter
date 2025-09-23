import type { ReporterOptions } from 'jest-allure2-reporter';

import listener from 'detox-allure2-adapter';
import type {
  DetoxAllure2AdapterOptions,
  DetoxAllure2AdapterDeviceLogsOptions,
  DetoxAllure2AdapterDeviceScreenshotOptions,
  DetoxAllure2AdapterDeviceVideoOptions,
  DetoxAllure2AdapterDeviceViewHierarchyOptions,
} from 'detox-allure2-adapter';
import DetoxAllurePathBuilder from 'detox-allure2-adapter/path-builder';
import presetAllure from 'detox-allure2-adapter/preset-allure';
import presetDetox from 'detox-allure2-adapter/preset-detox';
import { EnvironmentListenerFn } from 'jest-environment-emit';

function assertType<T>(_actual: T): void {
  // no-op
}

assertType<unknown>(presetAllure);
assertType<unknown>(presetDetox);

assertType<EnvironmentListenerFn>(listener);
assertType<DetoxAllurePathBuilder>(new DetoxAllurePathBuilder());
assertType<ReporterOptions>(presetAllure);
assertType<DetoxAllure2AdapterOptions>({
  deviceLogs: true,
  deviceScreenshots: true,
  deviceVideos: true,
});

assertType<DetoxAllure2AdapterDeviceLogsOptions>({
  ios: () => true,
  android: () => true,
  override: true,
  saveAll: true,
  syncDelay: 0,
});

assertType<DetoxAllure2AdapterDeviceLogsOptions>({
  syncDelay: { ios: 0, android: 1000 },
});

assertType<DetoxAllure2AdapterDeviceScreenshotOptions>({
  saveAll: true,
});

assertType<DetoxAllure2AdapterDeviceVideoOptions>({
  saveAll: true,
  ios: {
    codec: 'hevc',
  },
  android: {
    recording: {
      bitRate: 4_000_000,
    },
  },
});

assertType<DetoxAllure2AdapterDeviceViewHierarchyOptions>({});
