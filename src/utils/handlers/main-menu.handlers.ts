import { AppStateResource } from "@/ecs/resources";
import { InGameState, LoadingState } from "@/ecs/states";
import type { UiIntentSystem } from "@/ecs/systems/render/ui/UiIntentSystem";
import { useUiStore, type MainMenuUiState } from "@/stores";
import { isSome, unwrapOpt, type World } from "@/types";

function handleStartGame(world: World): void {
    const appStateOpt = world.getResource(AppStateResource);

    if (isSome(appStateOpt)) {
        console.log("UI intent 'Start' received, transitioning to LoadingState.");

        const loadInGameTask = async (_: World) => {
            console.log("Running In-Game loading task...");
            await new Promise(res => setTimeout(res, 500)); // 0.5s fake load
            console.log("In-Game loading task complete.");
        };

        const loadingState = new LoadingState(
            new InGameState(),  // The state to go to *after*
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

/**
 * Registers all handlers for the Main Menu state with the UiIntentSystem.
 * This is called once when the UiIntentSystem is created.
 */
export function registerMainMenuIntents(system: UiIntentSystem): void {
    system.register('Start', handleStartGame);
    system.register('SearchForRooms', handleSearchForRooms);
    system.register('BackToMainMenu', handleBackToMainMenu);
    // Register 'Options' here when you have it
    // system.register('Options', handleOptions);
}