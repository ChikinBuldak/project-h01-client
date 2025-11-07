// src/stores/ui.types.ts

import type { InGameStateType } from "@/ecs/components/scenes/InGameStateComponent";

// Data for the Main Menu
export interface MainMenuUiState {
  type: 'MainMenu';
  selectedButton: 'Start' | 'Options';
  version: string;
}

// Data for the In-Game HUD
export interface InGameUiState extends InGameStateType {
  type: 'InGame';
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
export type MainMenuIntent = 'StartGame' | 'GoToOptions';
export type InGameIntent = 'ResumeGame' | 'ExitToMenu';
export type UserIntent = null | MainMenuIntent | InGameIntent ;