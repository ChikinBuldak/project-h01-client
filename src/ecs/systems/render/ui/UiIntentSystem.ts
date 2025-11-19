import { useUiStore, type IntentHandler, type IntentHandlerMap, type IntentMap} from "@/stores";
import type { System, SystemResourcePartial, World } from "@/types";
import { registerInGameIntents } from "@/utils/handlers/in-game.handlers";
import { registerMainMenuIntents } from "@/utils/handlers/main-menu.handlers";

/**
 * A System that read UI Intents and communicate them with the Zustand Store or/and ECS world
 */
export class UiIntentSystem implements System {
    private intentHandlers = new Map<keyof IntentMap, IntentHandler>();

    constructor() {
        console.log("Initializing UiIntentSystem...");
        // Register all known intent handlers
        registerMainMenuIntents(this);
        registerInGameIntents(this);
    }

    /**
     * Called by handler files (e.g., MainMenuIntentHandlers) to
     * register their logic in this system's map.
     */
    public register<K extends keyof IntentMap>(
        intentType: K,
        handler: IntentHandlerMap[K]
    ): void {
        if (this.intentHandlers.has(intentType)) {
            console.warn(`Intent handler for "${intentType}" is being overwritten.`);
        }
        this.intentHandlers.set(intentType, handler as IntentHandler);
    }

    update(world: World, _resources: SystemResourcePartial): void {
        const { userIntent } = useUiStore.getState();

        // No intent to process
        if (!userIntent) {
            return;
        }

        // Find the registered handler for this intent
        const handler = this.intentHandlers.get(userIntent.type);

        if (handler) {
            if ('payload' in userIntent) {
                (handler as (world: World, payload: any) => void)(world, userIntent.payload);
            } else {
                (handler as (world: World) => void)(world);
            }
        } else {
            console.error(`No intent handler registered for type: "${userIntent.type}"`);
        }

        queueMicrotask(() => useUiStore.getState().resetIntent());
    }
    render?(_world: World): void { }

}