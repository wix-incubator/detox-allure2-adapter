import listener from 'detox-allure2-adapter';
import { EnvironmentListenerFn } from 'jest-environment-emit';

function assertType<T>(_actual: T): void {
  // no-op
}

assertType<EnvironmentListenerFn>(listener);
