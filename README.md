# detox-allure2-adapter

## Prerequisites

To use Detox, Jest, and Allure together, please verify that the following modules are part of your `devDependencies` in your `package.json` file. 

```json
"devDependencies": {
  "detox": "20.14.7",
  "detox-allure2-adapter": "^1.0.0-alpha.3",
  "jest": "^29.7.0",
  "jest-allure2-reporter": "^2.0.0-beta.5",
  "jest-metadata": "^1.3.1"
}
```

If not, add the necessary modules and run `npm install`.

## Setting Up `jest.config.js`

A configuration file for Jest named `jest.config.js` needs to be present. Add or update the following sections:

```js
module.exports = {
    // ...
    reporters: [
      'detox/runners/jest/reporter',
      ['jest-allure2-reporter', {
        /* see https://github.com/wix-incubator/jest-allure2-reporter/blob/beta/index.d.ts */
      }],
    ],
    // ...
    testEnvironmentOptions: {
      eventListeners: [
        'jest-metadata/environment-listener',
        'jest-allure2-reporter/environment-listener',
        'detox-allure2-adapter',
      ],
    },
    // ...
}
```

Here's a brief explanation of what you just added:

- `reporters` section: We added Detox and the Allure2 reporter. The latter will enable us to generate Allure reports based on our Jest tests run with Detox.

- `testEnvironmentOptions` section: We added three event listener modules that will run during our tests — `jest-metadata`, `jest-allure2-reporter`, and `detox-allure2-adapter`. These listeners will collect necessary metadata and feed test result data to our Allure reports.

## Running Tests

After making these changes, you can run your tests as usual. The tests will run with Detox and Jest, and the results will be reported using Allure. Configure your `npm test` script in the `package.json` file to run your Detox tests.

Depending on how `jest-allure2-reporter` is configured, you should be able to see the Allure reports in the output directory `allure-results` (or the one that is specified by you). You will need the Allure command line tool to generate a report in a browser viewable format. The report data is present but needs Allure to view it in a human-readable format.
