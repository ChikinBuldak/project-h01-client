import { create } from "zustand";
import { Entity, World, type System } from "../types/ecs";
import type { ServerMessage } from "../types/network";
import { wsMiddleware, type WithWebSocket } from "./websocket.middleware";
import { Transform } from "../ecs/components/Transform";
import { NetworkStateBuffer } from "../ecs/components/NetworkStateBuffer";
import { FIXED_TIMESTEP } from "../hooks/world.hooks";
import { MovementSystem, ReconciliationSystem } from "../ecs/systems";
import { isSome } from "../types/option";
/**
 * The state slice of the Zustand store containing the world instance
 */
interface WorldState {
    /** The single instance of the ECS World */
    world: World;
    /** The last time the world was updated, for delta time calculation */
    serverEntityMap: Map<string, Entity>;
}

/**
 * Actions for interacting with the World instance.
 */
export interface WorldActions {
    /** Initializes the world, typically only called once. */
    initializeWorld: () => void;
    /** Adds an entity to the world instance in the state. */
    addEntity: (entity: Entity, serverId?: string) => void;
    removeEntity: (entityId: number) => void;
    /** Adds a system to the world instance in the state. */
    addSystem: (system: System) => void;

    /** * Executes the *fixed simulation* step for all systems in the world.
     * @param deltaTime The fixed delta time (e.g., 16.67ms)
     */
    update: (deltaTime: number) => void;
    /** * Executes the *render* step for all systems in the world.
     * @param alpha The interpolation factor (between 0 and 1)
     */
    render: (alpha: number) => void;
    handleWSMessage: (message: ServerMessage) => void;
}
/**
 * Store type that contains both states and actions
 */
export type WorldStore = WithWebSocket<WorldState & WorldActions>;
const initialWorld = new World();

/**
 * Use the {@link WorldStore} to manage state and update
 */
export const useWorldStore = create<WorldStore>()(
  // Apply the websocket middleware
  wsMiddleware((set, get) => ({
    // --- Initial State ---
    world: initialWorld,
    serverEntityMap: new Map(),
    socket: null,
    isConnected: false,

    // --- World Actions ---
    initializeWorld: () => {
      set({
        world: new World(),
        serverEntityMap: new Map(),
      });
    },

    addEntity: (entity, serverId) => {
      const { world, serverEntityMap } = get();
      world.addEntity(entity);
      if (serverId) {
        serverEntityMap.set(serverId, entity);
      }
      set({ world, serverEntityMap }); // Update state
    },
    
    removeEntity: (entityId: number) => {
      const { world, serverEntityMap } = get();
      const entity = world.getEntities().find(e => e.id === entityId);
      if (entity) {
        world.removeEntity(entity.id);
        
        // Remove from server map
        for (const [key, val] of serverEntityMap.entries()) {
          if (val.id === entityId) {
            serverEntityMap.delete(key);
            break;
          }
        }
        set({ world, serverEntityMap });
      }
    },

    addSystem: (system) => {
      const { world } = get();
      world.addSystem(system);
      set({ world }); // Update state
    },

    update: (deltaTime) => {
      const { world } = get();
      world.update(deltaTime);
    },

    render: (alpha) => {
      const { world } = get();
      if (world.render) {
        world.render(alpha);
      }
    },

    // WebSocket Actions (defined in middleware)
    // These are stubbed here to satisfy the type,
    // the middleware provides the actual implementation.
    connect: (_url) => console.warn('connect() called before middleware init'),
    disconnect: () => console.warn('disconnect() called before middleware init'),
    sendMessage: (_message) => console.warn('sendMessage() called before middleware init'),

    // --- Message Handling Logic ---
    handleWSMessage: (message: ServerMessage) => {
      const { world, serverEntityMap } = get();
      const entities = world.getEntities();

      switch (message.type) {
        case 'reconciliation': {
          // Message for our local player
          const data = message.payload;
          const reconSystem = world.getSystem(ReconciliationSystem);
          const moveSystem = world.getSystem(MovementSystem);

          if (isSome(reconSystem) && isSome(moveSystem)) {
            reconSystem.value.onServerStateReceived(
              entities,
              data,
              moveSystem.value,
              FIXED_TIMESTEP,
            );
          }
          break;
        }

        case 'worldState': {
          // Message for all other entities
          const stateBatch = message.payload.entities;
          
          for (const entityState of stateBatch) {
            const entity = serverEntityMap.get(entityState.id);
            if (!entity) continue;

            const netBufferOpt = entity.getComponent(NetworkStateBuffer);
            if (isSome(netBufferOpt)) {
              netBufferOpt.value.addState(message.payload.tick, entityState.state);
            }
          }
  
          break;
        }
        
        case 'playerJoined': {
          console.log('Player joined:', message.payload);
          const { id, state } = message.payload;
          
          // Don't add if we already know about this player
          if (serverEntityMap.has(id)) break;

          const newPlayer = new Entity();
          newPlayer.addComponent(new Transform(state.position.x, state.position.y));
          newPlayer.addComponent(new NetworkStateBuffer());
          
          // Use the addEntity action to add it to the world AND the map
          get().addEntity(newPlayer, id);
          break;
        }
        
        case 'playerLeft': {
          console.log('Player left:', message.payload.id);
          const entity = serverEntityMap.get(message.payload.id);
          if (entity) {
            // Use the removeEntity action
            get().removeEntity(entity.id);
          }
          break;
        }
      }
    },
  })),
);