import { LobbyRoomComponent, LobbyStateComponent, PlayerInLobbyComponent } from "@/ecs/components/network/lobby-room.component";
import { GameErrorEvent } from "@/ecs/events/ErrorEvent";
import { RestAPIResponseEvent } from "@/ecs/events/RestAPIResponseEvent";
import WebSocketRequestEvent from "@/ecs/events/WebSocketRequestEvent";
import { handleStartGameUniversal } from "@/ecs/scenes";
import { useUiStore } from "@/stores";
import { Entity, type System, type SystemResourcePartial, type World } from "@/types";
import { CreateRoomResponseSchema, JoinRoomResponseSchema } from "@/types/room-manager.types";

/**
 * System that handle connection by client, and send message action from client to server
 */
export class LobbyConnectionSystem implements System {
    update(world: World, { networkResource }: SystemResourcePartial): void {
        if (!networkResource) return;
        const stateRes = world.queryWithEntitySingle(LobbyStateComponent);
        if (!stateRes.some) {
            const newLobbyEntity = new Entity();
            newLobbyEntity.addComponent(new LobbyStateComponent());
            world.addEntity(newLobbyEntity);
            console.log("[LobbyConnectionSystem] add new LobbyStateComponent")
            return;
        };

        const { transitionTo } = useUiStore.getState();

        const [lobbyEntity, state] = stateRes.value;

        if (networkResource?.isLobbyConnecting && state.status !== "connecting") {
            state.status = 'connecting';
        } else if (networkResource.isLobbyConnected && state.status === "connecting") {
            state.status = "connected";
            console.log("[LobbyConnectionSystem] WebSocket connected. Status set to 'connected'.");
        } else if (!networkResource.isLobbyConnected && state.status !== "disconnected") {
            // The socket dropped!
            state.status = "disconnected";
            state.currentRoomId = null;
            state.pendingJoinRoomId = null;
            world.removeComponent(lobbyEntity, LobbyRoomComponent);
            // Despawn all lobby players
            for (const [entity, _] of world.queryWithEntity(PlayerInLobbyComponent)) {
                world.removeEntity(entity.id);
            }
        }

        // read websocket waiting room events 
        const events = world.readEvents(WebSocketRequestEvent);

        for (const event of events) {
            switch (event.body.type) {
                case 'leave_room':
                    if (state.status === 'joined' && state.currentRoomId) {
                        console.log(`[LobbySystem] Leaving room ${state.currentRoomId}...`);
                        networkResource.sendWaitingRoomMessage({
                            type: "leave_room",
                            room_id: state.currentRoomId,
                        });

                        world.removeComponent(lobbyEntity, LobbyRoomComponent);

                        // trigger transition
                        useUiStore.getState().transitionTo({
                            type: 'MainMenu',
                            currentSection: 'Main',
                            selectedButton: 'SearchForRooms',
                            version: '1.0.0',
                        });
                    }
                    state.pendingJoinRoomId = null;
                    break;
                case 'create_room':
                    // Narrow the body to the create_room shape so TypeScript knows it has name/max_capacity
                    const createBody = event.body;

                    if (networkResource.isLobbyConnected) {
                        console.log("[LobbyConnectionSystem] Socket already open. Sending create_room message...");
                        networkResource.sendWaitingRoomMessage({
                            type: 'create_room',
                            auth: networkResource.lobbyAuth,
                            name: createBody.name,
                            max_capacity: createBody.max_capacity
                        });
                        state.status = "joining";
                        console.log("[LobbyConnectionSystem] Transitioned to Waiting Room...");
                        transitionTo({
                            type: 'WaitingRoom'
                        })
                    } else {
                        console.log("[LobbyConnectionSystem] Client socket never connected. Initializing connection...");
                        const callback = () => {
                            networkResource.sendWaitingRoomMessage({
                                type: 'create_room',
                                auth: networkResource.lobbyAuth,
                                name: createBody.name,
                                max_capacity: createBody.max_capacity
                            });
                            state.status = "joining";
                            console.log("[LobbyConnectionSystem] connecting to Waiting Room...");
                            transitionTo({
                                type: 'WaitingRoom'
                            })
                        }
                        networkResource.connectToWaitingRoom(callback);
                    }
                    break;
                case 'connect':
                    const joinBody = event.body;

                    if (networkResource.isLobbyConnected) {
                        console.log("[LobbyConnectionSystem] Socket already open. Sending connect message...");
                        networkResource.sendWaitingRoomMessage(joinBody);
                        state.status = "joining";
                        console.log("[LobbyConnectionSystem] connecting to Waiting Room...");
                        transitionTo({
                            type: 'WaitingRoom'
                        });
                    } else {
                        console.log("[LobbyConnectionSystem] WebSocket connection haven't been established. Initializing connection...");
                        networkResource.connectToWaitingRoom(() => {
                            networkResource.sendWaitingRoomMessage(joinBody);
                            state.status = "joining";
                            console.log("[LobbyConnectionSystem] connecting to Waiting Room...");
                            transitionTo({
                                type: 'WaitingRoom'
                            });
                        });
                    }
                    break;
                case 'start_game':
                    // we will trigger transition
                    console.log("[LobbyConnectionSystem] Start the game...");

                    networkResource.sendWaitingRoomMessage(event.body);

                    // NOTE: the transition stage will be handle by LobbyMessageSystem
                    break;
                default:
                    console.warn("[LobbyConnectionSystem] Unhandled request type");
                    break;
            }
        }
    }
}

/**
 * System that drain messages received from waiting room server, then read them, and handle them.
 */
export class LobbyMessageSystem implements System {
    update(world: World, { networkResource: network }: SystemResourcePartial): void {
        if (!network) {
            console.log("[LobbyMessageSystem] No network resource available");
            return;
        };

        const stateRes = world.queryWithEntitySingle(LobbyStateComponent);
        if (!stateRes.some) return;

        // get response from RestAPIResponse Event
        const [lobbyEntity, state] = stateRes.value;

        const messages = network.drainLobbyMessageQueue();
        for (const message of messages) {
            switch (message.type) {
                case 'error':
                    console.error(`[LobbySystem] Error: ${message.message}`);
                    state.status = "error";
                    state.error = message.message;
                    state.pendingJoinRoomId = null;
                    break;
                case 'room_state':
                    console.log("[LobbySystem] Processing room_state...");

                    if (state.status === "joining" || state.status === "connected") {
                        state.status = "joined";
                        state.currentRoomId = message.room_id;
                        console.log(`[LobbySystem] Successfully joined room ${message.room_id}. Status set to 'joined'.`);
                    }

                    world.addComponent(lobbyEntity, new LobbyRoomComponent(message))
                    // get the LobbyRoomComponent
                    const lobbyRoomComponentRes = world.querySingle(LobbyRoomComponent);
                    if (lobbyRoomComponentRes.some) {
                        const [lobbyRoomComponent] = lobbyRoomComponentRes.value;
                        lobbyRoomComponent.set(message);

                        const knownPlayers = new Map<string, Entity>();
                        const playerLobbyQuery = world.queryWithEntity(PlayerInLobbyComponent);
                        for (const [entity, player] of playerLobbyQuery) {
                            knownPlayers.set(player.userId, entity);
                        }

                        // Add new players
                        for (const memberId of message.members) {
                            if (!knownPlayers.has(memberId)) {
                                const playerEntity = new Entity()
                                const playerComp = new PlayerInLobbyComponent(memberId);
                                playerComp.isHost = (memberId === message.owner_id);
                                playerEntity.addComponent(playerComp);
                                world.addEntity(playerEntity);
                                console.log(`[LobbySystem] Spawning player ${memberId}`);
                            }
                            knownPlayers.delete(memberId);
                        }

                        for (const [userId, entity] of knownPlayers.entries()) {
                            console.log(`[LobbySystem] Despawning player ${userId}`);
                            world.removeEntity(entity.id);
                        }
                    }
                    break;
                case 'game_started':
                    const loadingTask = async (world: World) => {
                        const uiStore = useUiStore.getState();
                        // disconnect the waiting room socket
                        state.status = "disconnected";
                        state.currentRoomId = null;
                        state.pendingJoinRoomId = null;
                        world.removeComponent(lobbyEntity, LobbyRoomComponent);
                        // Despawn all lobby players
                        for (const [entity, _] of world.queryWithEntity(PlayerInLobbyComponent)) {
                            world.removeEntity(entity.id);
                        }

                        uiStore.updateCurrentState({ 'progress': 10 });

                        // Connect with signaling socket
                        network.connectToSignalingServer();

                        // wait until connected
                        try {
                            await new Promise<void>((resolve, reject) => {
                                const timeout = setTimeout(() => reject(new Error("Timeout connecting")), 5000);
                                const check = setInterval(() => {
                                    if (!network.signalingSocket || !network.signalingSocket.some) {
                                        reject(new Error("None value of _signalingSocket"));
                                        return;
                                    }
    
                                    if (network.signalingSocket.value.readyState === WebSocket.OPEN) {
                                        clearInterval(check);
                                        clearTimeout(timeout);
                                        resolve();
                                    }
                                }, 100);
                            });
                        } catch (e) {
                            console.error("Error when checking signaling connection:", (e as Error).message);
                            world.sendEvent(new GameErrorEvent(500, (e as Error).message))
                            return;
                        }

                        uiStore.updateCurrentState({progress: 20});

                        // TODO: Handle all initialization required for the client before entering game state
                    };

                    handleStartGameUniversal(world, loadingTask);
                    break;
                case 'pong':
                    break;
            }
        }
    }
}

export class LobbyRestApiResponseSystem implements System {
    update(_world: World): void {

    }
}