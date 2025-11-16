import { LobbyRoomComponent, LobbyStateComponent, PlayerInLobbyComponent } from "@/ecs/components/network/lobby-room.component";
import { GameErrorEvent } from "@/ecs/events/ErrorEvent";
import { JoinRoomEvent, LeaveRoomEvent } from "@/ecs/events/LobbyEvent";
import { RestAPIResponseEvent } from "@/ecs/events/RestAPIResponseEvent";
import { useUiStore } from "@/stores";
import { Entity, type System, type SystemResourcePartial, type World } from "@/types";
import { CreateRoomResponseSchema, JoinRoomResponseSchema, ServerSuccessCode } from "@/types/room-manager.types";

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

        if (state.status === "connected" && state.pendingJoinRoomId) {
            const roomIdToJoin = state.pendingJoinRoomId;
            state.pendingJoinRoomId = null; // Clear it *before* sending

            console.log(`[LobbyConnectionSystem] Sending deferred connect for room ${roomIdToJoin}...`);
            networkResource.sendWaitingRoomMessage({
                type: "connect",
                auth: networkResource.lobbyAuth, // Make sure networkResource has auth info
                room_id: roomIdToJoin,
            });

            // Set status to "joining" so we know we've sent the connect message
            state.status = "joining";
        }

        const leaveEvents = world.readEvents(LeaveRoomEvent);
        for (const _ of leaveEvents) {
            if (state.status === 'joined' && state.currentRoomId) {
                console.log(`[LobbySystem] Leaving room ${state.currentRoomId}...`);
                networkResource.sendWaitingRoomMessage({
                    type: "leave_room",
                    room_id: state.currentRoomId,
                });

                world.removeComponent(lobbyEntity, LobbyRoomComponent);
            }
            state.pendingJoinRoomId = null;
        }
    }
}

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
            console.log(message);
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
                        console.log("create new members");
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
                case 'pong':
                    break;
            }
        }
    }
}

export class LobbyRestApiResponseSystem implements System {
    update(world: World, { networkResource: network }: SystemResourcePartial): void {
        if (!network) {
            console.log("[LobbyRestApiSystem] No network resource available");
            return;
        }

        const stateRes = world.querySingle(LobbyStateComponent);
        if (!stateRes.some) {
            console.error("[LobbyRestApiSystem] No LobbyStateComponent found!");
            return; 
        }
        const [state] = stateRes.value;

        const { transitionTo, setError } = useUiStore.getState();

        // check for error event
        const errorEvents = world.readEvents(GameErrorEvent);
        for (const event of errorEvents) {
            // show the error UI dialog
            const { code, message } = event;
            setError({ code, message })
        }

        

        // read events
        const restApiEvents = world.readEvents(RestAPIResponseEvent);

        for (const event of restApiEvents) {
            // check intended receiver of events
            if (event.forWhom && event.forWhom.name === this.constructor.name) {
                // read the message
                // TODO: Add safe parse for the response, and handle it gracefully
                if (event.response.payload) {
                    // handle create room message
                    const createRoomParsed = CreateRoomResponseSchema.safeParse(event.response.payload);
                    if (createRoomParsed.success) {
                        const { room_id, owner_id, name, max_capacity, created_at } = createRoomParsed.data

                        if (network.isLobbyConnected) {
                            // Socket is already open, send connect message immediately
                            console.log("[LobbyRestApiSystem] Socket already open. Sending connect message...");
                            network.sendWaitingRoomMessage({
                                type: 'connect',
                                auth: network.lobbyAuth,
                                room_id: room_id
                            });
                            state.status = "joining";
                        } else {
                            // Socket is closed, set pending ID and let ConnectionSystem handle it
                            console.log("[LobbyRestApiSystem] Socket closed. Setting pendingJoinRoomId...");
                            state.pendingJoinRoomId = room_id;
                            network.connectToWaitingRoom();
                        }

                        // try to connect to the 
                        // change the value of waiting room system
                        transitionTo({
                            type: 'WaitingRoom',
                            roomId: room_id,
                            ownerId: owner_id,
                            name,
                            maxCapacity: max_capacity,
                            createdAt: created_at.toISOString(),
                            members: [owner_id]
                        })
                        return;
                    }

                    // handle join room event
                    const joinRoomParsed = JoinRoomResponseSchema.safeParse(event.response.payload);
                    if (joinRoomParsed.success) {
                        const { room_id, owner_id, name, max_capacity, created_at, members } = joinRoomParsed.data;

                        if (network.isLobbyConnected) {
                            // Socket is already open, send connect message immediately
                            console.log("[LobbyRestApiSystem] Socket already open. Sending connect message...");
                            network.sendWaitingRoomMessage({
                                type: 'connect',
                                auth: network.lobbyAuth,
                                room_id: room_id
                            });
                            state.status = "joining";
                        } else {
                            // Socket is closed, set pending ID and let ConnectionSystem handle it
                            console.log("[LobbyRestApiSystem] Socket closed. Setting pendingJoinRoomId...");
                            state.pendingJoinRoomId = room_id;
                            network.connectToWaitingRoom();
                        }
                        
                        transitionTo({
                            type: 'WaitingRoom',
                            roomId: room_id,
                            ownerId: owner_id,
                            name,
                            maxCapacity: max_capacity,
                            createdAt: created_at.toISOString(),
                            members
                        });
                        return;
                    }
                }
            }
        }
    }
}