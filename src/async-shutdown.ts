/* --------------------------------------------------------------------------

   async-cleanup - Trevor Robinson ISC license acknowledgment:

   ISC License

   Copyright (c) 2022, Trevor Robinson

   Permission to use, copy, modify, and/or distribute this software for any
   purpose with or without fee is hereby granted, provided that the above
   copyright notice and this permission notice appear in all copies.

   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

   ---------------------------------------------------------------------------

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

export class ShutdownManager {
    private cleanupListeners: Set<CleanupListener> | undefined;

    // Listenable signals that terminate the process by default
    private static readonly SIGNALS: NodeJS.Signals[] = [
        "SIGBREAK", // Ctrl-Break on Windows
        "SIGHUP", // Parent terminal closed
        "SIGINT", // Terminal interrupt, usually by Ctrl-C
        "SIGTERM", // Graceful termination
        "SIGUSR1", // Used by Nodemon
        "SIGUSR2", // Used by Nodemon
    ];

    constructor() {
        this.installExitListeners();
        this.cleanupListeners = new Set();
    }

    /**
     * Adds a listener to be executed when the process is shutting down.
     * @param listener - The listener to be executed when the process is shutting down.
     * @throws If a listener is added after the process has started shutting down.
     */
    public addListener(listener: CleanupListener): void {
        if (this.cleanupListeners === undefined) {
            throw new Error("Cannot add cleanup listeners after cleanup");
        }
        this.cleanupListeners.add(listener);
    }

    public async killAfterCleanup(signal?: NodeJS.Signals): Promise<void> {
        await this.executeCleanupListeners();
        process.kill(process.pid, signal);
    }

    private async exitAfterCleanup(code: number): Promise<void> {
        await this.executeCleanupListeners();
        process.exitCode = code;
    }

    private async executeCleanupListeners(): Promise<void> {
        if (this.cleanupListeners === undefined) {
            return;
        }
        this.uninstallExitListeners();
        const listeners = this.cleanupListeners;
        this.cleanupListeners = undefined;
        const promises: Promise<void>[] = [];
        for (const listener of listeners) {
            try {
                const promise = listener();
                if (promise) {
                    promises.push(promise);
                }
            } catch (err) {
                console.error(`Uncaught exception during cleanup ${err}`);
            }
        }
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === "rejected") {
                console.error(`Unhandled rejection during cleanup ${result.reason}`);
            }
        }
    }

    private beforeExitListener = (code: number): void => {
        console.debug(`Exiting with code ${code} due to empty event loop`);
        void this.exitAfterCleanup(code);
    };

    private uncaughtExceptionListener = (error: Error): void => {
        console.error("Exiting with code 1 due to uncaught exception", error, "\n");
        void this.exitAfterCleanup(1);
    };

    private signalListener = (signal: NodeJS.Signals): void => {
        console.debug(`Exiting due to signal ${signal}`);
        void this.killAfterCleanup(signal);
    };

    private installExitListeners(): void {
        process.on("beforeExit", this.beforeExitListener);
        process.on("uncaughtException", this.uncaughtExceptionListener);
        for (const signal of ShutdownManager.SIGNALS) {
            process.on(signal, this.signalListener);
        }
    }

    private uninstallExitListeners(): void {
        process.removeListener("beforeExit", this.beforeExitListener);
        process.removeListener("uncaughtException", this.uncaughtExceptionListener);
        for (const signal of ShutdownManager.SIGNALS) {
            process.removeAllListeners(signal);
        }
    }
}

type CleanupListener = () => void | Promise<void>;
