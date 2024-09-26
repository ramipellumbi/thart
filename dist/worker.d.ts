import { ShutdownManager } from './async-shutdown.js';
import { NormalizedThartOptions } from './types.js';

declare function startWorker(options: NormalizedThartOptions, manager: ShutdownManager): Promise<void>;

export { startWorker };
