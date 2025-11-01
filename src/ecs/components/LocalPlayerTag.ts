import type { Vector } from "matter-js";
import type { Component } from "../../types/ecs";
import type { Input } from "../../types/input";


/**
 * A "tag" component to identify the local player's entity
 */
export class LocalPlayerTag implements Component{}

/**
 * Defines the client-side physics state,
 * used for reconciliation.
 */
export interface PlayerPhysicsState {
    position: Vector;
    velocity: Vector;
    isGrounded: boolean;
}


/**
 * Stores a history of inputs and the states they produced.
 * Needed for rollback
 */
export class PredictionHistory implements Component {
    pendingInputs: {tick: number, input: Input}[] = [];
    stateHistory: {tick: number, state: PlayerPhysicsState }[] = [];
}