import type { Component } from "@/types/ecs";
import type { PlayerPhysicsState} from "@/types/network";

export class NetworkStateBuffer implements Component {
    public buffer: {tick: number, state: PlayerPhysicsState}[] = [];
    public bufferDelay: number = 100;

    public addState(tick: number, state: PlayerPhysicsState) {
        this.buffer.push({tick, state});
        // Keep buffer sorted by tick
        this.buffer.sort((a, b) => a.tick - b.tick);
        // Remove old state
        if (this.buffer.length > 20) {
            this.buffer.shift();
        }
    }
}