import type { Component } from "@/types";

/**
 * A Component that will trigger knockback depending on the amount of power accumulate.
 * It increases every hit, and at some point you will greatly
 * knockedback out of the map, and then you die
 */
export class Knockbacker implements Component {
    private amount: number

    /** How much each point of "amount" (percent) scales the knockback. */
    private static readonly scalingFactor =  0.01;
    /** * The percentage at which the launch multiplier kicks in.
     * (e.g., 80 = 80%)
     */
    private static readonly launchThreshold = 80;
    /**
     * The multiplier applied to knockback once the threshold is passed.
     */
    private static readonly launchMultiplier = 1.8;

    constructor() {
        this.amount = 0;
    }

    /**
     * Applies an attack, increasing the knockback amount and
     * calculating the resulting launch force.
     * @param attackDamage The "damage" of the attack, which is added to the percentage.
     * @param attackBaseForce The "base knockback" of the attack, which is constant.
     * @returns The final knockback force magnitude to be applied.
     */
    public applyHit(attackDamage: number, attackBaseForce: number): number {
        this.amount += attackDamage;

        // Calculate knockback force
        // Formula: (BaseForce + (Damage * 0.5)) * (1.0 + (Amount * ScalingFactor))
        let force = (attackBaseForce + (attackDamage * 0.5)) * (1.0 + (this.amount * Knockbacker.scalingFactor));

        // Apply launch multiplier if over the threshold
        if (this.amount > Knockbacker.launchThreshold) {
            force *= Knockbacker.launchMultiplier;
        }

        return force;
    }
}