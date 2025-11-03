import type { ICombatAction } from "@/interfaces/combat/ICombatAction";
import type { Component } from "@/types";

/**
 * CombatState will provide the state for each character
 */
export class CombatState implements Component {
    public readonly hardAttackDamage: number;
    public readonly ultimateDamage: number;
    public readonly baseAtkSpd: number;
    private _attackSpeedMultiplier: number;
    public readonly baseAtkPower: number;

    public sequenceCount: number;
    public readonly maxSequence: number;
    public timeSinceLastAttack: number;
    public readonly resetThreshold: number;
    public readonly basicAttackDelay: number;
    public isHardAttackActionAvailable: boolean;

    constructor(props: {
        basicAttack: number,
        ultimate: number,
        baseAtkSpd: number,
        baseAtkPower: number,
    }) {
        const { basicAttack, ultimate, baseAtkSpd, baseAtkPower } = props;
        this.hardAttackDamage = basicAttack;
        this.ultimateDamage = ultimate;
        this.baseAtkSpd = baseAtkSpd;

        this.baseAtkPower = baseAtkPower;
        this._attackSpeedMultiplier = 1.0; // normal speed. if you get buff, it will increased
        this.isHardAttackActionAvailable = false;

        this.sequenceCount = 0;
        this.maxSequence = 3; // 3-hit combo
        this.timeSinceLastAttack = 0;
        this.resetThreshold = 1.0; // Reset kombo setelah 1 detik
        this.basicAttackDelay = 0.2; // Cooldown 0.2 detik antar serangan
    }

}