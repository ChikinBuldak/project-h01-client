import { AppStateResource, NetworkResource } from "@/ecs/resources";
import { InGameScene, LoadingScene } from "@/ecs/scenes";
import type { UiIntentSystem } from "@/ecs/systems/render/ui/UiIntentSystem";
import { useUiStore, useWorldStore, type MainMenuUiState } from "@/stores";
import { useWaitingRoomStore } from "@/stores/waiting-room.store";
import { isSome, unwrapOpt, type World } from "@/types";
import type { WsAuthRequest } from '../../types/room-manager.types';
import { LobbyStateComponent } from "@/ecs/components/network/lobby-room.component";
import { JoinRoomEvent, LeaveRoomEvent } from "@/ecs/events/LobbyEvent";

function handleStartGame(world: World): void {
    const appStateOpt = world.getResource(AppStateResource);

    if (isSome(appStateOpt)) {
        console.log("UI intent 'Start' received, transitioning to LoadingState.");

        const loadInGameTask = async (_: World) => {
            console.log("Running In-Game loading task...");
            await new Promise(res => setTimeout(res, 500)); // 0.5s fake load
            console.log("In-Game loading task complete.");
        };

        const loadingState = new LoadingScene(
            new InGameScene(),  // The state to go to *after*
            loadInGameTask,     // The async task to run
            'Loading Game...'   // The message to show
        );

        unwrapOpt(appStateOpt).scheduleTransition(loadingState);

    } else {
        console.error("AppStateResource not found! Cannot change state.");
    }
}

function handleSearchForRooms(world: World): void {
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

function handleBackToMainMenu(world: World): void {
    console.log("UI intent 'BackToMainMenu' received.");
    const { state, transitionTo } = useUiStore.getState();

    if (state.type === 'MainMenu') {
        const newState: MainMenuUiState = {
            ...state,
            currentSection: 'Main',
            selectedButton: 'SearchForRooms', // Select the button we came from
        };
        transitionTo(newState);
    }
}

function handleJoinRoom(world: World, payload: { roomId: string }): void {
    const {state, transitionTo } = useUiStore.getState();
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
    const network = networkRes.value;
    const [lobbyState] = lobbyStateRes.value;
    lobbyState.pendingJoinRoomId = payload.roomId;
    console.log(`[handleJoinRoom] Set pendingJoinRoomId to ${payload.roomId}`)
    if (lobbyState.status === "disconnected") {
        console.log("Not connected to lobby, initiating connection...");
        network.connectToWaitingRoom();
    }

    // 3. Transition the UI to the waiting room immediately
    transitionTo({
        ...state,
        type: 'WaitingRoom',
        roomId: payload.roomId
    });
}

function handleLeaveRoom(world: World): void {
    // 1. Send the event.
    // The LobbyConnectionSystem will find this, send the network message,
    // and the server will close the connection.
    world.sendEvent(new LeaveRoomEvent());

    // 2. Transition the UI back to the main menu
    useUiStore.getState().transitionTo({
        type: 'MainMenu',
        currentSection: 'Main',
        selectedButton: 'SearchForRooms',
        version: '1.0.0', // Assuming version is needed
    });
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
    system.register('LeaveRoom', handleLeaveRoom);
    // Register 'Options' here when you have it
    // system.register('Options', handleOptions);
}