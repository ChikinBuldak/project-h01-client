import type { Clone, Eq} from "@/types/utils";
import type { Component } from "@/types/ecs";
import type { PlayerPhysicsState, PlayerStateMessage, TransformState } from '@/types/network';

export interface Position {
    x: number,
    y: number
}

/**
 * {@link Transform} lets you define the transform component of an entity
 */
export class Transform implements Component, Clone<Transform>, Eq<Transform> {
    position: Position;
    /**
     * Rotation of the object (in degree)
     */
    rotation: number;

    constructor(x: number, y: number, rotation: number);
    constructor(transform: { position: { x: number, y: number }, rotation: number });
    /**
     * Creates a new Transform component.
     * @param x The initial X position.
     * @param y The initial Y position.
     * @param rotation The initial rotation in degrees (default is 0).
     */
    constructor(arg1: number | { position: { x: number, y: number }, rotation: number }, arg2: number = 0, arg3: number = 0) {
        if (typeof arg1 === 'object') {
            this.position = arg1.position;
            this.rotation = arg1.rotation;
        } else {
            this.position = { x: 0, y: 0 };
            this.position.x = arg1;
            this.position.y = arg2 ? arg2 : 0;
            this.rotation = arg3 ? arg3 : 0;
        }
    }

    static from(value: PlayerPhysicsState): Transform;
    static from(value: PlayerStateMessage): Transform;
    static from(value: PlayerPhysicsState | PlayerStateMessage): Transform {
        if ("state" in value && "transform" in value.state) {
            const t = value.state.transform;
            return new Transform(t.position.x, t.position.y, t.rotation ?? 0);
        }

        if ("transform" in value) {
            return new Transform(value.transform);
        }

        throw new Error("Invalid state type passed to from()");
    }

    clone(): Transform {
        return new Transform(this.position.x, this.position.y, 0);
    }

    equals(other: Transform): boolean {
        return (
            this.position.x === other.position.x &&
            this.position.y === other.position.y &&
            this.rotation === other.rotation
        )
    }

    static lerp(start: Transform | TransformState, end: Transform | TransformState, alpha: number) {
        const x = start.position.x + (end.position.x - start.position.x) * alpha;
        const y = start.position.y + (end.position.y - start.position.y) * alpha;
        return new Transform(x, y, 0);
    }
}

// Signature 1 — for PlayerStateMessage
export function intoTransform(state: PlayerStateMessage): Transform;
// Signature 2 — for PlayerPhysicsState
export function intoTransform(state: PlayerPhysicsState): Transform;

// Implementation
export function intoTransform(state: PlayerStateMessage | PlayerPhysicsState): Transform {
    // Handle PlayerStateMessage (has `state.state.transform`)
    if ("state" in state && "transform" in state.state) {
        const t = state.state.transform;
        return new Transform(t.position.x, t.position.y, t.rotation ?? 0);
    }

    if ("transform" in state) {
        return new Transform(state.transform);
    }

    throw new Error("Invalid state type passed to intoTransform()");
}