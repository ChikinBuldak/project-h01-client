import MenuStateComponent from "@/ecs/components/ui/MenuStateComponent";
import { useUiStore } from "@/stores/ui.store";
import type { System, World } from "@/types";

export class MainMenuUiRenderSystem implements System {
    private updateUi = useUiStore.getState().updateCurrentState;
    private lastSyncedButton = '';
    update(world: World): void {
        const queryResult = world.query(MenuStateComponent);
        if (queryResult.length === 0) return;

        const [menuState] = queryResult[0];
        const currentButton = menuState.selectedButton;
        if (this.lastSyncedButton !== currentButton) {
            this.updateUi({
                selectedButton: currentButton
            });

            // Update the cache
            this.lastSyncedButton = currentButton;
        }
    }   
}