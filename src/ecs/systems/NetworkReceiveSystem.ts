import { Entity, System, World } from "../../types/ecs";
import { isNone, isSome, unwrapOpt } from "../../types/option";
import { NetworkStateBuffer } from "../components";
import { DebugCollider, DebugPhysicsState } from "../components/DebugCollider";
import { StaticMapObjectTag } from "../components/StaticMapObjectTag";
import { WorldFactory } from "../entities/WorldFactory";
import { NetworkResource } from "../resources/NetworkResource";
import { ReconciliationSystem } from "./ReconciliationSystem";

/**
 * A Bevy-style "system" that runs on every update tick
 * to process incoming messages from the NetworkResource.
 */
export class NetworkReceiveSystem extends System {
    /**
     * Maps server string IDs to client numeric entity IDs.
     * This is an O(1) lookup map for performance.
     */
    private serverIdToEntityId = new Map<string, number>();

    /**
     * Adds an entity to the world and registers its server ID.
     */
    private addEntityWithServerId(world: World, entity: Entity, serverId: string) {
        world.addEntity(entity);
        this.serverIdToEntityId.set(serverId, entity.id);
    }

    /**
     * Removes an entity from the world and cleans up its ID mapping.
     */
    private removeEntityWithServerId(world: World, serverId: string) {
        const entityId = this.serverIdToEntityId.get(serverId);
        if (entityId !== undefined) {
            const entity = world.getEntity(entityId);
            if (isSome(entity)) {
                world.removeEntity(entity.value.id);
            }
            this.serverIdToEntityId.delete(serverId);
        }
    }

    update(world: World): void {
        const net = world.getResource(NetworkResource);

        // If there's no network resource, we're offline. Do nothing.
        if (isNone(net)) return;

        const network = net.value;
        const messages = network.drainMessageQueue();

        // Process all messages in the queue
        while (messages.length > 0) {
            const message = messages.shift()!;

            switch (message.type) {
                case "player_state": {
                    // Route to the ReconciliationSystem
                    const reconSystem = unwrapOpt(world.getSystem(ReconciliationSystem));
                    reconSystem?.onServerStateReceived(world, message);
                    break;
                }

                case "entity_state": {
                    // Get the numeric ID from the server's string ID
                    const numericId = this.serverIdToEntityId.get(message.id);
                    if (numericId === undefined) {
                        // We received state for an entity we don't know about yet.
                        // This can happen with packet loss.
                        // We could either ignore it or spawn a "ghost".
                        // console.warn(`[WS] Received state for unknown entity ID: ${message.id}`);
                        break;
                    }

                    const entity = unwrapOpt(world.getEntity(numericId));
                    if (!entity) break;

                    // 1. Handle Transform (for interpolation)
                    const netBuffer = entity.getComponent(NetworkStateBuffer);
                    if (isSome(netBuffer)) {
                        netBuffer.value.addState(message.tick, message.state.transform);
                    }
                    break;
                }

                case "map_load": {
                    // Clear existing map
                    world.getEntitiesByComponent(StaticMapObjectTag).forEach(e => {
                        // Find the server ID associated with this entity's numeric ID
                        for (const [serverId, entityId] of this.serverIdToEntityId.entries()) {
                            if (entityId === e.id) {
                                this.serverIdToEntityId.delete(serverId);
                                break;
                            }
                        }
                        world.removeEntity(e.id);
                    });

                    // Create new map entities
                    for (const obj of message.objects) {
                        const ground = WorldFactory.createGround({
                            x: obj.position.x,
                            y: obj.position.y,
                            width: obj.width,
                            height: obj.height
                        });
                        this.addEntityWithServerId(world, ground, obj.id);
                    }
                    break;
                }

                // You would add cases here for "entity_spawn" and "entity_despawn"
                // to handle players joining and leaving
            }
        }
    }
}

