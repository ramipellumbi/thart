/* --------------------------------------------------------------------------
   MIT License

   Copyright (c) 2024 Rami Pellumbi

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
 -----------------------------------------------------------------------------*/

import type { ShutdownManager } from "./async-shutdown";
import type { NormalizedThartOptions } from "./types";

export async function startWorker(options: NormalizedThartOptions, manager: ShutdownManager): Promise<void> {
    if (!options.worker) {
        throw new Error("Missing worker function");
    }
    const workerId = process.env.WORKER_ID;
    if (!workerId) {
        throw new Error("Worker ID not set");
    }
    const idx = Number.parseInt(workerId);
    const workerConfig = options.worker[idx];

    // if timeout is provided, then we fail to start if we do not start within the timout window
    if (workerConfig.startupTimeoutMs) {
        await Promise.race([
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Worker function timed out")), workerConfig.startupTimeoutMs),
            ),
            workerConfig.start(idx),
        ]);
    } else {
        await workerConfig.start(idx);
    }

    // after successful initialization, register the `stop` function to the listeners for this worker
    if (workerConfig.stop) {
        manager.addListener(workerConfig.stop);
    }
    // immediately kill this worker (shutdown will run if provided)
    if (workerConfig.killAfterCompleted) {
        await manager.killAfterCleanup();
    }
}
