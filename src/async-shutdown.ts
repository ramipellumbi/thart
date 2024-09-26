/**
 * This internal code is just about a carbon copy of: https://www.npmjs.com/package/async-cleanup
 * The license is ISC, found at: https://github.com/trevorr/async-cleanup/blob/master/LICENSE
 * Tests not included in this repository.
 */
export class ShutdownManager {
  private cleanupListeners: Set<CleanupListener> | undefined;

  // Listenable signals that terminate the process by default
  private static readonly SIGNALS: NodeJS.Signals[] = [
    "SIGBREAK", // Ctrl-Break on Windows
    "SIGHUP", // Parent terminal closed
    "SIGINT", // Terminal interrupt, usually by Ctrl-C
    "SIGTERM", // Graceful termination
    "SIGUSR1", // Used by Nodemon
    "SIGUSR2", // Used by Nodemon
  ];

  constructor() {
    this.installExitListeners();
    this.cleanupListeners = new Set();
  }

  /**
   * Adds a listener to be executed when the process is shutting down.
   * @param listener - The listener to be executed when the process is shutting down.
   * @throws If a listener is added after the process has started shutting down.
   */
  public addListener(listener: CleanupListener): void {
    if (this.cleanupListeners === undefined) {
      throw new Error("Cannot add cleanup listeners after cleanup");
    }
    this.cleanupListeners.add(listener);
  }

  public async killAfterCleanup(signal?: NodeJS.Signals): Promise<void> {
    await this.executeCleanupListeners();
    process.kill(process.pid, signal);
  }

  private async exitAfterCleanup(code: number): Promise<void> {
    await this.executeCleanupListeners();
    process.exitCode = code;
  }

  private async executeCleanupListeners(): Promise<void> {
    if (this.cleanupListeners === undefined) return;
    this.uninstallExitListeners();
    const listeners = this.cleanupListeners;
    this.cleanupListeners = undefined;
    const promises: Promise<void>[] = [];
    for (const listener of listeners) {
      try {
        const promise = listener();
        if (promise) promises.push(promise);
      } catch (err) {
        console.error(`Uncaught exception during cleanup ${err}`);
      }
    }
    const results = await Promise.allSettled(promises);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`Unhandled rejection during cleanup ${result.reason}`);
      }
    }
  }

  private beforeExitListener = (code: number): void => {
    console.debug(`Exiting with code ${code} due to empty event loop`);
    void this.exitAfterCleanup(code);
  };

  private uncaughtExceptionListener = (error: Error): void => {
    console.error("Exiting with code 1 due to uncaught exception", error, "\n");
    void this.exitAfterCleanup(1);
  };

  private signalListener = (signal: NodeJS.Signals): void => {
    console.debug(`Exiting due to signal ${signal}`);
    void this.killAfterCleanup(signal);
  };

  private installExitListeners(): void {
    process.on("beforeExit", this.beforeExitListener);
    process.on("uncaughtException", this.uncaughtExceptionListener);
    ShutdownManager.SIGNALS.forEach((signal) => {
      process.on(signal, this.signalListener);
    });
  }

  private uninstallExitListeners(): void {
    process.removeListener("beforeExit", this.beforeExitListener);
    process.removeListener("uncaughtException", this.uncaughtExceptionListener);
    ShutdownManager.SIGNALS.forEach((signal) => {
      process.removeListener(signal, this.signalListener);
    });
  }
}

type CleanupListener = () => void | Promise<void>;
