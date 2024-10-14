import { type ChildProcess, fork } from "node:child_process";
import cluster, { type Worker } from "node:cluster";
import type { ShutdownManager } from "./async-shutdown";
import { type NormalizedThartOptions, WORKER_TYPES, type WorkerFunction } from "./types";

export async function startPrimary(options: NormalizedThartOptions, manager: ShutdownManager): Promise<void> {
  if (!cluster.isPrimary) {
    throw new Error("Can not invoke `startPrimary` outside of `primary`");
  }
  if (options.primary) await options.primary.start();
  const childProcesses: ChildProcess[] = [];
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

export function spawnWorker(i: number, workerConfig: WorkerFunction, childProcesses: ChildProcess[]): void {
  if (workerConfig.type === WORKER_TYPES.child) {
    const childProcess = fork(process.argv[1], [], {
      env: {
        ...process.env,
        WORKER_ID: i.toString(),
        WORKER_TYPE: WORKER_TYPES.child,
      },
    });
    childProcesses.push(childProcess);
  } else if (workerConfig.type === WORKER_TYPES.cluster) {
    cluster.fork({
      WORKER_ID: i.toString(),
      WORKER_TYPE: WORKER_TYPES.cluster,
    });
  } else throw new Error(`Invalid worker type: ${workerConfig.type}`);
}

/**
 * Waits for all workers and child processes to terminate within a specified grace period.
 *
 * This function periodically checks the status of cluster workers and child processes.
 * It resolves when all workers and child processes have terminated.
 * If the grace period expires before all workers and child processes have terminated,
 * it forcibly terminates them and rejects with an error.
 *
 * @param {number} grace - The maximum time (in milliseconds) to wait for workers and child processes to terminate.
 * @param {ChildProcess[]} childProcesses - An array of child processes to monitor.
 * @returns {Promise<void>} A promise that resolves when all workers and child processes have terminated,
 *                          or rejects if the grace period expires.
 * @throws {Error} If the grace period expires before all workers and child processes terminate.
 */
export function waitForWorkersWithTimeout(grace: number, childProcesses: ChildProcess[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const intervalId = setInterval(() => {
      const workers = getConnectedWorkers();
      // really this triggers when the cluster workers array is empty but we keep the isDead
      // check for the case where cluster.workers returns a dictionary containing dead workers
      // (though I have never observed this to be the case)
      const allWorkersDead = workers.every((w) => !!w && w.isDead());
      const allChildProcessesDead = childProcesses.every(
        // need the `exitCode` check to ensure we count processes that exited due to:
        // 1) empty event loop
        // 2) process.exit invocations
        (child) => child.signalCode !== null || child.exitCode !== null,
      );

      if (allWorkersDead && allChildProcessesDead) {
        clearInterval(intervalId);
        resolve();
      }

      if (Date.now() - startTime >= grace) {
        console.error("Forcibly terminating workers after grace period");
        clearInterval(intervalId);
        for (const worker of workers) {
          if (worker) worker.kill();
        }
        for (const cp of childProcesses) {
          cp.kill();
        }
        reject(new Error("Forcibly terminated workers after grace period"));
      }
    }, 100);
  });
}

/**
 * @returns An array of active workers in the cluster if invoked in the primary process, else an empty array.
 */
function getConnectedWorkers(): (Worker | undefined)[] {
  return Object.values(cluster.workers ?? {});
}
