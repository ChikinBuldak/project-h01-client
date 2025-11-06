import { AppStateResource } from "@/ecs/resources";
import { InGameState, LoadingState } from "@/ecs/states";
import { useUiStore } from "@/stores";
import { isSome, unwrapOpt, type System, type World } from "@/types";

export default class MainMenuInputSystem implements System {
    update(world: World): void {
        const { userIntent, sendIntent } = useUiStore.getState();

        if (userIntent === 'StartGame') {
            const appStateOpt = world.getResource(AppStateResource);
            
            if (isSome(appStateOpt)) {
                console.log("UI intent 'StartGame' received, transitioning to LoadingState.");

                // Define an optional loading task for this transition
                // (e.g., load a level, or just a fake delay)
                const loadInGameTask = async (w: World) => {
                  console.log("Running In-Game loading task...");
                  await new Promise(res => setTimeout(res, 500)); // 0.5s fake load
                  console.log("In-Game loading task complete.");
                };
                
                // Transition to LOADING STATE, not InGameState
                const loadingState = new LoadingState(
                  new InGameState(),  // The state to go to *after*
                  loadInGameTask,     // The async task to run
                  'Loading Game...'   // The message to show
                );
                
                unwrapOpt(appStateOpt).scheduleTransition(loadingState);

            } else {
                console.error("AppStateResource not found! Cannot change state.");
            }
            
            sendIntent(null);
        }
    }

    render(_world: World): void {}
}