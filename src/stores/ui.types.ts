// src/stores/ui.types.ts

import type { InGameStateType } from "@/ecs/components/scenes/InGameStateComponent";
import type { World } from "@/types";
import type { LobbyClientConnect, LobbyClientCreateRoom, LobbyClientLeaveRoom } from "@/types/room-manager.types";

// Data for the Main Menu
export interface MainMenuUiState {
  type: 'MainMenu';
  currentSection: 'Main' | 'Options' | 'RoomSearch' | 'WaitingRoom';
  selectedButton: MainMenuIntent;
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

export interface WaitingRoomUiState {
  type: 'WaitingRoom';
}

// A discriminated union of all possible UI states
export type UiState = 
| MainMenuUiState 
| InGameUiState 
| LoadingUiState
| WaitingRoomUiState;

type DistributePartial<T> = T extends any ? Partial<T> : never;
export type PartialUiState = DistributePartial<UiState>;
export type MainMenuIntent = 'Start' | 'Options' | 'SearchForRooms' | 'BackToMainMenu';
export type InGameIntent = 'ResumeGame' | 'ExitToMenu';
export interface IntentMap  {
    // Main Menu Intents
  'Start': void;
  'Options': void;
  'SearchForRooms': void;
  'BackToMainMenu': void;
  'CreateRoom': Pick<LobbyClientCreateRoom, 'name' | 'max_capacity'>;
  "JoinRoom": Pick<LobbyClientConnect, 'room_id'>;
  
  
  // In-Game Intents
  'ResumeGame': void;
  'ExitToMenu': void;

  // Waiting Room Intents
  'LeaveRoom': Pick<LobbyClientLeaveRoom, 'room_id'>;
  'StartGame': void;
}

export type UserIntent = {
  [K in keyof IntentMap]: IntentMap[K] extends void
    ? { type: K }
    : { type: K; payload: IntentMap[K] }
}[keyof IntentMap];

export type IntentState = UserIntent | null;

export type IntentHandlerMap = {
  [K in keyof IntentMap]: IntentMap[K] extends void
    ? (world: World) => void
    : (world: World, payload: IntentMap[K]) => void;
};

export type IntentHandler = IntentHandlerMap[keyof IntentMap];