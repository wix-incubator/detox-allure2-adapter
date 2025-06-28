export class WorkerWrapper {
  constructor(private readonly worker: any) {}

  get artifactsManager() {
    return this.worker._artifactsManager as ArtifactsManager;
  }

  get eventEmitter() {
    return this.worker._eventEmitter as EventEmitter;
  }
}

interface ArtifactsManager {
  _artifactPlugins: {
    log?: ArtifactPlugin;
  };
  on(event: string, callback: (...args: any[]) => void): void;
}

interface EventEmitter {
  on(event: 'beforeLaunchApp', callback: () => void): void;
  on(event: 'launchApp', callback: (event: { pid: number }) => void): void;
  on(event: 'terminateApp', callback: () => void): void;
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
