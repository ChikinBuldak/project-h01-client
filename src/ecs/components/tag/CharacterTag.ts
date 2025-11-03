import { CombatResource } from "@/ecs/resources/CombatResource";
import { isNone, OptionWrapper, type Component, type World } from "@/types";
import { unwrapOpt } from '../../../types/option';

export default class CharacterTag implements Component {
    public readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    static mapToAction(tag: CharacterTag, world: World) {
        // get combat resource
        const combatRes = unwrapOpt(world.getResource(CombatResource));
        return OptionWrapper.ofNullable(combatRes?.combatResources.get(tag.name));
    }
}