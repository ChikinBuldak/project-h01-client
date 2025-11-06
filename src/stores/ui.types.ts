// src/stores/ui.types.ts

// Data for the Main Menu
export interface MainMenuUiState {
  type: 'MainMenu';
  selectedButton: 'Start' | 'Options';
  version: string;
}

// Data for the In-Game HUD
export interface InGameUiState {
  type: 'InGame';
  health: number;
  maxHealth: number;
  score: number;
}

// Data for the Loading Screen
export interface LoadingUiState {
  type: 'Loading';
  progress: number;
  message: string;
}

// A discriminated union of all possible UI states
export type UiState = MainMenuUiState | InGameUiState | LoadingUiState;

type DistributePartial<T> = T extends any ? Partial<T> : never;
export type PartialUiState = DistributePartial<UiState>;
export type UserIntent = null | 'StartGame' | 'GoToOptions';