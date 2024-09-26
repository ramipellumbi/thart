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
export {
  startWorker
};
//# sourceMappingURL=worker.mjs.map