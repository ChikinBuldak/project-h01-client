import type { Component } from "../../types/ecs";

/**
 * Attaching this component to an entity (like a player)
 * signifies that the PhysicsSystem should perform a downward
 * raycast from its position to check if it's on the ground.
 */
export class GroundCheckRay implements Component {
    /**
     * How far down to cast the ray from the entity's center.
     * You'll want this to be just slightly more than half the entity's height.
     */
    public rayLength: number;

    /**
     * Stores the result of the last raycast.
     */
    public hit: boolean = false;

    /**
     * @param rayLength How far down to cast the ray from the entity's center.
     * For a player with height 20, a value of 11 (10 + 1 buffer) is good.
     */
    constructor(rayLength: number = 11) {
        this.rayLength = rayLength;
    }
}