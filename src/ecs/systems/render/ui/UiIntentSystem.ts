import { useUiStore, type IntentHandler, type UserIntent } from "@/stores";
import type { System, SystemResourcePartial, World } from "@/types";
import { registerInGameIntents } from "@/utils/handlers/in-game.handlers";
import { registerMainMenuIntents } from "@/utils/handlers/main-menu.handlers";

/**
 * A System that read UI Intents and communicate them with the Zustand Store or/and ECS world
 */
export class UiIntentSystem implements System {
    private intentHandlers = new Map<UserIntent['type'], IntentHandler>();

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
    public register(intentType: UserIntent['type'], handler: IntentHandler): void {
        if (this.intentHandlers.has(intentType)) {
            console.warn(`Intent handler for "${intentType}" is being overwritten.`);
        }
        this.intentHandlers.set(intentType, handler);
    }

    update(world: World, _resources: SystemResourcePartial): void {
        const { userIntent, resetIntent } = useUiStore.getState();

        // No intent to process
        if (!userIntent) {
            return;
        }

        // Find the registered handler for this intent
        const handler = this.intentHandlers.get(userIntent.type);

        if (handler) {
            // Found it. Execute the logic.
            // We cast `userIntent` to `any` to easily access the optional `payload`
            handler(world, (userIntent as any).payload);
        } else {
            // This is a "program error" - an intent was fired
            // but no system registered a handler for it.
            console.error(`No intent handler registered for type: "${userIntent.type}"`);
        }

        // IMPORTANT: Clear the intent from the store so it's only processed once.
        resetIntent();
    }
    render?(_world: World): void {}

}