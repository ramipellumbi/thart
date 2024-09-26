import { PrimaryThartOptions, WorkerThartOptions, WorkerArrayThartOptions, PrimaryAndSingleWorkerOptions, PrimaryAndArrayWorkerOptions } from './types.mjs';

/**
 * Start your node application with a primary process only.
 * @param {PrimaryThartOptions} opts
 * @param {number} opts.grace (optional) The grace period in milliseconds to allow for the primary process to shut down before forcefully exiting. Default is 10000 (10 seconds).
 * @param {PrimaryFunction} opts.primary The primary function configuration to be executed in the primary process
 * @param {PrimaryFunction["start"]} opts.primary.start The function to be executed in the primary process when the primary process starts
 * @param {PrimaryFunction["stop"]} opts.primary.stop (optional) The function to be executed in the primary process when the primary process is shutting down
 * @returns {Promise<void>}
 */
declare function thart(opts: PrimaryThartOptions): Promise<void>;
/**
 * Start your node application by spawning `count` workers
 * @param {WorkerThartOptions} opts
 * @param {number} opts.grace (optional) The grace period in milliseconds to allow for the primary process to shut down before forcefully exiting. Default is 10000 (10 seconds).
 * @param {WorkerFunction} opts.worker The worker function configuration to be executed in every worker process
 * @param {WorkerFunction["start"]} opts.worker.start The function to be executed in each worker process
 * @param {WorkerFunction["type"]} opts.worker.type The type of child process to use.
 *  - `childProcess` uses `node:child_process` `fork`
 *  - `cluster` uses `node:cluster` `fork`
 * @param {WorkerFunction["count"]} opts.worker.count The number of worker processes to spawn
 * @param {WorkerFunction["stop"]}  opts.worker.stop (optional) The function to be executed in the each worker process when shut down.
 *  If it is not provided, nothing is processed on process death.
 * @param {WorkerFunction["startupTimeoutMs"]} opts.worker.startupTimeoutMs (optional) The time to wait for each workers start function to finish executing.
 *  - If the worker fails to start in the allotted time, the worker process is exited.
 *  - If it is not provided, there is no timeout.
 *  - In the event a stop function was provided, it is not invoked.
 * @param {WorkerFunction["killAfterCompleted"]} opts.worker.killAfterCompleted (optional) When set to `true`, the process will exit after the start function is completed.
 * @returns {Promise<void>}
 */
declare function thart(opts: WorkerThartOptions): Promise<void>;
/**
 * Start your node application by spawning multiple types of workers
 * @param {WorkerArrayThartOptions} opts
 * @param {number} opts.grace (optional) The grace period in milliseconds to allow for the primary process to shut down before forcefully exiting. Default is 10000 (10 seconds)
 * @param {(WorkerFunction & Partial<WorkerCount>)[]} opts.worker An array of worker configurations
 * @param {WorkerFunction["start"]} opts.worker[].start The function to be executed in this worker process
 * @param {WorkerFunction["type"]} opts.worker[].type The type of child process to use in this worker process
 *  - `childProcess` uses `node:child_process` `fork`
 *  - `cluster` uses `node:cluster` `fork`
 * @param {WorkerFunction["count"]} [opts.worker[].count] (optional) The number of worker processes to spawn for this worker configuration. Defaults to 1 if not specified
 * @param {WorkerFunction["stop"]} [opts.worker[].stop] (optional) The function to be executed in this worker process when shut down
 *  If it is not provided, nothing is processed on process death.
 * @param {WorkerFunction["startupTimeoutMs"]} [opts.worker[].startupTimeoutMs] (optional) The time to wait for this worker's start function to finish executing.
 *  - If the worker fails to start in the allotted time, the worker process is exited.
 *  - If it is not provided, there is no timeout.
 *  - In the event a stop function was provided, it is not invoked.
 * @param {WorkerFunction["killAfterCompleted"]} [opts.worker[].killAfterCompleted] (optional) When set to `true`, the process will exit after the start function is completed.
 * @returns {Promise<void>}
 */
declare function thart(opts: WorkerArrayThartOptions): Promise<void>;
/**
 * Start your node application with both a primary process and a single type of worker processes
 * @param {PrimaryAndSingleWorkerOptions} opts
 * @param {number} [opts.grace] (optional) The grace period in milliseconds to allow for processes to shut down before forcefully exiting. Default is 10000 (10 seconds).
 * @param {PrimaryFunction} opts.primary The primary function configuration to be executed in the primary process
 * @param {PrimaryFunction["start"]} opts.primary.start The function to be executed in the primary process when it starts
 * @param {PrimaryFunction["stop"]} [opts.primary.stop] (optional) The function to be executed in the primary process when it's shutting down
 * @param {WorkerFunction & WorkerCount} opts.worker The worker function configuration to be executed in every worker process
 * @param {WorkerFunction["start"]} opts.worker.start The function to be executed in each worker process
 * @param {WorkerFunction["type"]} opts.worker.type The type of child process to use.
 *  - `childProcess` uses `node:child_process` `fork`
 *  - `cluster` uses `node:cluster` `fork`
 * @param {WorkerCount["count"]} opts.worker.count The number of worker processes to spawn
 * @param {WorkerFunction["stop"]} [opts.worker.stop] (optional) The function to be executed in each worker process when shutting down.
 *  If not provided, nothing is computed on process termination.
 * @param {WorkerFunction["startupTimeoutMs"]} [opts.worker.startupTimeoutMs] (optional) The time in milliseconds to wait for each worker's start function to finish executing.
 *  - If the worker fails to start in the allotted time, the worker process is exited.
 *  - If not provided, there is no timeout.
 *  - In the event a stop function was provided, it is not invoked on timeout.
 * @param {WorkerFunction["killAfterCompleted"]} [opts.worker.killAfterCompleted] (optional) When set to `true`, the worker process will exit after its start function is completed.
 * @returns {Promise<void>}
 */
declare function thart(opts: PrimaryAndSingleWorkerOptions): Promise<void>;
/**
 * Start your node application with both a primary process and multiple types of worker processes
 * @param {PrimaryAndArrayWorkerOptions} opts
 * @param {number} [opts.grace] (optional) The grace period in milliseconds to allow for processes to shut down before forcefully exiting. Default is 10000 (10 seconds).
 * @param {PrimaryFunction} opts.primary The primary function configuration to be executed in the primary process
 * @param {PrimaryFunction["start"]} opts.primary.start The function to be executed in the primary process when it starts
 * @param {PrimaryFunction["stop"]} [opts.primary.stop] (optional) The function to be executed in the primary process when it's shutting down
 * @param {(WorkerFunction & Partial<WorkerCount>)[]} opts.worker An array of worker configurations
 * @param {WorkerFunction["start"]} opts.worker[].start The function to be executed in the worker processes spawned from this config
 * @param {WorkerFunction["type"]} opts.worker[].type The type of child process to use for this worker type.
 *  - `childProcess` uses `node:child_process` `fork`
 *  - `cluster` uses `node:cluster` `fork`
 * @param {WorkerFunction["count"]} [opts.worker[].count] (optional) The number of worker processes to spawn for this worker type. Defaults to 1 if not specified.
 * @param {WorkerFunction["stop"]} [opts.worker[].stop] (optional) The function to be executed in the worker processes spawned from this config when shutting down.
 *  If not provided, nothing is computed on process termination.
 * @param {WorkerFunction["startupTimeoutMs"]} [opts.worker[].startupTimeoutMs] (optional) The time in milliseconds to wait for each worker's start function to finish executing.
 *  - If the worker fails to start in the allotted time, the worker process is exited.
 *  - If not provided, there is no timeout.
 *  - In the event a stop function was provided, it is not invoked on timeout.
 * @param {WorkerFunction["killAfterCompleted"]} [opts.worker[].killAfterCompleted] (optional) When set to `true`, the worker process will exit after its start function is completed.
 * @returns {Promise<void>}
 */
declare function thart(opts: PrimaryAndArrayWorkerOptions): Promise<void>;

export { thart as default, thart };
