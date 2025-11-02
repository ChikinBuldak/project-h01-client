import { clamp } from "@/utils";
import type { Component } from "../../types/ecs";

type Direction = 1 | -1;

export class PlayerState implements Component {
    /** Check whether the player is on the ground */
    public isGrounded: boolean = false;
    /** Check whether the player is invisible (can't be hit) */
    public isInvisible: boolean = false;
    /** 
     * Telling what direction the player is facing.
     * "1" if facing right
     * "-1" if facing left
     * */
    public faceDirection: Direction;

    private dodgeTimer: number;
    private dodgeCooldown: number;
    private maxJumpCount: number;
    private currentJumpCount: number;
  
    constructor(isGrounded: boolean = false) {
        this.isGrounded = isGrounded;
        this.isInvisible = false;
        this.faceDirection = 1;
        this.dodgeTimer = 0;
        this.dodgeCooldown = 0; 
        this.maxJumpCount = 3;
        this.currentJumpCount = 3;
    }

    set setDodgeTimer(value: number) {
        const val = clamp(value, 0, 10);
        this.dodgeTimer = val;
    }

    get getDodgeTimer() {
        return this.dodgeTimer;
    }

    set setDodgeCooldown(value: number) {
        const val = clamp(value, 0, 100);
        this.dodgeCooldown = val;
    }

    get getDodgeCooldown() {
        return this.dodgeCooldown;
    }

    get JumpCount() {
        return this.currentJumpCount;
    }

    decreaseJumpCount() {
        this.currentJumpCount = clamp(--this.currentJumpCount, 0, this.maxJumpCount);
    }

    resetJumpCount() {
        this.currentJumpCount = this.maxJumpCount;
    }
}