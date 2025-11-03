import type { Entity, World } from "@/types";


/**
 * Map of combat actions → argument tuple
 * Each action always receives (entity, world, ...customArgs)
 */
export interface CombatActionMap {
    /**
     * Do basic attack, let the class who implements it decide how to
     * manage how basic attack done. can be by creating custom basic attack
     * combo for a certain character
     */
    basicAttack: [...any[]];
    /**
     * Do hard attack. This will have more force, and take a lot amount of damage to the knockable amount
     */
    hardAttack: [damage: number, ...any[]];
    /**
     * This is for the ultimate. This is peak offensive 🖐️😐🖐️
     */
    ultimate: [damage: number, ...any[]];
    /**
     * Doing attack on mid-air. This is optional, since some of character might not have it
     */
    onAirAttack?: [damage: number, ...any[]];
}

type ActionHandler<TArgs extends readonly unknown[]> = (
    entity: Entity,
    world: World,
    ...args: TArgs
) => void;

/**
 *  Generic trait for ECS integration
 */
export type ICombatAction<
    T extends CombatActionMap = CombatActionMap
> = {
        [K in keyof T]: T[K] extends readonly unknown[]
        ? ActionHandler<T[K]>
        : never;
    };