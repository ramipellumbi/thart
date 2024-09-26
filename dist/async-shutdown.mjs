// src/async-shutdown.ts
var ShutdownManager = class _ShutdownManager {
  constructor() {
    this.beforeExitListener = (code) => {
      console.debug(`Exiting with code ${code} due to empty event loop`);
      void this.exitAfterCleanup(code);
    };
    this.uncaughtExceptionListener = (error) => {
      console.error("Exiting with code 1 due to uncaught exception", error, "\n");
      void this.exitAfterCleanup(1);
    };
    this.signalListener = (signal) => {
      console.debug(`Exiting due to signal ${signal}`);
      void this.killAfterCleanup(signal);
    };
    this.installExitListeners();
    this.cleanupListeners = /* @__PURE__ */ new Set();
  }
  static {
    // Listenable signals that terminate the process by default
    this.SIGNALS = [
      "SIGBREAK",
      // Ctrl-Break on Windows
      "SIGHUP",
      // Parent terminal closed
      "SIGINT",
      // Terminal interrupt, usually by Ctrl-C
      "SIGTERM",
      // Graceful termination
      "SIGUSR1",
      // Used by Nodemon
      "SIGUSR2"
      // Used by Nodemon
    ];
  }
  /**
   * Adds a listener to be executed when the process is shutting down.
   * @param listener - The listener to be executed when the process is shutting down.
   * @throws If a listener is added after the process has started shutting down.
   */
  addListener(listener) {
    if (this.cleanupListeners === void 0) {
      throw new Error("Cannot add cleanup listeners after cleanup");
    }
    this.cleanupListeners.add(listener);
  }
  async killAfterCleanup(signal) {
    await this.executeCleanupListeners();
    process.kill(process.pid, signal);
  }
  async exitAfterCleanup(code) {
    await this.executeCleanupListeners();
    process.exitCode = code;
  }
  async executeCleanupListeners() {
    if (this.cleanupListeners === void 0) return;
    this.uninstallExitListeners();
    const listeners = this.cleanupListeners;
    this.cleanupListeners = void 0;
    const promises = [];
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
  installExitListeners() {
    process.on("beforeExit", this.beforeExitListener);
    process.on("uncaughtException", this.uncaughtExceptionListener);
    _ShutdownManager.SIGNALS.forEach((signal) => {
      process.on(signal, this.signalListener);
    });
  }
  uninstallExitListeners() {
    process.removeListener("beforeExit", this.beforeExitListener);
    process.removeListener("uncaughtException", this.uncaughtExceptionListener);
    _ShutdownManager.SIGNALS.forEach((signal) => {
      process.removeListener(signal, this.signalListener);
    });
  }
};
export {
  ShutdownManager
};
//# sourceMappingURL=async-shutdown.mjs.map