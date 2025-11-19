import { useUiStore } from "@/stores/ui.store";
import type { LoadingUiState } from "@/stores/ui.types";
import type { AppScene, World } from "@/types";

export default class ErrorScene implements AppScene {
    private errorMessage: string;
    constructor(errorMessage: string) { 
        this.errorMessage = errorMessage;
    }

    onEnter(_world: World): void {
        // Use the 'Loading' UI shape to display an error
        const errorState: LoadingUiState = {
            type: 'Loading',
            progress: 100,
            message: `Error: ${this.errorMessage}`,
        };
        useUiStore.getState().transitionTo(errorState);
    }

    onExit(_world: World): void { }
}