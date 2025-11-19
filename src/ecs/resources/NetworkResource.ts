import type { Resource, System, SystemCtor, World } from "../../types/ecs";
import { parseServerMessage, SignalMessage, type ClientMessage, type ServerMessage } from "../../types/network";
import { isNone, isSome, none, some, unwrapOpt } from '../../types/option';
import { isErr, isOk, tryCatch, type Result } from "../../types/result";
import type { Option } from "../../types/option";
import { registerResource } from "@/utils/registry/resource.registry";
import type { LobbyClientMessage } from "@/types/room-manager.types";
import { ServerMessageSchema as LobbyServerMessageSchema, type ServerMessage as LobbyServerMessage, type WsAuthRequest } from '../../types/room-manager.types';
import type { HTTPResponseError, YourAverageHTTPResponse } from "@/types/http";
import { RestAPIResponseEvent } from "../events/RestAPIResponseEvent";
import { GameErrorEvent } from "../events/ErrorEvent";

/**
 * Default RTC configuration. Uses Google's public STUN servers.
 * You will need a TURN server for more reliable connections
 * behind restrictive (symmetric) NATs.
 */
const DEFAULT_RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

export type NetworkDiscordJoinData = {
    guildId: string, channelId: string, userId: string
}
export const parseLobbyServerMessage = (data: unknown) => LobbyServerMessageSchema.safeParse(data);
/**
 * A "Resource" that manages the WebRTC P2P connection.
 * Systems can query for this resource to send messages or check status.
 * It holds incoming messages in a queue to be processed by a system.
 *
 * This implementation uses a WebSocket for *signaling* to set up the
 * RTCPeerConnection and RTCDataChannel. The *game data* is sent
 * over the RTCDataChannel.
 */
export class NetworkResource implements Resource {
    // P2P Game properties
    private _signalingSocket: Option<WebSocket> = none;
    private _signalingUrl: string;
    public isConnected: boolean = false;
    private _peerConnection: Option<RTCPeerConnection> = none;
    private _dataChannel: Option<RTCDataChannel> = none;
    private rtcConfig: RTCConfiguration;
    private gameMessageQueue: ServerMessage[] = [];

    // Shared properties
    private stringIdToEntityId: Map<string, number> = new Map();
    private guildId: string;
    private channelId: string;
    private userId: string;

    // Waiting room fields
    private lobbyMessageQueue: LobbyServerMessage[] = [];
    public isLobbyConnected: boolean = false;
    public isLobbyConnecting: boolean = false;
    private _waitingRoomSocket: Option<WebSocket> = none;
    private _waitingRoomUrl: string;
    private _lobbyAuth: WsAuthRequest;
    private _heartbeatInterval: number | null = null;

    get lobbyAuth(): WsAuthRequest {
        return this._lobbyAuth;
    }

    get signalingSocket() {
        return this._signalingSocket
    }

    constructor(signalingUrl: string,
        waitingRoomUrl: string,
        joinData: { guildId: string, channelId: string, userId: string } | { userId: string },
        rtcConfig: RTCConfiguration = DEFAULT_RTC_CONFIG
    ) {
        this.rtcConfig = rtcConfig;
        const guildId = 'guildId' in joinData ? joinData.guildId : '';
        const channelId = 'channelId' in joinData ? joinData.channelId : '';
        this.guildId = guildId
        this.channelId = channelId
        this.userId = joinData.userId;

        this._waitingRoomUrl = waitingRoomUrl;
        this._signalingUrl = signalingUrl;

        this._lobbyAuth = guildId !== '' && channelId !== '' ? {
            type: 'Discord',
            guild_id: guildId,
            channel_id: channelId,
            user_id: joinData.userId
        } : {
            type: 'General',
            user_id: joinData.userId
        };
    }

    /**
     * Attempts to connect to the WebSocket server.
     */
    public connectToSignalingServer() {
        if (isSome(this._signalingSocket)) {
            console.warn("[NetworkResource] Already connected or connecting.");
            return;
        }
        
        const url = this._signalingUrl;

        const connectResult = tryCatch(() => new WebSocket(url));
        if (isErr(connectResult)) {
            console.error("[NetworkResource] Failed to create WebSocket:", connectResult.error);
            return;
        }

        const ws = connectResult.value;
        this._signalingSocket = some(ws);
        console.log(`[NetworkResource] Connecting to ${url}...`);

        ws.onopen = () => {
            // this.isConnected = true;
            console.log("[NetworkResource] Signaling socket connected.");
            this.sendSignalingMessage({
                type: 'join',
                guild_id: this.guildId,
                channel_id: this.channelId,
                peer_type: 'player',
                user_id: this.userId,
            });
        };

        ws.onmessage = (event) => {
            const parseResult = tryCatch(() => JSON.parse(event.data));
            if (isErr(parseResult)) {
                console.error("[NetworkResource] Failed to parse message JSON:", parseResult.error);
                return;
            }
            this.handleSignalingMessage(parseResult.value);

        };

        ws.onclose = () => {
            console.log("[NetworkResource] Signaling socket Disconnected.");
            this._signalingSocket = none;
            this.disconnectP2P();
        };

        ws.onerror = (error) => {
            console.error("[NetworkResource] WebSocket Error:", error);
            this._signalingSocket = none;
        };
    }

    public disconnect() {
        this.disconnectP2P();
        this.disconnectFromWaitingRoom();
        console.log("[NetworkResource] All connections closed");
    }

    /**
     * Closes the WebSocket connection.
     */
    public disconnectP2P() {
        if (isSome(this._dataChannel)) {
            this._dataChannel.value.close();
        }
        if (isSome(this._peerConnection)) {
            this._peerConnection.value.close();
        }
        if (isSome(this._signalingSocket)) {
            this._signalingSocket.value.close();
        }
        this._signalingSocket = none;
        this._dataChannel = none;
        this._peerConnection = none;
        this.isConnected = false;
        console.log("[NetworkResource] All connections closed");
    }

    private initPeerConnection() {
        if (isSome(this._peerConnection)) {
            console.warn("[NetworkResource] PeerConnection already initialized.");
            return;
        }

        const pc = new RTCPeerConnection(this.rtcConfig);
        this._peerConnection = some(pc);

        // PeerConnection Event handler
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        }

        // Called when the other peer opens a data channel
        pc.ondatachannel = (event) => {
            console.log('[NetworkResource] Received data channel');
            this._dataChannel = some(event.channel);
            this.setupDataChannelHandlers(event.channel);
        }

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[NetworkResource] PC State: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.disconnectP2P();
            }
        }
    }

    private sendSignalingMessage(message: object) {
        if (isSome(this._signalingSocket) && this._signalingSocket.value.readyState === WebSocket.OPEN) {
            const serializeResult = tryCatch(() => JSON.stringify(message));
            if (isOk(serializeResult)) {
                this._signalingSocket.value.send(serializeResult.value);
            } else {
                console.error("[NetworkResource] Failed to serialize signaling message:", serializeResult.error);
            }
        } else {
            console.warn("[NetworkResource] Signaling socket not open, cannot send message.");
        }
    }

    /**
     * Sets up the event handlers for the RTCDataChannel.
     * This is where game data is received.
     */
    private setupDataChannelHandlers(channel: RTCDataChannel) {
        channel.onopen = () => {
            this.isConnected = true;
            console.log("[NetworkResource] Data Channel is open.");
        };

        channel.onclose = () => {
            this.isConnected = false;
            console.log("[NetworkResource] Data Channel is closed.");
        };

        channel.onerror = (error) => {
            console.error("[NetworkResource] Data Channel Error:", error);
        };

        channel.onmessage = (event) => {
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
            this.gameMessageQueue.push(messageResult.data);
        };
    }

    /**
     * Handles incoming messages from the *signaling server*.
     */
    private async handleSignalingMessage(message: SignalMessage) {
        if (isNone(this._peerConnection) && message.type !== "create-offer" && message.type !== "offer") {
            this.initPeerConnection();
        }

        const pc = this._peerConnection.unwrap();

        try {
            switch (message.type) {
                // Server telling us to create an offer (we are the "host")
                case "create-offer":
                    this.initPeerConnection(); // Make sure it's created
                    console.log("[NetworkResource] Creating offer...");
                    const channel = unwrapOpt(this._peerConnection)!.createDataChannel("game");
                    this._dataChannel = some(channel);
                    this.setupDataChannelHandlers(channel);

                    const offer = await unwrapOpt(this._peerConnection)!.createOffer();
                    await unwrapOpt(this._peerConnection)!.setLocalDescription(offer);
                    this.sendSignalingMessage({ type: "offer", offer });
                    break;

                // Server sending us an offer from another peer
                case "offer":
                    this.initPeerConnection(); // Make sure it's created
                    console.log("[NetworkResource] Handling offer...");
                    await pc.setRemoteDescription(new RTCSessionDescription(message));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    this.sendSignalingMessage({ type: "answer", answer });
                    break;

                // Server sending us an answer from another peer
                case "answer":
                    console.log("[NetworkResource] Handling answer...");
                    await pc.setRemoteDescription(new RTCSessionDescription(message));
                    break;

                // Server sending us an ICE candidate from another peer
                case "ice-candidate":
                    if (message.candidate) {
                        await pc.addIceCandidate(new RTCIceCandidate(message));
                    }
                    break;

                default:
                    console.warn("[NetworkResource] Unknown signaling message type:", message.type);
            }
        } catch (error) {
            console.error("[NetworkResource] Error handling signaling message:", error);
        }
    }

    /**
     * Sends a message to the server.
     * @param message The ClientMessage to send.
     */
    public sendMessage(message: ClientMessage) {
        if (isNone(this._dataChannel) || !this.isConnected) {
            // console.warn("[NetworkResource] Cannot send message, data channel not connected.");
            return;
        }

        const serializeResult = tryCatch(() => JSON.stringify(message));
        if (isErr(serializeResult)) {
            console.error("[NetworkResource] Failed to serialize message:", serializeResult.error);
            return;
        }

        this._dataChannel.value.send(serializeResult.value);
    }

    /**
     * Drains the message queue, returning all pending messages.
     * @returns An array of ServerMessage.
     */
    public drainGameMessageQueue(): ServerMessage[] {
        const messages = [...this.gameMessageQueue];
        this.gameMessageQueue = [];
        return messages;
    }

    // --- ID Mapping ---

    public setServerId(serverId: string, entityId: number) {
        this.stringIdToEntityId.set(serverId, entityId);
    }

    public getEntityId(serverId: string): number | undefined {
        return this.stringIdToEntityId.get(serverId);
    }

    public getGameMessageQueue() {
        return this.gameMessageQueue;
    }

    public removeMappingByEntityId(entityId: number) {
        for (const [key, value] of this.stringIdToEntityId.entries()) {
            if (value === entityId) {
                this.stringIdToEntityId.delete(key);
                break;
            }
        }
    }

    // =======================================================================   
    /// ====================Waiting ROOM API=================================
    // ========================================================================

    public connectToWaitingRoom(onOpenCallback?: () => void) {
        if (isSome(this._waitingRoomSocket) || this.isLobbyConnecting) {
            console.warn("[NetworkResource] Already connected or connecting to Waiting Room.");
            return;
        }

        this.isLobbyConnecting = true;
        const connectResult = tryCatch(() => new WebSocket(this._waitingRoomUrl));
        if (isErr(connectResult)) {
            console.error("[NetworkResource] Failed to create Waiting Room WebSocket:", connectResult.error);
            this.isLobbyConnecting = false;
            return;
        }

        const ws = connectResult.value;
        this._waitingRoomSocket = some(ws);
        console.log(`[NetworkResource] Connecting to Waiting Room ${this._waitingRoomUrl}...`);

        ws.onopen = (_event: Event) => {
            this.handleWaitingRoomOpen();
            onOpenCallback?.();

        };
        ws.onmessage = this.handleWaitingRoomMessage;
        ws.onclose = this.handleWaitingRoomClose;
        ws.onerror = this.handleWaitingRoomError;
    }

    private handleWaitingRoomOpen = () => {
        console.log("[NetworkResource] Waiting Room socket connected.");
        this.isLobbyConnecting = false;
        this.isLobbyConnected = true;

        // Clear any old interval just in case
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
        }

        // Start a new one. Send a ping every 25 seconds.
        this._heartbeatInterval = window.setInterval(() => {
            // Check if the socket is still open before sending
            if (
                isSome(this._waitingRoomSocket) &&
                this._waitingRoomSocket.value.readyState === WebSocket.OPEN
            ) {
                console.log("[Heartbeat] Sending ping");
                // Assuming sendWaitingRoomMessage handles stringifying
                this.sendWaitingRoomMessage({ type: "ping" });
            }
        }, 25000);
    };

    private handleWaitingRoomMessage = (event: MessageEvent) => {
        const parseResult = tryCatch(() => JSON.parse(event.data));
        if (isErr(parseResult)) {
            console.error("[NetworkResource] Failed to parse lobby message JSON:", parseResult.error);
            return;
        }

        const messageResult = parseLobbyServerMessage(parseResult.value);
        if (!messageResult.success) {
            console.warn("[NetworkResource] Received invalid lobby message shape:", messageResult.error);
            return;
        }

        const data = messageResult.data;
        this.lobbyMessageQueue.push(data);
    };

    private handleWaitingRoomClose = () => {
        console.log("[NetworkResource] Waiting Room socket disconnected.");
        this._waitingRoomSocket = none;
        this.isLobbyConnected = false;
        this.isLobbyConnecting = false;
    };

    private handleWaitingRoomError = (error: Event) => {
        console.error("[NetworkResource] Waiting Room WebSocket Error:", error);
        this._waitingRoomSocket = none;
        this.isLobbyConnected = false;
        this.isLobbyConnecting = false;
    };


    /**
     * Sends a message to the Waiting Room WebSocket server.
     */
    public sendWaitingRoomMessage(message: LobbyClientMessage | WsAuthRequest) {
        if (isSome(this._waitingRoomSocket) && this._waitingRoomSocket.value.readyState === WebSocket.OPEN) {
            const serializeResult = tryCatch(() => JSON.stringify(message));
            if (isOk(serializeResult)) {
                this._waitingRoomSocket.value.send(serializeResult.value);
            } else {
                console.error("[NetworkResource] Failed to serialize lobby message:", serializeResult.error);
            }
        } else {
            console.warn("[NetworkResource] Waiting Room socket not open, cannot send message.");
        }
    }

    public drainLobbyMessageQueue(): LobbyServerMessage[] {
        const messages = [...this.lobbyMessageQueue];
        this.lobbyMessageQueue = [];
        return messages;
    }

    public disconnectFromWaitingRoom() {
        if (this._waitingRoomSocket.isSome()) {
            this._waitingRoomSocket.unwrap().close();
        }
        this._waitingRoomSocket = none;
        this.isLobbyConnected = false;
        this.isLobbyConnecting = false;
        console.log("[NetworkResource] Waiting Room connection closed.");
    }

    // ===================================================
    // =============== UTILS METHOD ======================
    // ===================================================

    /**
     * Send HTTP request from handler and send RestAPIResponseEvent to the world or GameErrorEvent if it is error
     * @param world 
     * @param handler 
     * @param forWhom To label what instances this message is intended for
     * @returns 
     */
    static async sendHTTPRequest<TargetSystem extends System, PayloadType>(world: World, handler: () => Promise<Result<YourAverageHTTPResponse<PayloadType>, HTTPResponseError>>, forWhom?: SystemCtor<TargetSystem>) {
        let result = await handler();
        if (result.isErr()) {
            const { statusCode, message } = result.unwrap()
            world.sendEvent(new GameErrorEvent(statusCode, message));
            return;
        }

        // If ok, send event message
        world.deferEvent(new RestAPIResponseEvent(result.unwrap(), forWhom));
    }

}

registerResource("networkResource", NetworkResource);

declare module "@/utils/registry/resource.registry" {
    interface ResourceRegistry {
        networkResource: NetworkResource;
    }
}