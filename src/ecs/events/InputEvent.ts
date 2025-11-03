import type { EventECS, Input } from "@/types";

/**
 * A new event to decouple the InputSystem from the PlayerMovementSystem.
 * Sent by InputSystem, read by PlayerMovementSystem.
 */
export class InputEvent implements EventECS {
    public payload: Input
    public tick: number
    constructor(currentTick: number, payload: Input) {
        this.tick = currentTick;
        this.payload = payload;
    }
}