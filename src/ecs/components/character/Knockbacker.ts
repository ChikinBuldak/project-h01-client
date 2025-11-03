import type { Component } from "@/types";

/**
 * A Component that will trigger knockback depending on the amount of power accumulate.
 * It increases every hit, and at some point you will greatly
 * knockedback out of the map, and then you die
 */
export class Knockbacker implements Component {
    private _amount: number

    /** How much each point of "amount" (percent) scales the knockback. */
    private static readonly _scalingFactor =  0.01;
    /** * The percentage at which the launch multiplier kicks in.
     * (e.g., 80 = 80%)
     */
    private static readonly _launchThreshold = 80;
    /**
     * The multiplier applied to knockback once the threshold is passed.
     */
    private static readonly _launchMultiplier = 1.8;

    constructor() {
        this._amount = 0;
    }

    /**
     * Applies an attack, increasing the knockback amount and
     * calculating the resulting launch force.
     * @param attackDamage The "damage" of the attack, which is added to the percentage.
     * @param attackBaseForce The "base knockback" of the attack, which is constant.
     * @returns The final knockback force magnitude to be applied.
     */
    public applyHit(attackDamage: number, attackBaseForce: number): number {
        this._amount += attackDamage;

        // Calculate knockback force
        // Formula: (BaseForce + (Damage * 0.5)) * (1.0 + (Amount * ScalingFactor))
        let force = (attackBaseForce + (attackDamage * 0.5)) * (1.0 + (this._amount * Knockbacker._scalingFactor));

        // Apply launch multiplier if over the threshold
        if (this._amount > Knockbacker._launchThreshold) {
            force *= Knockbacker._launchMultiplier;
        }

        return force;
    }

    /**
     * Reset the accumulated knockback power amount
     */
    public reset() {
        this._amount = 0;
    }
}