import type { Entity, EventECS } from "@/types";

export class PlayerFallEvent implements EventECS {
    private readonly _victim: Entity;
    
    constructor(player: Entity) {
        this._victim = player;
    }

    get victim() {
        return this._victim;
    }
}