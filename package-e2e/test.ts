import type { ReporterOptions } from 'jest-allure2-reporter';

import listener from 'detox-allure2-adapter';
import DetoxAllurePathBuilder from 'detox-allure2-adapter/path-builder';
import presetAllure from 'detox-allure2-adapter/preset-allure';
import presetDetox from 'detox-allure2-adapter/preset-detox';
import { EnvironmentListenerFn } from 'jest-environment-emit';

function assertType<T>(_actual: T): void {
  // no-op
}

assertType<EnvironmentListenerFn>(listener);
assertType<DetoxAllurePathBuilder>(new DetoxAllurePathBuilder());
assertType<ReporterOptions>(presetAllure);
