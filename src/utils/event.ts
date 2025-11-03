import type { Entity, ComponentCtor } from "@/types";
import type { Component } from "@/types";

/**
 * Sends an event when two entities collide, filtered by component types.
 * @param entityA - First entity in the collision
 * @param entityB - Second entity in the collision
 * @param with_ - The component type expected on one entity
 * @param against - The component type expected on the other entity
 * @param callback - Called when the condition is met
 */
export function sendEventOnCollision<T extends Component>(
    entityA: Entity,
    entityB: Entity,
    with_: ComponentCtor<T>,
    against: ComponentCtor<T>,
    callback: (withEntity: Entity, againstEntity: Entity) => any
) {
    const isWithComponentA = entityA.hasComponent(with_);
    const isWithComponentB = entityB.hasComponent(with_);
    const isAgainstComponentA = entityA.hasComponent(against);
    const isAgainstComponentB = entityB.hasComponent(against);

    // Case 1: A has withComponent and B has against
    if (isWithComponentA && isAgainstComponentB) {
        callback(entityA, entityB);
    }
    // Case 2: B has withComponent and A has against
    else if (isWithComponentB && isAgainstComponentA) {
        callback(entityB, entityA);
    }
}