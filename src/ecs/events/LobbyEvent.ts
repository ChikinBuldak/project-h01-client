import type { EventECS } from "@/types";

export class JoinRoomEvent implements EventECS {
    public roomId: string
    constructor(roomId: string) {
        this.roomId = roomId
    }
}

/**
 * Fired when the user intends to leave their current room.
 */
export class LeaveRoomEvent implements EventECS{}