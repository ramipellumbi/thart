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
export {
  spawnWorker,
  startPrimary,
  waitForWorkersWithTimeout
};
//# sourceMappingURL=primary.mjs.map