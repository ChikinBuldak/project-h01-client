import type { EventECS } from "@/types";

export class GameErrorEvent implements EventECS {
    public readonly code: number;
    public readonly message: string;

    constructor(code: number, message: string) {
        this.code = code;
        this.message = message;
    }
}