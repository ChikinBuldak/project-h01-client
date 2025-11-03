import type { Component } from "@/types";

export class ApplyHit implements Component {
    private baseAttackPower: number;
    private baseKnockbackEffect: number;

    constructor(baseAttackPower: number, baseKnockbackEffect: number) {
        this.baseAttackPower = baseAttackPower;
        this.baseKnockbackEffect = baseKnockbackEffect;
    }
}