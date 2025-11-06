import { useWorldStore } from "@/stores";
import { useUiStore } from "@/stores/ui.store";
import type { LoadingUiState } from "@/stores/ui.types";
import { InputManager, isErr, isSome, tryCatchAsync, unwrapOpt, type AppState, type World } from "@/types";
import { AssetServer, AudioServer } from "../resources";
import { ConfigResource } from "../resources/ConfigResource";
import { setupResources } from "../startup";
import { AppStateResource } from "../resources/state";
import ErrorState from "./ErrorState";
// This is the new, generic signature for any async loading work
type LoadingTask = (world: World) => Promise<void>;

export class LoadingState implements AppState {
    private nextState: AppState;
    private loadingTask?: LoadingTask;
    private message: string = 'Loading...';
    /**
     * @param nextState The state to transition to *after* loading is complete.
     * @param loadingTask An optional async function to run while this state is active.
     * @param message A message to display on the loading screen.
     */
    constructor(nextState: AppState, loadingTask?: LoadingTask, message: string = 'Loading...'
    ) { 
        this.nextState = nextState;
        this.loadingTask = loadingTask;
        this.message = message
    }

    onEnter(world: World): void {
        const initialState: LoadingUiState = {
            type: 'Loading',
            progress: 0,
            message: this.message,
        };
        useUiStore.getState().transitionTo(initialState);

        // Start the async loading task, but don't block the onEnter
        this.runLoadingTask(world);
    }

    private async runLoadingTask(world: World) {
        try {
            if (this.loadingTask) {
                await this.loadingTask(world);
            }

            const appStateOpt = world.getResource(AppStateResource);
            if (isSome(appStateOpt)) {
                unwrapOpt(appStateOpt).scheduleTransition(this.nextState);
            } else {
                throw new Error('AppStateResource not found after loading task.');
            }

        } catch (err) {
            console.error('Critical error during loading task:', err);
            const appStateOpt = world.getResource(AppStateResource);
            if (isSome(appStateOpt)) {
                unwrapOpt(appStateOpt).scheduleTransition(new ErrorState((err as Error).message || 'Failed to load'));
            }
        }
    }

    onExit(_world: World): void {
        // Nothing to clean up
    }
}

export const initialAppLoadTask: LoadingTask = async (world: World) => {
    const { addResource } = useWorldStore.getState();
    const uiStore = useUiStore.getState();

    InputManager.initialize();

    const configResOpt = world.getResource(ConfigResource);
    if (!isSome(configResOpt)) {
        throw new Error("ConfigResource not found in LoadingState!");
    }
    const config = unwrapOpt(configResOpt).config;

    const assetServer = new AssetServer();
    const audioServer = new AudioServer();
    addResource(assetServer);
    addResource(audioServer);

    // Preload assets
    uiStore.updateCurrentState({ progress: 10, message: 'Loading assets...' });
    const loadAssetRes = await tryCatchAsync(() =>
        assetServer.preload(config.assets.images)
    );
    if (isErr(loadAssetRes)) {
        throw new Error(`Error loading asset: ${loadAssetRes.error}`);
    }

    // Preload audio
    uiStore.updateCurrentState({ progress: 50, message: 'Loading audio...' });
    const loadAudioRes = await tryCatchAsync(() =>
        audioServer.preload(config.assets.audio)
    );
    if (isErr(loadAudioRes)) {
        console.error(`Error loading audio assets: ${loadAudioRes.error}`);
    }

    uiStore.updateCurrentState({ progress: 90, message: 'Setting up resources...' });
    setupResources(addResource);

    uiStore.updateCurrentState({ progress: 100, message: 'Done!' });
};