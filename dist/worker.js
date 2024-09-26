"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/worker.ts
var worker_exports = {};
__export(worker_exports, {
  startWorker: () => startWorker
});
module.exports = __toCommonJS(worker_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startWorker
});
//# sourceMappingURL=worker.js.map