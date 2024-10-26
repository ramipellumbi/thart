# thart

`thart` is a Node.js library for managing the lifecycle of multi-process applications. It provides a simple, flexible API for spawning and managing worker processes, handling graceful shutdowns, and coordinating between primary and worker processes.

**IMPORTANT** `thart` and all future versions are now installable from `@ramplex/thart`. The original `thart` package has been deprecated and will no longer be maintained.

Acknowledgements:

- `thart` was inspired by [throng](https://github.com/hunterloftis/throng) and shamelessly uses a lot of code from [async-cleanup](https://www.npmjs.com/package/async-cleanup) to manage process cleanup.

# Features

- Spawn and manage multiple worker processes
- Support for both `node:cluster` and `node:child_process` worker types
- Graceful and coordinated shutdown handling
- Configurable startup and shutdown behaviors
- Timeout handling for worker startup
- Flexible API supporting various application structures

# Installation

Thart is on the npm registry. Install it with your choice of npm, yarn, or pnpm.

```bash
npm install @ramplex/thart
yarn add @ramplex/thart
pnpm add @ramplex/thart
```

# Usage

`thart` can be imported via ES6 imports or CommonJS require as a default or named import.

```javascript
import thart from "@ramplex/thart";
// or
import { thart } from "@ramplex/thart";
// or
const thart = require("@ramplex/thart");
// or
const { thart } = require("@ramplex/thart");
```

View more examples in the [examples](examples) directory.

### Basic Example

```javascript
import thart from "@ramplex/thart";

await thart({
  worker: {
    count: 4,
    // allows TCP servers to be shared between workers
    type: "cluster",
    start: async (id) => {
      console.log(`Worker ${id} starting`);
      // Your worker logic here
    },
    stop: async () => {
      console.log("Worker stopping");
      // Cleanup logic here
    },
  },
});
```

### Primary and Worker Processes

```javascript
import thart from "@ramplex/thart";

await thart({
  primary: {
    // this runs before any workers are forked
    start: async () => {
      console.log("Primary process started");
      // Primary process initialization
    },
    // this runs after all workers have exited
    stop: async () => {
      console.log("Primary process stopping");
      // Primary process cleanup
    },
  },
  worker: {
    count: 2,
    type: "childProcess",
    start: async (id) => {
      console.log(`Worker ${id} started`);
      // Worker process logic
    },
  },
});
```

### Multiple Worker Types

A powerful feature of `thart` is the ability to spawn multiple types of workers in the same application. This lets you seperate out,
e.g., cron job processes from a cluster handling HTTP requests.

```javascript
import thart from "@ramplex/thart";

await thart({
  worker: [
    {
      count: 2,
      type: "cluster",
      start: async (id) => {
        console.log(`Cluster worker ${id} started`);
      },
    },
    {
      count: 1,
      type: "childProcess",
      start: async (id) => {
        console.log(`Child process worker ${id} started`);
      },
    },
  ],
});
```

# Notes on Process Groups

When using `thart` to start up your node application, ensure you execute

```bash
node entrypoint.js
```

directly instead of using package managers like `pnpm` to start your application.
Package managers like pnpm seem to change the way signals are propagated, interfering with the libraries ability to shut down gracefully.

# API

## thart(options)

The main function to start your application.

### Options

- `grace` (optional): Grace period in milliseconds for shutdown. Default: 10000 (10 seconds)
- `primary` (optional): Configuration for the primary process
  - `start`: Function to run when the primary process starts
  - `stop` (optional): Function to run when the primary process is shutting down
- `worker`: Configuration for worker processes. Can be a single object or an array of objects
  - `count`: Number of worker processes to spawn (when using an array of objects, this is optional and defaults to 1)
  - `type`: Type of worker process ('cluster' or 'childProcess')
  - `start`: Function to run in each worker process
  - `stop` (optional): Function to run when a worker process is shutting down
  - `startupTimeoutMs` (optional): Timeout for worker startup in milliseconds
  - `killAfterCompleted` (optional): If true, kills the worker after the start function completes

## Types & Overloads

### Types

```typescript
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
```

### Signatures

```typescript
/**
 * Start your node application with a primary process only.
 * @param {PrimaryThartOptions} opts
 * @param {number} opts.grace (optional) The grace period in milliseconds to allow for the primary process to shut down before forcefully exiting. Default is 10000 (10 seconds).
 * @param {PrimaryFunction} opts.primary The primary function configuration to be executed in the primary process
 * @param {PrimaryFunction["start"]} opts.primary.start The function to be executed in the primary process when the primary process starts
 * @param {PrimaryFunction["stop"]} opts.primary.stop (optional) The function to be executed in the primary process when the primary process is shutting down
 * @returns {Promise<void>}
 */
export async function thart(opts: PrimaryThartOptions): Promise<void>;
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
export async function thart(opts: WorkerThartOptions): Promise<void>;
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
export async function thart(opts: WorkerArrayThartOptions): Promise<void>;
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
export async function thart(opts: PrimaryAndSingleWorkerOptions): Promise<void>;
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
export async function thart(opts: PrimaryAndArrayWorkerOptions): Promise<void>;
```

# License

`thart` is licensed under the [MIT License](LICENSE).

# Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
