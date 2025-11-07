import { InGameStateComponent, type InGameStateType } from "@/ecs/components/scenes/InGameStateComponent";
import { useUiStore } from "@/stores";
import { isNone, type System, type World } from "@/types";
import { getEqInGameState, getIntoInGameStateTypeFromInGameStateComponent } from "@/utils/registry/game-state";

export default class InGameUIRenderSystem implements System {
    updateUi = useUiStore.getState().updateCurrentState;
    private _stateCache: InGameStateType = {
        isPaused: false
    } as InGameStateType;


    update(world: World): void {
        const query = world.querySingle(InGameStateComponent);
        if (isNone(query)) return;
        
        // get eq trait
        const equals = getEqInGameState().equals;
        const from = getIntoInGameStateTypeFromInGameStateComponent().from;
        const inGameState = from(query.value[0]);
        
        // Sync with ECS if it is not equal
        if (!equals(this._stateCache, inGameState)) {
            this.updateUi({
                isPaused: inGameState.isPaused
            });

            // update cache
            this._stateCache = inGameState;

        }
    }
    render?(_world: World): void {}

}