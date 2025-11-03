import {Entity, type EventECS } from "@/types";

export class CollisionEvent implements EventECS {
    public entityA: Entity;
    public entityB: Entity;
    constructor(entityA: Entity, entityB: Entity) {
        this.entityA =entityA;
        this.entityB = entityB;
    }
}