import { LobbyRoomComponent, LobbyStateComponent, PlayerInLobbyComponent } from "@/ecs/components/network/lobby-room.component";
import { useWaitingRoomStore } from "@/stores/waiting-room.store";
import type { System, SystemResourcePartial, World } from "@/types";
import type { RoomState } from "@/types/room-manager.types";
import { shallow } from "zustand/shallow";

export class LobbyUiSystem implements System {
    update(world: World, resources: SystemResourcePartial): void {
        const lobbyStateRes = world.querySingle(LobbyStateComponent);

        if (!lobbyStateRes.some) {
            const {isConnected} = useWaitingRoomStore.getState();
            if (isConnected) {
                useWaitingRoomStore.getState().setDisconnected();
            }
            return;
        }

        const uiStore = useWaitingRoomStore.getState();

        const [lobbyState] = lobbyStateRes.value;
        if (lobbyState.status === 'connected' || lobbyState.status === 'joining' || lobbyState.status === 'joined') {
            if (!uiStore.isConnected) {
                uiStore.setConnected();
                console.log("[LobbyUISystem] Connected to the room");
            }
        } else {
            if (uiStore.isConnected) {
                uiStore.setDisconnected();
            }
        }

        if (lobbyState.status === "connecting") {
            if (!uiStore.isConnecting) {
                uiStore.setConnecting();
                console.log("[LobbyUISystem] Connecting to the room");
            }
        }

        if (lobbyState.error && uiStore.error !== lobbyState.error) {
            uiStore.setError(lobbyState.error);
        }

        const roomCompRes = world.querySingle(LobbyRoomComponent);
        if (!roomCompRes.some) {
            if (uiStore.currentRoom !== null) {
                uiStore.setRoomState(null as any);
            }
            return;
        }

        const [roomComponent] = roomCompRes.value;
        const members: string[] = [];

        const playerInLobbyQuery= world.query(PlayerInLobbyComponent);
        for (const [player] of playerInLobbyQuery) {
            members.push(player.userId);
        }

        const newRoomState: RoomState = {
            room_id: roomComponent.room_id,
            name: roomComponent.name,
            owner_id: roomComponent.owner_id,
            created_at: roomComponent.created_at,
            max_capacity: roomComponent.max_capacity,
            members: members
        };

        if (!shallow(uiStore.currentRoom, newRoomState)) {
            uiStore.setRoomState(newRoomState);
        }
    }

}