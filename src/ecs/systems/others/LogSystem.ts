import type { System, World } from "@/types";
import LogEvent from '../../events/LogEvent';

/**
 * A system to manage logging for game runtime
 */
export class LogSystem implements System {
    update(world: World): void {
        const logEvents = world.readEvents(LogEvent);

        for (const log of logEvents) {
            switch (log.type) {
                case 'info':
                    console.log(log.message);
                    break;
                case 'warn':
                    console.warn(log.message);
                    break;
                case 'error':
                    console.error(log.message);
                    break;
            }
        }
    }
}