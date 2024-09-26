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

// src/validators.ts
var validators_exports = {};
__export(validators_exports, {
  validateOptions: () => validateOptions
});
module.exports = __toCommonJS(validators_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validateOptions
});
//# sourceMappingURL=validators.js.map