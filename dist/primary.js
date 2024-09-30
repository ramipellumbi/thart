"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/primary.ts
var primary_exports = {};
__export(primary_exports, {
  spawnWorker: () => spawnWorker,
  startPrimary: () => startPrimary,
  waitForWorkersWithTimeout: () => waitForWorkersWithTimeout
});
module.exports = __toCommonJS(primary_exports);
var import_node_child_process = require("child_process");
var import_node_cluster = __toESM(require("cluster"));

// src/types.ts
var WORKER_TYPES = {
  child: "childProcess",
  cluster: "cluster"
};

// src/primary.ts
async function startPrimary(options, manager) {
  if (!import_node_cluster.default.isPrimary) {
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
    const childProcess = (0, import_node_child_process.fork)(process.argv[1], [], {
      env: {
        ...process.env,
        WORKER_ID: i.toString(),
        WORKER_TYPE: WORKER_TYPES.child
      }
    });
    childProcesses.push(childProcess);
  } else if (workerConfig.type === WORKER_TYPES.cluster) {
    import_node_cluster.default.fork({
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
  return Object.values(import_node_cluster.default.workers ?? {});
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  spawnWorker,
  startPrimary,
  waitForWorkersWithTimeout
});
//# sourceMappingURL=primary.js.map