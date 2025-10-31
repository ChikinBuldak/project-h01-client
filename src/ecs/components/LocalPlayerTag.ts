import type { Component } from "../../types/ecs";
import type { Input } from "../../types/input";
import type { TransformState } from "../../types/network";


/**
 * A "tag" component to identify the local player's entity
 */
export class LocalPlayerTag implements Component{}

/**
 * Stores a history of inputs and the states they produced.
 * Needed for rollback
 */
export class PredictionHistory implements Component {
    pendingInputs: {tick: number, input: Input}[] = [];
    stateHistory: {tick: number, state: TransformState}[] = [];
}