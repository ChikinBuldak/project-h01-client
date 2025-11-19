import type { Component } from "@/types";
import { type RoomState } from '../../../types/room-manager.types';

export type LobbyRoomComponentType = RoomState;
export class LobbyRoomComponent implements LobbyRoomComponentType, Component {
    public room_id: string;
    public name: string;
    public owner_id: string;
    public created_at: Date;
    public max_capacity: number;
    public members: string[];
    constructor(props: {
        room_id: string;
        name: string;
        owner_id: string;
        created_at: Date;
        max_capacity: number;
        members: string[];
    }) {
        this.room_id = props.room_id;
        this.name = props.name;
        this.owner_id = props.owner_id;
        this.created_at = props.created_at;
        this.max_capacity = props.max_capacity;
        this.members = props.members;
    }

    public set(props: LobbyRoomComponentType) {
        this.room_id = props.room_id;
        this.name = props.name;
        this.owner_id = props.owner_id;
        this.created_at = props.created_at;
        this.max_capacity = props.max_capacity;
        this.members = props.members;
    }
}
export class PlayerInLobbyComponent implements Component {
    public isHost: boolean = false;
    public userId: string;
    constructor(userId: string) {
        this.userId = userId;
    }
}

export type LobbyConnectionStatus = "disconnected" | "connecting" | "connected" | "joining" | "joined" | "error";

export class LobbyStateComponent implements Component {
    public status: LobbyConnectionStatus = "disconnected";
    public error: string | null = null;
    public currentRoomId: string | null = null;
    public pendingJoinRoomId: string | null = null;
}

