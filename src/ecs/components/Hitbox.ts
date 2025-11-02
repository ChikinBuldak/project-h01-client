import type { Component } from "@/types";

/**
 * A component representing an active attack.
 * This is spawned by the CombatSystem and despawned
 * after its lifetime.
 */
export class Hitbox implements Component {
    /** The entity ID of the player who created this hitbox. */
    public ownerId: number;
    /** The damage to add to the Knockbacker component. */
    public damage: number;
    /** The base force of the attack. */
    public baseForce: number;
    /** The direction of the knockback (e.g., {x: 1, y: -0.5}) */
    public trajectory: { x: number, y: number };
    
    /** How long this hitbox stays active, in seconds. */
    public lifetime: number;
    
    /** * If true, this was spawned by the client (offline mode).
     * If false, this was spawned by the server (not yet used, but good for visuals).
     */
    public isPredicted: boolean;

    constructor(props: Partial<Hitbox>) {
        this.ownerId = props.ownerId ?? 0;
        this.damage = props.damage ?? 5;
        this.baseForce = props.baseForce ?? 10;
        this.trajectory = props.trajectory ?? { x: 1, y: -1 };
        this.lifetime = props.lifetime ?? 0.2;
        this.isPredicted = props.isPredicted ?? false;
    }
}