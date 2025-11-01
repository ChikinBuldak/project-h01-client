import type { Component } from "../../types/ecs";
import type { PlayerStateMessage, TransformState } from '../../types/network';

export interface Position {
    x: number,
    y: number
}

/**
 * {@link Transform} lets you define the transform component of an entity
 */
export class Transform implements Component {
    position: Position;
    /**
     * Rotation of the object (in degree)
     */
    rotation: number;
    /**
     * Creates a new Transform component.
     * @param x The initial X position.
     * @param y The initial Y position.
     * @param rotation The initial rotation in degrees (default is 0).
     */
    constructor(x: number = 0, y: number = 0, rotation: number = 0) {
        this.position = { x: 0, y: 0 };
        this.position.x = x;
        this.position.y = y;
        this.rotation = rotation;
    }

    clone(): Transform {
        return new Transform(this.position.x, this.position.y);
    }

    static lerp(start: Transform | TransformState, end: Transform | TransformState, alpha: number) {
        const x =  start.position.x + (end.position.x - start.position.x) * alpha;
        const y = start.position.y + (end.position.y - start.position.y) * alpha;
        return new Transform(x, y);
    }
}

export function intoTransform(state: PlayerStateMessage) {
    return new Transform(state.state.transform.position.x, state.state.transform.position.y);
}