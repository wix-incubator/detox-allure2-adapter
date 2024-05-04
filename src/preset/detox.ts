const config: Partial<Detox.DetoxConfig> = {
  artifacts: {
    rootDir: 'artifacts/',
    pathBuilder: 'detox-allure2-adapter/path-builder',
    plugins: {
      log: 'failing',
      screenshot: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
        shouldTakeAutomaticSnapshots: true,
        takeWhen: {
          testStart: false,
          testFailure: true,
          testDone: false,
          appNotReady: true,
        },
      },
      uiHierarchy: 'enabled',
    },
  },
};

export default config as object;
