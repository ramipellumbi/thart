// src/thart.ts
import cluster2 from "node:cluster";

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

// src/primary.ts
import { fork } from "node:child_process";
import cluster from "node:cluster";

// src/types.ts
var WORKER_TYPES = {
  child: "childProcess",
  cluster: "cluster"
};

// src/primary.ts
async function startPrimary(options, manager) {
  if (!cluster.isPrimary) {
    throw new Error("Can not invoke `startPrimary` outside of `primary`");
  }
  if (options.primary) await options.primary.start();
  const childProcesses = [];
  manager.addListener(async () => {
    try {
      await waitForWorkersWithTimeout(options.grace, childProcesses);
    } finally {
      if (options.primary?.stop) await options.primary.stop();
      process.exitCode = 0;
    }
  });
  for (let i = 0; i < options.worker.length; i++) {
    spawnWorker(i, options.worker[i], childProcesses);
  }
}
function spawnWorker(i, workerConfig, childProcesses) {
  if (workerConfig.type === WORKER_TYPES.child) {
    const childProcess = fork(process.argv[1], [], {
      env: {
        ...process.env,
        WORKER_ID: i.toString(),
        WORKER_TYPE: WORKER_TYPES.child
      }
    });
    childProcesses.push(childProcess);
  } else if (workerConfig.type === WORKER_TYPES.cluster) {
    cluster.fork({
      WORKER_ID: i.toString(),
      WORKER_TYPE: WORKER_TYPES.cluster
    });
  } else throw new Error(`Invalid worker type: ${workerConfig.type}`);
}
function waitForWorkersWithTimeout(grace, childProcesses) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const workers = getConnectedWorkers();
      const allWorkersDead = workers.every((w) => !!w && w.isDead());
      const allChildProcessesDead = childProcesses.every(
        // need the `exitCode` check to ensure we count processes that exited due to:
        // 1) empty event loop
        // 2) process.exit invocations
        (child) => child.signalCode !== null || child.exitCode !== null
      );
      if (allWorkersDead && allChildProcessesDead) {
        clearInterval(intervalId);
        resolve();
      }
      if (Date.now() - startTime >= grace) {
        console.error("Forcibly terminating workers after grace period");
        clearInterval(intervalId);
        workers.forEach((worker) => worker?.kill());
        childProcesses.forEach((cp) => cp.kill());
        reject(new Error("Forcibly terminated workers after grace period"));
      }
    }, 100);
  });
}
function getConnectedWorkers() {
  return Object.values(cluster.workers ?? {});
}

// src/validators.ts
var validateOptions = (opts) => {
  if (typeof opts !== "object" || opts === null) {
    throw new TypeError("Options must be an optiona");
  }
  if (!("primary" in opts) && !("worker" in opts)) {
    throw new TypeError("Must specify a `primary` or `worker` config");
  }
  if ("grace" in opts) {
    if (typeof opts.grace !== "number" || opts.grace < 0) {
      throw new TypeError("Grace period must be a non-negative number");
    }
  }
  if ("primary" in opts) _validatePrimaryFunction(opts.primary);
  if ("worker" in opts) {
    if (Array.isArray(opts.worker)) {
      opts.worker.forEach(_validateWorkerFunction);
    } else {
      _validateWorkerFunction(opts.worker);
    }
  }
};
var _validatePrimaryFunction = (primary) => {
  if (typeof primary !== "object" || primary === null) {
    throw new TypeError("Primary configuration must be an object");
  }
  if (typeof primary.start !== "function") {
    throw new TypeError("Primary start must be a provided function");
  }
  if ("stop" in primary && typeof primary.stop !== "function") {
    throw new TypeError("Primary stop, if provided, must be a function");
  }
};
var _validateWorkerFunction = (worker) => {
  if (typeof worker !== "object" || worker === null) {
    throw new TypeError("Worker configuration must be an object");
  }
  if (typeof worker.start !== "function") {
    throw new TypeError("Worker start must be a provided function");
  }
  if (!["childProcess", "cluster"].includes(worker.type)) {
    throw new TypeError(
      'Worker type must be either "childProcess" or "cluster"'
    );
  }
  if ("stop" in worker && typeof worker.stop !== "function") {
    throw new TypeError("Worker stop, if provided, must be a function");
  }
  if ("startupTimeoutMs" in worker) {
    if (typeof worker.startupTimeoutMs !== "number" || worker.startupTimeoutMs < 0) {
      throw new TypeError(
        "Worker startupTimeoutMs, if provided, must be a non-negative number"
      );
    }
  }
  if ("count" in worker) {
    const count = worker.count;
    if (typeof count !== "number" || count < 1 || !Number.isInteger(count)) {
      throw new TypeError("Worker count must be a positive integer");
    }
  }
  if ("killAfterCompleted" in worker && typeof worker.killAfterCompleted !== "boolean") {
    throw new TypeError(
      "Worker killAfterCompleted, if provided, must be a boolean"
    );
  }
};

// src/worker.ts
async function startWorker(options, manager) {
  if (!options.worker) throw new Error("Missing worker function");
  const workerId = process.env.WORKER_ID;
  if (!workerId) throw new Error("Worker ID not set");
  const idx = Number.parseInt(workerId);
  const workerConfig = options.worker[idx];
  if (workerConfig.startupTimeoutMs) {
    await Promise.race([
      new Promise(
        (_, reject) => setTimeout(
          () => reject(new Error("Worker function timed out")),
          workerConfig.startupTimeoutMs
        )
      ),
      workerConfig.start(idx)
    ]);
  } else await workerConfig.start(idx);
  if (workerConfig.stop) {
    manager.addListener(workerConfig.stop);
  }
  if (workerConfig.killAfterCompleted) {
    await manager.killAfterCleanup();
  }
}

// src/thart.ts
var DEFAULT_GRACE = 1e4;
var DEFAULT_WORKER_COUNT = 1;
var thart_default = thart;
async function thart(opts) {
  validateOptions(opts);
  const normalizedOptions = normalizeOptions(opts);
  const manager = new ShutdownManager();
  console.log(normalizedOptions);
  if (process.env.WORKER_TYPE === WORKER_TYPES.child) {
    await startWorker(normalizedOptions, manager);
  } else if (cluster2.isPrimary) {
    await startPrimary(normalizedOptions, manager);
  } else if (cluster2.worker) {
    await startWorker(normalizedOptions, manager);
  }
}
function normalizeOptions(options) {
  const primary = "primary" in options ? options.primary : void 0;
  const worker = normalizeWorkerOptions(options);
  const grace = options.grace ?? DEFAULT_GRACE;
  return { primary, worker, grace };
}
function normalizeWorkerOptions(options) {
  if (!("worker" in options)) return [];
  const workers = [];
  if (Array.isArray(options.worker)) {
    for (const worker of options.worker) {
      for (let i = 0; i < (worker.count ?? DEFAULT_WORKER_COUNT); i++) {
        workers.push(_getWorker(worker));
      }
    }
  } else {
    for (let i = 0; i < options.worker.count; i++) {
      workers.push(_getWorker(options.worker));
    }
  }
  return workers;
}
var _getWorker = (worker) => ({
  start: worker.start,
  stop: worker.stop,
  type: worker.type,
  killAfterCompleted: worker.killAfterCompleted,
  startupTimeoutMs: worker.startupTimeoutMs
});
export {
  thart_default as default,
  thart
};
//# sourceMappingURL=thart.mjs.map