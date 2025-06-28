export class ArtifactsWrapper {
  constructor(private readonly worker: any) {}

  get artifactsManager() {
    return this.worker._artifactsManager as ArtifactsManager;
  }
}

interface ArtifactsManager {
  _artifactPlugins: {
    log?: ArtifactPlugin;
  };
  on(event: string, callback: (...args: any[]) => void): void;
}

interface ArtifactPlugin {
  onBeforeCleanup: () => void;
  onBeforeLaunchApp: () => void;
  onBeforeShutdownDevice: () => void;
  onBeforeTerminateApp: () => void;
  onBootDevice: () => void;
  onHookFailure: () => void;
  onLaunchApp: () => void;
  onRunDescribeFinish: () => void;
  onRunDescribeStart: () => void;
  onShutdownDevice: () => void;
  onTerminate: () => void;
  onTerminateApp: () => void;
  onTestDone: () => void;
  onTestFnFailure: () => void;
  onTestStart: () => void;
}
