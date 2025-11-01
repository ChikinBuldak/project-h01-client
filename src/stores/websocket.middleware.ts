import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { isErr, isOk, ok, tryCatch } from "../types/result";
import { parseServerMessage } from "../types/network";
import { type WorldStore } from './world.stores';

/**
 * Middleware that handles WebSocket connection
 */
type WSMiddleware = <
    T extends WorldStore,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
    f: StateCreator<T, Mps, Mcs>,
) => StateCreator<WithWebSocket<T>, Mps, Mcs>;

export type WebSocketState = {
    socket: WebSocket | null;
    isConnected: boolean;
};

export type WebSocketAction = {
    connect: (url: string) => void;
    disconnect: () => void;
    sendMessage: (message: any) => void;
};

export type WithWebSocket<T> = T & WebSocketState & WebSocketAction;

/**
 * WebSocket middleware implementation
 */
export const wsMiddleware: WSMiddleware = <
    T extends WorldStore,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
    f: StateCreator<T, Mps, Mcs>
): StateCreator<WithWebSocket<T>, Mps, Mcs> => (set, get, store) => {
    // Initialize the base store with WebSocket state
    const baseState = f(
        set,
        get,
        store
    );

    // WebSocket event handlers
    const handleOpen = () => {
        console.log('[WS] Connection opened');
        set({ isConnected: true } as Partial<WithWebSocket<T>>);
    };

    const handleClose = () => {
        console.log('[WS] Connection closed');
        set({
            isConnected: false,
            socket: null
        } as Partial<WithWebSocket<T>>);
    };

    const handleError = (event: Event) => {
        console.error('[WS] Error:', event);
        set({ isConnected: false }  as Partial<WithWebSocket<T>>);
    };

    const handleMessage = (event: MessageEvent) => {
        const jsonResult = tryCatch(() => JSON.parse(event.data));

        if (!isOk(jsonResult)) {
            console.error('[WS] Failed to parse message JSON:', jsonResult.error);
            return;
        }

        const data = parseServerMessage(jsonResult.value);

        if (data) {
            if (get().handleWSMessage && typeof get().handleWSMessage === 'function') {
                get().handleWSMessage(data);
            }
        }
    };

    // WebSocket actions
    const connect = (url: string) => {
        const currentSocket = get().socket;

        // Close existing connection if any
        if (currentSocket) {
            currentSocket.close();
        }

        const result = tryCatch(() => new WebSocket(url));

        if (isOk(result)) {
            const ws = result.value;

            // Attach event listeners
            ws.addEventListener('open', handleOpen);
            ws.addEventListener('close', handleClose);
            ws.addEventListener('error', handleError);
            ws.addEventListener('message', handleMessage);

            set({ socket: ws } as any);
            console.log('[WS] Connecting to:', url);
        } else {
            console.error('[WS] Failed to create WebSocket:', result.error);
            set({
                socket: null,
                isConnected: false
            } as any);
        }
    };

    const disconnect = () => {
        const socket = get().socket;

        if (socket) {
            // Remove event listeners to prevent memory leaks
            socket.removeEventListener('open', handleOpen);
            socket.removeEventListener('close', handleClose);
            socket.removeEventListener('error', handleError);
            socket.removeEventListener('message', handleMessage);

            socket.close();
            console.log('[WS] Disconnecting');
        }

        set({
            socket: null,
            isConnected: false
        } as any);
    };

    const sendMessage = (message: any) => {
        const socket = get().socket;

        if (!socket) {
            // console.warn('[WS] Cannot send message: not connected');
            return;
        }

        if (socket.readyState !== WebSocket.OPEN) {
            console.warn('[WS] Cannot send message: connection not open');
            return;
        }

        const result = tryCatch(() => {
            const data = typeof message === 'string'
                ? message
                : JSON.stringify(message);
            socket.send(data);
            return ok(undefined);
        });

        if (isErr(result)) {
            console.error('[WS] Failed to send message:', result.error);
        }
    };

    // Return the enhanced state with WebSocket functionality
    return {
        ...baseState,
        socket: null,
        isConnected: false,
        connect,
        disconnect,
        sendMessage,
    };
};