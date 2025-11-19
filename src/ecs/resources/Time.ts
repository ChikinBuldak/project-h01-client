import { registerResource } from "@/utils/registry/resource.registry";
import type { Resource } from "../../types/ecs";
// import { type ResourceRegistry } from '@/utils/registry/resource.registry';

export class Time implements Resource {
    /** The total time elapsed since the app started, in milliseconds. */
    public elapsedTime: number = 0;
    /** The time elapsed during last fixed update in milliseconds*/
    public fixedDeltaTime: number = 0;
    /**
     * The interpolation factor (alpha) for the current render frame.
     * This is a value between 0 and 1.
     */
    public alpha: number = 0;

    /** The current simulation tick number. Incremented by the game loop. */
    public currentTick: number = 0;

    constructor() {
        this.elapsedTime = performance.now();
    }
}

registerResource("time", Time);

declare module '@/utils/registry/resource.registry' {
    interface ResourceRegistry {
        time: Time
    }
}