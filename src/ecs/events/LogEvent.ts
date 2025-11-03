import type { EventECS } from "@/types";

export type LogType = "info" | "warn" | "error"

/**
 * An event that notify LogSystem to log the message to the console
 */
export default class LogEvent implements EventECS {
    public readonly type: LogType;
    public readonly message: string;

    constructor(type: LogType, message: string) {
        this.type = type;
        this.message = message;
    }
}