/**
 * This internal code is just about a carbon copy of: https://www.npmjs.com/package/async-cleanup
 * The license is ISC, found at: https://github.com/trevorr/async-cleanup/blob/master/LICENSE
 * Tests not included in this repository.
 */
declare class ShutdownManager {
    private cleanupListeners;
    private static readonly SIGNALS;
    constructor();
    /**
     * Adds a listener to be executed when the process is shutting down.
     * @param listener - The listener to be executed when the process is shutting down.
     * @throws If a listener is added after the process has started shutting down.
     */
    addListener(listener: CleanupListener): void;
    killAfterCleanup(signal?: NodeJS.Signals): Promise<void>;
    private exitAfterCleanup;
    private executeCleanupListeners;
    private beforeExitListener;
    private uncaughtExceptionListener;
    private signalListener;
    private installExitListeners;
    private uninstallExitListeners;
}
type CleanupListener = () => void | Promise<void>;

export { ShutdownManager };
