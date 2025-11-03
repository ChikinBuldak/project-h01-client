import { clamp } from "@/utils";
import type { Component } from "@/types/ecs";

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

    private _dodgeTimer: number;
    private _dodgeCooldown: number;
    private _maxJumpCount: number;
    private _currentJumpCount: number;
  
    constructor(isGrounded: boolean = false) {
        this.isGrounded = isGrounded;
        this.isInvisible = false;
        this.faceDirection = 1;
        this._dodgeTimer = 0;
        this._dodgeCooldown = 0; 
        this._maxJumpCount = 3;
        this._currentJumpCount = 3;
    }

    set setDodgeTimer(value: number) {
        const val = clamp(value, 0, 10);
        this._dodgeTimer = val;
    }

    get getDodgeTimer() {
        return this._dodgeTimer;
    }

    set setDodgeCooldown(value: number) {
        const val = clamp(value, 0, 100);
        this._dodgeCooldown = val;
    }

    get getDodgeCooldown() {
        return this._dodgeCooldown;
    }

    get JumpCount() {
        return this._currentJumpCount;
    }

    decreaseJumpCount() {
        this._currentJumpCount = clamp(--this._currentJumpCount, 0, this._maxJumpCount);
    }

    resetJumpCount() {
        this._currentJumpCount = this._maxJumpCount;
    }
}