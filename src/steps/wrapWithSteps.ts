// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';
import { type StepLogRecorder } from '../logs';
import { type ScreenshotHelper } from '../screenshots';
import { androidDescriptionMaker, iosDescriptionMaker } from './description-maker';
import type { StepDescriptionMaker } from './description-maker';

export interface WrapWithStepsOptions {
  detox: typeof import('detox');
  worker: any;
  allure: AllureRuntime;
  logs?: StepLogRecorder;
  screenshots?: ScreenshotHelper;
}

export function wrapWithSteps(options: WrapWithStepsOptions) {
  const { detox, worker, allure, logs, screenshots } = options;
  const { device } = detox;
  const platform = device.getPlatform();

  // Wrap device methods using the helper
  wrapDeviceMethod(options, 'launchApp', 'Launch app');
  wrapDeviceMethod(options, 'relaunchApp', 'Relaunch app');
  wrapDeviceMethod(options, 'terminateApp', 'Terminate app');
  wrapDeviceMethod(options, 'openURL', 'Open URL');
  wrapDeviceMethod(options, 'reloadReactNative', 'Reload React Native bundle');
  wrapDeviceMethod(options, 'sendToHome', 'Send app to background');
  wrapDeviceMethod(options, 'setOrientation', 'Set orientation');
  wrapDeviceMethod(options, 'matchFace', 'Match face');
  wrapDeviceMethod(options, 'unmatchFace', 'Unmatch face');
  wrapDeviceMethod(options, 'matchFinger', 'Match finger');
  wrapDeviceMethod(options, 'unmatchFinger', 'Unmatch finger');
  wrapPilotMethod(options);

  const descriptionMaker = initDescriptionMaker(platform);

  if (descriptionMaker) {
    const ws = worker._client._asyncWebSocket;
    const send = ws.send.bind(ws) as (...args: any[]) => Promise<{ type?: string }>;
    const onActionSuccess = async () => {
      logs?.attachAfterSuccess(allure);
    };
    const onActionFailure = async (shouldSetStatus: boolean, result?: unknown) => {
      if (shouldSetStatus) {
        allure.status('failed');
      }

      const attached = await screenshots?.extractFromResult(allure, result);
      if (!attached) {
        await screenshots?.attachFailure(allure);
      }
      logs?.attachAfterFailure(allure);
    };
    ws.send = async (...args: any[]) => {
      const desc = descriptionMaker(args[0]);
      return desc?.message
        ? allure.step(desc.message, async () => {
            if (desc.args) allure.parameters(desc.args);
            logs?.attachBefore(allure);

            try {
              const result = await send(...args);
              const onActionDone =
                result?.type === 'testFailed' ? onActionFailure : onActionSuccess;
              await onActionDone(true, result);
              return result;
            } catch (error) {
              await onActionFailure(false);
              throw error;
            }
          })
        : send(...args);
    };
  }
}

function initDescriptionMaker(platform: string): StepDescriptionMaker | undefined {
  if (platform === 'ios') {
    return iosDescriptionMaker;
  } else if (platform === 'android') {
    return androidDescriptionMaker;
  }
  return undefined;
}

const PID_CHANGING_METHODS = new Set(['launchApp', 'relaunchApp', 'openURL']);

function wrapDeviceMethod(
  { detox, allure, logs, screenshots }: WrapWithStepsOptions,
  methodName: string,
  stepDescription: string,
) {
  const device = detox.device as any;
  const originalMethod = device[methodName];
  if (typeof originalMethod !== 'function') return;

  device[methodName] = async (...args: any[]) => {
    return await allure.step(stepDescription, async () => {
      if (PID_CHANGING_METHODS.has(methodName)) {
        logs?.resetPid();
      }

      try {
        logs?.attachBefore(allure);
        const result = await originalMethod.apply(device, args);

        if (PID_CHANGING_METHODS.has(methodName)) {
          logs?.refreshPid();
        }

        await screenshots?.attach(allure, false);
        logs?.attachAfterSuccess(allure);

        return result;
      } catch (error) {
        await screenshots?.attachFailure(allure);
        logs?.attachAfterFailure(allure);

        throw error; // Re-throw the error
      }
    });
  };
}

function wrapPilotMethod({ detox, allure }: WrapWithStepsOptions) {
  const pilot = (detox as any).pilot;
  const originalInit = pilot?.init;
  if (typeof originalInit !== 'function') return;

  pilot.init = function () {
    // eslint-disable-next-line prefer-rest-params
    const result = Reflect.apply(originalInit, this, arguments);
    const instance = pilot.pilot;
    if (typeof instance?.performStep === 'function') {
      instance.performStep = allure.createStep(
        '{{0}}',
        [null],
        instance.performStep.bind(instance),
      );
    }
    if (typeof instance?.autopilot === 'function') {
      instance.autopilot = allure.createStep('{{0}}', [null], instance.autopilot.bind(instance));
    }
    return result;
  };
}
