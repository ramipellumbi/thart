import { ChildProcess } from 'node:child_process';
import { ShutdownManager } from './async-shutdown.mjs';
import { NormalizedThartOptions, WorkerFunction } from './types.mjs';

declare function startPrimary(options: NormalizedThartOptions, manager: ShutdownManager): Promise<void>;
declare function spawnWorker(i: number, workerConfig: WorkerFunction, childProcesses: ChildProcess[]): void;
/**
 * Waits for all workers and child processes to terminate within a specified grace period.
 *
 * This function periodically checks the status of cluster workers and child processes.
 * It resolves when all workers and child processes have terminated.
 * If the grace period expires before all workers and child processes have terminated,
 * it forcibly terminates them and rejects with an error.
 *
 * @param {number} grace - The maximum time (in milliseconds) to wait for workers and child processes to terminate.
 * @param {ChildProcess[]} childProcesses - An array of child processes to monitor.
 * @returns {Promise<void>} A promise that resolves when all workers and child processes have terminated,
 *                          or rejects if the grace period expires.
 * @throws {Error} If the grace period expires before all workers and child processes terminate.
 */
declare function waitForWorkersWithTimeout(grace: number, childProcesses: ChildProcess[]): Promise<void>;

export { spawnWorker, startPrimary, waitForWorkersWithTimeout };
