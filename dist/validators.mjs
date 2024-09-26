// src/validators.ts
var validateOptions = (opts) => {
  if (typeof opts !== "object" || opts === null) {
    throw new TypeError("Options must be an optiona");
  }
  if (!("primary" in opts) && !("worker" in opts)) {
    throw new TypeError("Must specify a `primary` or `worker` config");
  }
  if ("grace" in opts) {
    if (typeof opts.grace !== "number" || opts.grace < 0) {
      throw new TypeError("Grace period must be a non-negative number");
    }
  }
  if ("primary" in opts) _validatePrimaryFunction(opts.primary);
  if ("worker" in opts) {
    if (Array.isArray(opts.worker)) {
      opts.worker.forEach(_validateWorkerFunction);
    } else {
      _validateWorkerFunction(opts.worker);
    }
  }
};
var _validatePrimaryFunction = (primary) => {
  if (typeof primary !== "object" || primary === null) {
    throw new TypeError("Primary configuration must be an object");
  }
  if (typeof primary.start !== "function") {
    throw new TypeError("Primary start must be a provided function");
  }
  if ("stop" in primary && typeof primary.stop !== "function") {
    throw new TypeError("Primary stop, if provided, must be a function");
  }
};
var _validateWorkerFunction = (worker) => {
  if (typeof worker !== "object" || worker === null) {
    throw new TypeError("Worker configuration must be an object");
  }
  if (typeof worker.start !== "function") {
    throw new TypeError("Worker start must be a provided function");
  }
  if (!["childProcess", "cluster"].includes(worker.type)) {
    throw new TypeError(
      'Worker type must be either "childProcess" or "cluster"'
    );
  }
  if ("stop" in worker && typeof worker.stop !== "function") {
    throw new TypeError("Worker stop, if provided, must be a function");
  }
  if ("startupTimeoutMs" in worker) {
    if (typeof worker.startupTimeoutMs !== "number" || worker.startupTimeoutMs < 0) {
      throw new TypeError(
        "Worker startupTimeoutMs, if provided, must be a non-negative number"
      );
    }
  }
  if ("count" in worker) {
    const count = worker.count;
    if (typeof count !== "number" || count < 1 || !Number.isInteger(count)) {
      throw new TypeError("Worker count must be a positive integer");
    }
  }
  if ("killAfterCompleted" in worker && typeof worker.killAfterCompleted !== "boolean") {
    throw new TypeError(
      "Worker killAfterCompleted, if provided, must be a boolean"
    );
  }
};
export {
  validateOptions
};
//# sourceMappingURL=validators.mjs.map