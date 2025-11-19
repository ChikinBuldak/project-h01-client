
import type { LobbyClientMessage } from '@/types/room-manager.types';
import type { EventECS } from '../../types/ecs';
export default class WebSocketRequestEvent implements EventECS {
    public readonly body: LobbyClientMessage;

    constructor( body: LobbyClientMessage) {
        this.body = body;
    }
}