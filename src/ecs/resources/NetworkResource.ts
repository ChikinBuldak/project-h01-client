import type { Resource } from "../../types/ecs";
import { parseServerMessage, type ClientMessage, type PlayerInput, type ServerMessage } from "../../types/network";
import { isNone, isSome, none, some } from "../../types/option";
import { isErr, isOk, tryCatch } from "../../types/result";
import type { Option } from "../../types/option";

/**
 * A Bevy-style "Resource" that manages the WebSocket connection.
 * Systems can query for this resource to send messages or check status.
 * It holds incoming messages in a queue to be processed by a system.
 */
export class NetworkResource implements Resource {
    public socket: Option<WebSocket> = none;
    public isConnected: boolean = false;
    private messageQueue: ServerMessage[] = [];
    private stringIdToEntityId: Map<string, number> = new Map();

    constructor(url: string) {
        this.connect(url);
    }

    /**
     * Attempts to connect to the WebSocket server.
     */
    private connect(url: string) {
        if (isSome(this.socket)) {
            console.warn("[NetworkResource] Already connected or connecting.");
            return;
        }

        const connectResult = tryCatch(() => new WebSocket(url));
        if (isErr(connectResult)) {
            console.error("[NetworkResource] Failed to create WebSocket:", connectResult.error);
            return;
        }

        const ws = connectResult.value;
        this.socket = some(ws);
        console.log(`[NetworkResource] Connecting to ${url}...`);

        ws.onopen = () => {
            this.isConnected = true;
            console.log("[NetworkResource] Connected.");
        };

        ws.onmessage = (event) => {
            const parseResult = tryCatch(() => JSON.parse(event.data));
            if (isErr(parseResult)) {
                console.error("[NetworkResource] Failed to parse message JSON:", parseResult.error);
                return;
            }
            
            // Use Zod to validate the parsed message
            const messageResult = parseServerMessage(parseResult.value);
            if (!messageResult.success) {
                console.warn("[NetworkResource] Received invalid message shape:", messageResult.error);
                return;
            }

            // Add the valid message to the queue
            this.messageQueue.push(messageResult.data);
        };

        ws.onclose = () => {
            this.isConnected = false;
            this.socket = none;
            console.log("[NetworkResource] Disconnected.");
        };

        ws.onerror = (error) => {
            console.error("[NetworkResource] WebSocket Error:", error);
            this.isConnected = false;
            this.socket = none;
        };
    }

    /**
     * Closes the WebSocket connection.
     */
    public disconnect() {
        if (isSome(this.socket)) {
            this.socket.value.close();
            this.socket = none;
            this.isConnected = false;
        }
    }

    /**
     * Sends a message to the server.
     * @param message The ClientMessage to send.
     */
    public sendMessage(message: ClientMessage) {
        if (isNone(this.socket) || !this.isConnected) {
            // console.warn("[NetworkResource] Cannot send message, not connected.");
            return;
        }

        const serializeResult = tryCatch(() => JSON.stringify(message));
        if (isErr(serializeResult)) {
            console.error("[NetworkResource] Failed to serialize message:", serializeResult.error);
            return;
        }

        this.socket.value.send(serializeResult.value);
    }

    /**
     * Drains the message queue, returning all pending messages.
     * @returns An array of ServerMessage.
     */
    public drainMessageQueue(): ServerMessage[] {
        const messages = [...this.messageQueue];
        this.messageQueue = [];
        return messages;
    }

    // --- ID Mapping ---

    public setServerId(serverId: string, entityId: number) {
        this.stringIdToEntityId.set(serverId, entityId);
    }

    public getEntityId(serverId: string): number | undefined {
        return this.stringIdToEntityId.get(serverId);
    }

    public getMessageQueue() {
        return this.messageQueue;
    }

    public removeMappingByEntityId(entityId: number) {
        for (const [key, value] of this.stringIdToEntityId.entries()) {
            if (value === entityId) {
                this.stringIdToEntityId.delete(key);
                break;
            }
        }
    }
}
