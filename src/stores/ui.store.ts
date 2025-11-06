import { create } from 'zustand';
import type { LoadingUiState, PartialUiState, UiState, UserIntent } from './ui.types';

interface UiStore {
    /**The single source of truth for UI state */
    state: UiState
    /**
   * Replaces the entire state. Used by AppState (onEnter) 
   * to set the initial state for MainMenu, InGame, etc.
   */
    transitionTo: (newState: UiState) => void;

    /**
   * Merges data into the *current* state. Used by UIRenderSystems
   * to send small, frequent updates (like health/score).
   */
    updateCurrentState: (data: PartialUiState) => void;
    /** A state to hold UI button click intents */
    userIntent: UserIntent;
    /** An action for React components to call */
    sendIntent: (intent: UserIntent) => void;

}

export const useUiStore = create<UiStore>((set) => ({
    state: {
        type: 'Loading',
        progress: 0,
        message: 'Initializing',
    } as LoadingUiState,
    transitionTo: (newState) => set({ state: newState }),
    updateCurrentState: (data) =>
        set((store) => {
            if (data.type && data.type !== store.state.type) {
                console.warn(`UI update skipped: System tried to update with type '${data.type}' but current UI state is '${store.state.type}'.`);
                return store;
            }

            return { state: { ...store.state, ...data } as UiState };
        }),
    userIntent: null,
    sendIntent: (intent) => set({ userIntent: intent }),
}))