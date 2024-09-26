 # thart

`thart` is a Node.js library for managing the lifecycle of multi-process applications. It provides a simple, flexible API for spawning and managing worker processes, handling graceful shutdowns, and coordinating between primary and worker processes.

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

### npm

```bash
npm install thart
```

### pnpm

```bash
pnpm add thart
```

### yarn

```bash
yarn add thart
```

# Usage

`thart` can be imported via ES6 imports or CommonJS require as a default or named import.


```javascript
import thart from 'thart';
// or
import { thart } from 'thart';
// or
const thart = require('thart');
// or
const { thart } = require('thart');
```

View more examples in the [examples](examples) directory.

### Basic Example

```javascript
import thart from 'thart';

await thart({
  worker: {
    count: 4,
    // allows TCP servers to be shared between workers
    type: 'cluster',
    start: async (id) => {
      console.log(`Worker ${id} starting`);
      // Your worker logic here
    },
    stop: async () => {
      console.log('Worker stopping');
      // Cleanup logic here
    }
  }
});
```

### Primary and Worker Processes

```javascript
import thart from 'thart';

await thart({
  primary: {
    // this runs before any workers are forked
    start: async () => {
      console.log('Primary process started');
      // Primary process initialization
    },
    // this runs after all workers have exited
    stop: async () => {
      console.log('Primary process stopping');
      // Primary process cleanup
    }
  },
  worker: {
    count: 2,
    type: 'childProcess',
    start: async (id) => {
      console.log(`Worker ${id} started`);
      // Worker process logic
    }
  }
});
```

### Multiple Worker Types

A powerful feature of `thart` is the ability to spawn multiple types of workers in the same application.

```javascript
import thart from 'thart';

await thart({
  worker: [
    {
      count: 2,
      type: 'cluster',
      start: async (id) => {
        console.log(`Cluster worker ${id} started`);
      }
    },
    {
      count: 1,
      type: 'childProcess',
      start: async (id) => {
        console.log(`Child process worker ${id} started`);
      }
    }
  ]
});
```

## API

### thart(options)

The main function to start your application.

#### Options

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

# License

`thart` is licensed under the [MIT License](LICENSE).

# Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
