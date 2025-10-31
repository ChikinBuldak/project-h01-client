import type { Component } from "../../types/ecs";
import type { TransformState } from "../../types/network";

export class NetworkStateBuffer implements Component {
    public buffer: {tick: number, state: TransformState}[] = [];
    public bufferDelay: number = 100;

    public addState(tick: number, state: TransformState) {
        this.buffer.push({tick, state});
        // Keep buffer sorted by tick
        this.buffer.sort((a, b) => a.tick - b.tick);
        // Remove old state
        if (this.buffer.length > 20) {
            this.buffer.shift();
        }
    }
}