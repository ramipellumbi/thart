import { ShutdownManager } from './async-shutdown.mjs';
import { NormalizedThartOptions } from './types.mjs';

declare function startWorker(options: NormalizedThartOptions, manager: ShutdownManager): Promise<void>;

export { startWorker };
