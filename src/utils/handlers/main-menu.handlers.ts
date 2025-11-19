// src/utils/handlers/main-menu.handlers.ts

import { NetworkResource } from "@/ecs/resources";
import { handleStartGameUniversal } from "@/ecs/scenes";
import type { UiIntentSystem } from "@/ecs/systems/render/ui/UiIntentSystem";
import { useUiStore, type MainMenuUiState } from "@/stores";
import { type World } from "@/types";
import type { LobbyClientConnect, LobbyClientCreateRoom, LobbyClientLeaveRoom } from '@/types/room-manager.types';
import { LobbyStateComponent } from "@/ecs/components/network/lobby-room.component";
import { createNewRoom } from "@/api/room-manager.api";
import WebSocketRequestEvent from "@/ecs/events/WebSocketRequestEvent";
import { type LobbyClientMessage } from '@/types/room-manager.types';

// ====================== HANDLER FUNCTIONS =============================

function handleStartGame(world: World): void {
    // we send event to the WebSocketRequestEvent, and then just stop. the scene transition
    // will be handled by LobbyConnectionSystem
    const networkResource = world.getResource(NetworkResource);
    if (networkResource.isSome()) {
        world.deferEvent(new WebSocketRequestEvent({ type: 'start_game' }));
        return;
    }
    
    handleStartGameUniversal(world);
}

function handleSearchForRooms(_world: World): void {
    console.log("UI intent 'SearchForRooms' received.");
    // This logic updates the UI state, not the ECS state.
    const { state, transitionTo } = useUiStore.getState();

    if (state.type === 'MainMenu') {
        // Create a new MainMenuUiState with the updated section
        const newState: MainMenuUiState = {
            ...state,
            currentSection: 'RoomSearch',
            selectedButton: 'BackToMainMenu', // Select a default button
        };
        transitionTo(newState);
    } else {
        console.warn("Tried to 'SearchForRooms' but not in MainMenu state.");
    }
}

function handleBackToMainMenu(_world: World): void {
    console.log("UI intent 'BackToMainMenu' received.");
    const { state, transitionTo } = useUiStore.getState();

    if (state.type === 'MainMenu') {
        const newState: MainMenuUiState = {
            ...state,
            currentSection: 'Main',
            selectedButton: 'SearchForRooms',
        };
        transitionTo(newState);
    }
}

function handleCreateRoom(world: World, payload: Pick<LobbyClientCreateRoom, 'name' | 'max_capacity'>) {
    const networkRes = world.getResource(NetworkResource);
    if (networkRes.isNone()) {
        console.error("NetworkResource not found! Cannot join room.");
        return;
    }
    const lobbyStateRes = world.querySingle(LobbyStateComponent);
    if (lobbyStateRes.isNone()) {
        console.error("LobbyStateComponent not found! Cannot create room.");
        return;
    }

    const { name, max_capacity } = payload;

    const authType = networkRes.unwrap().lobbyAuth

    const createRoomRequestBody = createNewRoom(authType, name, max_capacity);

    world.sendEvent(new WebSocketRequestEvent(createRoomRequestBody));
}

function handleJoinRoom(world: World, payload: Pick<LobbyClientConnect, 'room_id'>): void {
    const networkRes = world.getResource(NetworkResource);
    if (!networkRes.some) {
        console.error("NetworkResource not found! Cannot join room.");
        return;
    }
    const lobbyStateRes = world.querySingle(LobbyStateComponent);
    if (!lobbyStateRes.some) {
        console.error("LobbyStateComponent not found! Cannot join room.");
        return;
    }
    const auth = networkRes.unwrap().lobbyAuth;

    const properPayload: LobbyClientMessage = {
        room_id: payload.room_id,
        auth,
        type: 'connect'
    }

    // Send WebSocketRequestEvent that can be read by the Lobby Connection System
    world.sendEvent(new WebSocketRequestEvent(properPayload));
}

function handleLeaveRoom(world: World, payload: Pick<LobbyClientLeaveRoom, 'room_id'>): void {
    const truePayload: LobbyClientLeaveRoom = {
        type: 'leave_room',
        room_id: payload.room_id
    };
    world.sendEvent(new WebSocketRequestEvent(truePayload));
};

/**
 * Registers all handlers for the Main Menu state with the UiIntentSystem.
 * This is called once when the UiIntentSystem is created.
 */
export function registerMainMenuIntents(system: UiIntentSystem): void {
    system.register('Start', handleStartGame);
    system.register('SearchForRooms', handleSearchForRooms);
    system.register('BackToMainMenu', handleBackToMainMenu);
    system.register('JoinRoom', handleJoinRoom);
    system.register('CreateRoom', handleCreateRoom);
    system.register('LeaveRoom', handleLeaveRoom);
    // Register 'Options' here when you have it
    // system.register('Options', handleOptions);
}