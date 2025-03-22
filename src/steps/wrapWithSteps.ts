// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';
import { androidDescriptionMaker, iosDescriptionMaker } from './description-maker';
import type { StepDescriptionMaker } from './description-maker';

export function wrapWithSteps(detox: typeof import('detox'), worker: any, allure: AllureRuntime) {
  const { device } = detox;

  device.launchApp = allure.createStep('Launch app', [], device.launchApp);
  device.relaunchApp = allure.createStep('Relaunch app', [], device.relaunchApp);
  device.terminateApp = allure.createStep('Terminate app', [], device.terminateApp);
  device.openURL = allure.createStep('Open URL', [], device.openURL);
  device.reloadReactNative = allure.createStep(
    'Reload React Native bundle',
    [],
    device.reloadReactNative,
  );

  device.sendToHome = allure.createStep('Send app to background', [], device.sendToHome);
  device.setOrientation = allure.createStep('Set orientation', [], device.setOrientation);

  device.matchFace = allure.createStep('Match face', [], device.matchFace);
  device.unmatchFace = allure.createStep('Unmatch face', [], device.unmatchFace);
  device.matchFinger = allure.createStep('Match finger', [], device.matchFinger);
  device.unmatchFinger = allure.createStep('Unmatch finger', [], device.unmatchFinger);

  const platform = device.getPlatform();
  const descriptionMaker = initDescriptionMaker(platform);

  if (descriptionMaker) {
    const ws = worker._client._asyncWebSocket;
    const send = ws.send.bind(ws) as (...args: any[]) => Promise<{ type?: string }>;
    ws.send = async (...args: any[]) => {
      const desc = descriptionMaker(args[0]);
      return desc?.message
        ? allure.step(desc.message, () => {
            if (desc.args) allure.parameters(desc.args);
            return send(...args).then((result: { type?: string }) => {
              if (result?.type === 'testFailed') {
                allure.status('failed');
              }

              return result;
            });
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
