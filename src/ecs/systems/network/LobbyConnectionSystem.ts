import { LobbyRoomComponent, LobbyStateComponent, PlayerInLobbyComponent } from "@/ecs/components/network/lobby-room.component";
import { JoinRoomEvent, LeaveRoomEvent } from "@/ecs/events/LobbyEvent";
import { Entity, type System, type SystemResourcePartial, type World } from "@/types";
import { ServerSuccessCode } from "@/types/room-manager.types";

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
            state.status = "connected"; // Connected, but not in a room
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
            state.pendingJoinRoomId = null; // Clear it

            console.log(`[LobbySystem] Processing pending join for room ${roomIdToJoin}...`);
            networkResource.sendWaitingRoomMessage({
                type: "join_room",
                room_id: roomIdToJoin,
            });
            state.status = "joining";
            state.currentRoomId = roomIdToJoin;
        }

        const leaveEvents = world.readEvents(LeaveRoomEvent);
        for (const event of leaveEvents) {
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

        const [lobbyEntity, state] = stateRes.value;

        const messages = network.drainLobbyMessageQueue();
        for (const message of messages) {
            console.log(message);
            switch (message.type) {
                case 'success':
                    if (message.code === ServerSuccessCode.UserJoined) {
                        state.status = "joined";
                        console.log(`[LobbySystem] Successfully joined room.`);
                    } if (message.code === ServerSuccessCode.Authenticated) {
                        if (state.status === "connecting") {
                            state.status = "connected";
                            console.log(`[LobbySystem] Authenticated, status set to 'connected'.`);
                        }
                    }
                    break;
                case 'error':
                    console.error(`[LobbySystem] Error: ${message.message}`);
                    state.status = "error";
                    state.error = message.message;
                    state.pendingJoinRoomId = null;
                    break;
                case 'room_state':
                    console.log("[LobbySystem] Processing room_state...");

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