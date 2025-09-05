// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';
import { type StepLogRecorder } from '../logs';
import { type ScreenshotHelper } from '../screenshots';
import { type WorkerWrapper } from '../utils';
import { type VideoManager } from '../video';
import { androidDescriptionMaker, iosDescriptionMaker } from './description-maker';
import type { StepDescriptionMaker } from './description-maker';

export interface WrapWithStepsOptions {
  detox: typeof import('detox');
  worker: WorkerWrapper;
  allure: AllureRuntime;
  logs?: StepLogRecorder;
  screenshots?: ScreenshotHelper;
  videoManager?: VideoManager;
}

interface WrapWithDescriptionMakerOptions extends WrapWithStepsOptions {
  descriptionMaker: StepDescriptionMaker;
  send: (...args: any[]) => Promise<{ type?: string }>;
}

interface WrapWithScreenshotTakingOptions {
  // eslint-disable-next-line @typescript-eslint/ban-types
  method: Function;
  screenshots?: ScreenshotHelper;
  allure: AllureRuntime;
}

export function wrapWithSteps(options: WrapWithStepsOptions) {
  const { detox, worker } = options;
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
    const ws = worker.asyncWebSocket;

    ws.send = wrapSendMethod({
      ...options,
      descriptionMaker,
      send: ws.send.bind(ws) as (...args: any[]) => Promise<{ type?: string }>,
    });

    const xcuitestRunner = worker.xcuitestRunner;
    xcuitestRunner.execute = wrapSendMethod({
      ...options,
      descriptionMaker,
      send: xcuitestRunner.execute.bind(xcuitestRunner),
    });
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

function wrapDeviceMethod(
  { detox, allure, logs, screenshots, videoManager }: WrapWithStepsOptions,
  methodName: string,
  stepDescription: string,
) {
  const device = detox.device as any;
  const originalMethod = device[methodName];
  if (typeof originalMethod !== 'function') return;

  device[methodName] = async (...args: any[]) => {
    await videoManager?.ensureRecording();

    return await allure.step(stepDescription, async () => {
      try {
        logs?.attachBefore(allure);
        const result = await originalMethod.apply(device, args);
        await Promise.all([logs?.attachAfterSuccess(allure), screenshots?.attach(allure, false)]);

        return result;
      } catch (error) {
        await Promise.all([logs?.attachAfterFailure(allure), screenshots?.attachFailure(allure)]);

        throw error; // Re-throw the error
      }
    });
  };
}

function wrapPilotMethod({ detox, allure, screenshots }: WrapWithStepsOptions) {
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
        wrapWithScreenshotTaking({
          method: instance.performStep.bind(instance),
          screenshots,
          allure,
        }),
      );
    }
    if (typeof instance?.autopilot === 'function') {
      instance.autopilot = allure.createStep(
        '{{0}}',
        [null],
        wrapWithScreenshotTaking({
          method: instance.autopilot.bind(instance),
          screenshots,
          allure,
        }),
      );
    }
    return result;
  };
}

function wrapWithScreenshotTaking({
  method,
  screenshots,
  allure,
}: WrapWithScreenshotTakingOptions) {
  if (!screenshots || !allure) {
    return method;
  }

  return async (...args: any[]) => {
    try {
      return await method(...args);
    } catch (error) {
      if (`${error}`.startsWith('Error:')) {
        await screenshots?.attachFailure(allure);
      }

      throw error;
    }
  };
}

function wrapSendMethod({
  descriptionMaker,
  allure,
  logs,
  videoManager,
  screenshots,
  send,
}: WrapWithDescriptionMakerOptions) {
  const onActionSuccess = async () => {
    await logs?.attachAfterSuccess(allure);
  };

  const onActionFailure = async (shouldSetStatus: boolean, result?: unknown) => {
    if (shouldSetStatus) {
      allure.status('failed');
    }

    await Promise.all([
      logs?.attachAfterFailure(allure),
      screenshots?.attachFromResultOrFailure(allure, result),
    ]);
  };

  return async (...args: any[]) => {
    const desc = descriptionMaker(args[0]);
    return desc?.message
      ? allure.step(desc.message, async () => {
          if (desc.args) allure.parameters(desc.args);
          logs?.attachBefore(allure);
          await videoManager?.ensureRecording();

          try {
            const result = await send(...args);
            const onActionDone = result?.type === 'testFailed' ? onActionFailure : onActionSuccess;
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
