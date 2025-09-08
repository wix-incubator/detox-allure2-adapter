# detox-allure2-adapter

## Prerequisites

To use Detox, Jest, and Allure together, please verify that the following modules are part of your `devDependencies` in your `package.json` file.

```json
"devDependencies": {
  "detox": "^20.39.0",
  "detox-allure2-adapter": "^1.0.0-alpha.19",
  "jest": "^29.7.0",
  "jest-allure2-reporter": "^2.2.6",
  "jest-metadata": "^1.6.0"
}
```

If not, add the necessary modules and run `npm install`.

## Setting Up `detox.config.js`

Find `.detoxrc.json`, `detox.config.js` or where your Detox configuration is stored. Add "extends" to include this adapter's preset:

```json
{
  "extends": "detox-allure2-adapter/preset-detox"
}
```

## Setting Up `jest.config.js`

A configuration file for Jest named `jest.config.js` needs to be present. Add or update the following sections:

```js
module.exports = {
    // ...
    reporters: [
      'detox/runners/jest/reporter',
      ['jest-allure2-reporter', {
        extends: 'detox-allure2-adapter/preset-allure',
        /* see https://github.com/wix-incubator/jest-allure2-reporter/blob/beta/index.d.ts */
      }],
    ],
    // ...
    testEnvironmentOptions: {
      eventListeners: [
        'jest-metadata/environment-listener',
        'jest-allure2-reporter/environment-listener',
        ['detox-allure2-adapter', {
          deviceLogs: true,
          deviceScreenshots: true,
          deviceVideos: true,
        }],
      ],
    },
    // ...
}
```

Here's a brief explanation of what you just added:

- `reporters` section: We added Detox and the Allure2 reporter. The latter will enable us to generate Allure reports based on our Jest tests run with Detox.

- `testEnvironmentOptions` section: We added three event listener modules that will run during our tests — `jest-metadata`, `jest-allure2-reporter`, and `detox-allure2-adapter`. These listeners will collect necessary metadata and feed test result data to our Allure reports.

## Adapter Options

### `deviceLogs: boolean | DetoxAllure2AdapterDeviceLogsOptions`

Enables capturing device (iOS/Android) logs for each step. This feature uses the [`logkitten`](https://www.npmjs.com/package/logkitten) library.

**Configuration:**

- **`true`** (default): Enables log capture with default settings.
- **`false`**: Disables log capture.
- **`DetoxAllure2AdapterDeviceLogsOptions`** (object): Enables log capture and provides fine-grained control over the settings.

  - `ios: (entry: IosEntry) => boolean`: Filter function for iOS logs. Return `true` to include the log entry.
  - `android: (entry: AndroidEntry) => boolean`: Filter function for Android logs. Return `true` to include the log entry.
  - `override: boolean`: Whether to override existing log handlers.
  - `saveAll: boolean` (default: `false`): If `true`, saves logs for all steps. By default, only logs for failed steps are kept.
  - `syncDelay: number | { ios?: number; android?: number }` (default: `500`): Synchronization delay in milliseconds for log collection. Set to `0` to disable, or provide per-platform delays.

### `deviceScreenshots: boolean | DetoxAllure2AdapterDeviceScreenshotOptions`

Enables taking screenshots for each step. This feature uses the [`screenkitten`](https://www.npmjs.com/package/screenkitten) library.

**Configuration:**

- **`true`** (default): Enables screenshot capture with default settings.
- **`false`**: Disables screenshot capture.
- **`DetoxAllure2AdapterDeviceScreenshotOptions`** (object): Enables screenshot capture and provides fine-grained control over the settings.

  - `saveAll: boolean` (default: `false`): If `true`, saves screenshots for all steps. By default, only screenshots for failed steps are kept.

### `deviceVideos: boolean | DetoxAllure2AdapterDeviceVideoOptions`

Enables "on-demand" video recording for your tests. This feature uses the [`videokitten`](https://www.npmjs.com/package/videokitten) library.
The recording starts automatically upon the first interaction with the device and stops when the test is complete.

**Configuration:**

- **`true`** (default): Enables video recording with default settings.
- **`false`**: Disables video recording.
- **`DetoxAllure2AdapterDeviceVideoOptions`** (object): Enables recording and provides fine-grained control over the settings.

  - `saveAll: boolean` (default: `false`): If `true`, saves videos for all tests. By default, only videos for failed tests are kept.
  - `ios: Partial<VideokittenOptionsIOS>`: Custom options for iOS, as defined by `videokitten`.
  - `android: Partial<VideokittenOptionsAndroid>`: Custom options for Android, as defined by `videokitten`.

**Example with custom options:**

```js
// jest.config.js
module.exports = {
  eventListeners: [
    'jest-metadata/environment-listener',
    'jest-allure2-reporter/environment-listener',
    ['detox-allure2-adapter', {
      deviceLogs: {
        saveAll: true,
        ios: (entry) => entry.level === 'error',
        android: (entry) => entry.priority === 'E',
      },
      deviceScreenshots: {
        saveAll: true,
      },
      deviceVideos: {
        saveAll: true,
        ios: {
          codec: 'hevc',
        },
        android: {
          bitRate: 4_000_000,
        }
      }
    }],
  ],
},
```

Refer to the [`videokitten` documentation](https://www.npmjs.com/package/videokitten) for a full list of options for each platform.

## Running Tests

After making these changes, you can run your tests as usual. The tests will run with Detox and Jest, and the results will be reported using Allure. Configure your `npm test` script in the `package.json` file to run your Detox tests.

Depending on how `jest-allure2-reporter` is configured, you should be able to see the Allure reports in the output directory `allure-results` (or the one that is specified by you). You will need the Allure command line tool to generate a report in a browser viewable format. The report data is present but needs Allure to view it in a human-readable format.
