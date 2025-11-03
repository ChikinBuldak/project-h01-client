import { RedCombatAction } from "@/game-components/combat/RedCombatAction";
import type { ICombatAction } from "@/interfaces/combat/ICombatAction";
import type { Resource } from "@/types";

/**
 * A resource for combat mechanism. it stores map of character
 * to their respective combat action
 */
export class CombatResource implements Resource {
    public combatResources = new Map<string, ICombatAction>();

    constructor() {
        this.combatResources = new Map<string, ICombatAction>();

        // add all the resources to the combat resource
        this.combatResources.set('red', new RedCombatAction());
        console.log('[CombatResource] Combat resource is initialized');
    }
}