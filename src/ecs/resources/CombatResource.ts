import { RedCombatAction } from "@/game-components/combat/RedCombatAction";
import type { ICombatAction } from "@/interfaces/combat/ICombatAction";
import type { Resource } from "@/types";
import { resource } from "@/utils/decorators/resource.decorator";

/**
 * A resource for combat mechanism. it stores map of character
 * to their respective combat action
 */
@resource("combatResource");
export class CombatResource implements Resource {
    public combatResources = new Map<string, ICombatAction>();

    constructor() {
        this.combatResources = new Map<string, ICombatAction>();

        // add all the resources to the combat resource
        this.combatResources.set('red', new RedCombatAction());
        console.log('[CombatResource] Combat resource is initialized');
    }
}

declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    combatResource: CombatResource;
  }
}