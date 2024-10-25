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

interface CommonThartOptions {
    /**
     * The grace period for shutting down worker processes in milliseconds.
     * This determines how long to wait for workers to finish their tasks before forcefully terminating them.
     *
     * @default 10000 (10 seconds)
     */
    grace?: number;
}

type PrimaryFunction = {
    /**
     * A function to be executed in the primary process (there is only one primary process).
     */
    start: () => Promise<void> | void;
    /**
     * A function to be executed in the primary process when the primary process is shutting down.
     * This gets invoked AFTER all worker processes have been shut down.
     */
    stop?: () => Promise<void> | void;
};

type WorkerCount = {
    /**
     * A function to be executed in each worker process when the worker process is shutting down.
     * @param id - The id of the worker process.
     * @returns A promise that resolves when the worker process has completed.
     */
    /**
     * The number of worker processes to spawn.
     */
    count: number;
};

type WorkerFunction = {
    /**
     * A function to be executed in each worker process (there is no limit to the number of worker processes).
     * @param id - The id of the worker process.
     * @returns A promise that resolves when the worker process has completed.
     */
    start: (id: number) => Promise<void> | void;
    /**
     * The type of worker process to use.
     * "childProcess" will use Node.js child processes.
     * "cluster" will use Node.js cluster module.
     *
     * You should use:
     * - "cluster" allows TCP servers to be shared between workers and is thus recommended when using TCP servers.
     * - "childProcess" is recommended for CPU-bound tasks / jobs that can be run independently.
     */
    type: "childProcess" | "cluster";
    /**
     * Determines whether the worker process should be terminated after completing its task.
     * By default, when all work in the process is done, the node process that executed the worker is still kept alive.
     * If you want to terminate the node process after completing its task, set this to true.
     *
     * @default false
     */
    killAfterCompleted?: boolean;
    /**
     * A function to be executed in each worker process when the worker process is shutting down.
     */
    stop?: () => Promise<void> | void;
    /**
     * The timeout duration for the worker function in milliseconds.
     * If the worker function takes longer than this duration, it will be forcefully terminated.
     *
     * @default 3000 (3 seconds)
     */
    startupTimeoutMs?: number;
};

type PrimaryThartOptions = CommonThartOptions & {
    primary: PrimaryFunction;
};

type WorkerThartOptions = CommonThartOptions & {
    worker: WorkerFunction & WorkerCount;
};

type WorkerArrayThartOptions = CommonThartOptions & {
    worker: (WorkerFunction & Partial<WorkerCount>)[];
};

type PrimaryAndSingleWorkerOptions = PrimaryThartOptions & WorkerThartOptions;

type PrimaryAndArrayWorkerOptions = PrimaryThartOptions & WorkerArrayThartOptions;

type ThartOptions =
    | PrimaryThartOptions
    | WorkerThartOptions
    | WorkerArrayThartOptions
    | PrimaryAndSingleWorkerOptions
    | PrimaryAndArrayWorkerOptions;

interface NormalizedThartOptions {
    primary: PrimaryFunction | undefined;
    worker: WorkerFunction[];
    grace: number;
}

export const WORKER_TYPES = {
    child: "childProcess",
    cluster: "cluster",
} as const;

export type {
    ThartOptions,
    NormalizedThartOptions,
    PrimaryAndArrayWorkerOptions,
    PrimaryAndSingleWorkerOptions,
    PrimaryFunction,
    PrimaryThartOptions,
    WorkerArrayThartOptions,
    WorkerCount,
    WorkerThartOptions,
    WorkerFunction,
};
