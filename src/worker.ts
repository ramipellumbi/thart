import type { ShutdownManager } from "./async-shutdown";
import type { NormalizedThartOptions } from "./types";

const STARTUP_TIMEOUT_MS = 5000;

export async function startWorker(
  options: NormalizedThartOptions,
  manager: ShutdownManager,
): Promise<void> {
  if (!options.worker) throw new Error("Missing worker function");
  const workerId = process.env.WORKER_ID;
  if (!workerId) throw new Error("Worker ID not set");
  const idx = Number.parseInt(workerId);
  const workerConfig = options.worker[idx];

  // if timeout is provided, then we fail to start if we do not start within the timout window
  if (workerConfig.startupTimeoutMs) {
    await Promise.race([
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Worker function timed out")),
          workerConfig.startupTimeoutMs,
        ),
      ),
      workerConfig.start(idx),
    ]);
  } else await workerConfig.start(idx);

  // after successful initialization, register the `stop` function to the listeners for this worker
  if (workerConfig.stop) {
    manager.addListener(workerConfig.stop);
  }
  // immediately kill this worker (shutdown will run if provided)
  if (workerConfig.killAfterCompleted) {
    await manager.killAfterCleanup();
  }
}
