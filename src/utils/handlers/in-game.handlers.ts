import { InGameStateComponent } from "@/ecs/components/scenes/InGameStateComponent";
import { AppStateResource } from "@/ecs/resources";
import { MainMenuScene } from "@/ecs/scenes";
import type { UiIntentSystem } from "@/ecs/systems/render/ui/UiIntentSystem";
import { useUiStore } from "@/stores";
import { isSome, unwrapOpt, type World } from "@/types";

function changeIsPaused(world: World, value: boolean) {
    const gameStateComponentOpt = world.querySingle(InGameStateComponent);
    if (gameStateComponentOpt.some) {
        const [gameStateComponent] = gameStateComponentOpt.value;
        const updateUi = useUiStore.getState().updateCurrentState;
        
        // Update the ECS component
        gameStateComponent.isPaused = value;
        
        // Sync the change to the UI store
        updateUi({
            type: 'InGame',
            isPaused: value
        });
    }
}

/** Handles the 'ResumeGame' intent (e.g., from the pause menu) */
function handleResumeGame(world: World): void {
    console.log("UI intent 'ResumeGame' received.");
    changeIsPaused(world, false);
}

/** Handles the 'ExitToMenu' intent (e.g., from the pause menu) */
function handleExitToMenu(world: World): void {
    console.log("UI intent 'ExitToMenu' received.");
    const appStateOpt = world.getResource(AppStateResource);

    if (isSome(appStateOpt)) {
        // immediately exit
        const mainMenuState = new MainMenuScene();
        unwrapOpt(appStateOpt).scheduleTransition(mainMenuState);
    } else {
        console.error("AppStateResource not found! Cannot change state.");
    }
}

/**
 * Registers all handlers for the In-Game state with the UiIntentSystem.
 * This is called once when the UiIntentSystem is created.
 */
export function registerInGameIntents(system: UiIntentSystem): void {
    system.register('ResumeGame', handleResumeGame);
    system.register('ExitToMenu', handleExitToMenu);
}