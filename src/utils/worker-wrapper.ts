export class WorkerWrapper {
  constructor(private readonly worker: any) {}

  get asyncWebSocket() {
    return this.worker._client._asyncWebSocket as AsyncWebSocket;
  }

  get eventEmitter() {
    return this.worker._eventEmitter as EventEmitter;
  }

  get xcuitestRunner() {
    if (typeof this.worker.system !== 'function') {
      return;
    }

    return this.worker.system().element(this.worker.by.system.label(''))
      ._xcuitestRunner as XCUITestRunner;
  }
}

interface EventEmitter {
  on(event: 'beforeLaunchApp', callback: () => void): void;
  on(event: 'launchApp', callback: (event: { pid: number }) => void): void;
  on(event: 'terminateApp', callback: () => void): void;
}

interface AsyncWebSocket {
  send: (...args: any[]) => Promise<WebSocketResult>;
}

interface XCUITestRunner {
  // NOTE: { type?: string } is not accurate, but it does not cause bugs per se
  execute: (...args: any[]) => Promise<{ type?: string }>;
}

export interface WebSocketResult {
  type?: string;
  params?: {
    viewHierarchy?: string;
    viewHierarchyURL?: string;
    NSLocalizedDescription?: string;
    details?: string;
    DetoxFailureInformation?: {
      lineNumber?: number;
      file?: string;
      functionName?: string;
    };
  };
}
