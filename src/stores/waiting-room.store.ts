import { ServerMessageSchema, ServerSuccessCode, type RoomState, type WsAuthRequest } from "@/types/room-manager.types";
import { create } from "zustand";
import { shallow } from "zustand/shallow";

interface WaitingRoomState {
    isConnected: boolean;
    isConnecting: boolean;
    currentRoom: RoomState | null;
    error: string | null;
}

// --- These are the actions to *update* the state ---
// (These will be called by the new LobbyUiSystem)
interface WaitingRoomActions {
    setConnecting: () => void;
    setConnected: () => void;   
    setDisconnected: () => void;
    setError: (error: string) => void;
    setRoomState: (room: RoomState) => void;
}

type FullStore = WaitingRoomState & WaitingRoomActions;

export const useWaitingRoomStore = create<FullStore>()((set) => ({
    // --- Initial State ---
    isConnected: false,
    isConnecting: false,
    currentRoom: null,
    error: null,

    // --- State Updaters (called by LobbyUiSystem) ---
    setConnecting: () => set({ 
        isConnecting: true, 
        isConnected: false, 
        currentRoom: null, 
        error: null 
    }),
    
    setConnected: () => set({ 
        isConnecting: false, 
        isConnected: true, 
        error: null 
    }),
    
    setDisconnected: () => set({
        isConnecting: false,
        isConnected: false,
        currentRoom: null,
        // We can decide to preserve error:
        // error: get().error 
    }),
    
    setError: (error: string) => set({
        error,
        isConnecting: false,
        isConnected: false,
        currentRoom: null
    }),
    
    setRoomState: (room: RoomState) => set((prev) => {
        if (shallow(prev.currentRoom, room)) {
            return prev;
        }
        return { ...prev, currentRoom: room };
    }),
}));