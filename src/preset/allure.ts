// eslint-disable-next-line import/no-internal-modules
import { config, session } from 'detox/internals';
import type {
  KeyedParameterCustomizer,
  ReporterOptions,
  TestCaseCustomizer,
  TestCaseExtractorContext,
} from 'jest-allure2-reporter';

const historyId: TestCaseCustomizer['historyId'] = ({ value }): string => {
  const { type } = config.device;
  const platform = type.split('.')[0];
  return `${platform}:${value}`;
};

const device: KeyedParameterCustomizer<unknown> = (): string | undefined => {
  const { type, device } = config.device as any;

  switch (type) {
    case 'ios.simulator': {
      return [device.type, device.os].filter(Boolean).join(', ') || 'iOS Simulator';
    }
    case 'android.emulator': {
      return device.avdName || 'Android Emulator';
    }
    case 'android.genycloud': {
      return device.recipeName || 'Genymotion SaaS';
    }
    default: {
      return;
    }
  }
};

const status: TestCaseCustomizer<TestCaseExtractorContext>['status'] = ({
  testCase: { failureMessages },
  value,
}) => {
  if (value !== 'broken') {
    return value;
  }

  return failureMessages.every((x) => x.includes('Test Failed:')) ? 'failed' : 'broken';
};

const options: ReporterOptions = {
  overwrite: session.testSessionIndex === 0,
  attachments: {
    fileHandler: 'copy',
  },
  testCase: {
    historyId,
    status,
    parameters: {
      device,
    },
  },
  testFile: {
    historyId,
    parameters: {
      device,
    },
  },
  testRun: {
    ignored: ({ aggregatedResult }) =>
      aggregatedResult.numFailedTests === 0 && aggregatedResult.numFailedTestSuites === 0,
    attachments: [
      {
        name: 'detox.log',
        type: 'text/plain',
        source: 'detox.log',
      },
      {
        name: 'detox.trace.json',
        type: 'application/json',
        source: 'detox.trace.json',
      },
    ],
  },
};

export default options;
