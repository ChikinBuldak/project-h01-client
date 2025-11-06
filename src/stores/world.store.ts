import { create } from "zustand";
import { type Entity, World, type System, type Resource } from "../types/ecs";
import { unwrapOpt } from '../types/option';

/**
 * The state slice of the Zustand store containing the world instance
 */
interface WorldState {
  /** The single instance of the ECS World */
  world: World;
}

/**
 * Actions for interacting with the World instance.
 */
export interface WorldActions {
  /** Initializes the world, typically only called once. */
  initializeWorld: () => void;
  /** Adds an entity to the world instance in the state. */
  addEntity: (entity: Entity) => void;
  /** Removes an entity from the world instance in the state. */
  removeEntity: (entityId: number) => void;
  /** Adds a system to the world instance in the state. */
  addSystem: (system: System) => void;
  /** Adds a resource to the world instance in the state. */
  addResource: (resource: Resource) => void;
  /** Executes the *fixed simulation* step for all systems in the world. */
  update: (deltaTime: number) => void;
  /** Executes the *render* step for all systems in the world. */
  render: (alpha: number) => void;
}

/**
 * Store type that contains both states and actions
 */
export type WorldStore = WorldState & WorldActions;

const initialWorld = new World();

/**
 * Use the {@link WorldStore} to manage state and update
 */
export const useWorldStore = create<WorldStore>()((set, get) => ({
  world: initialWorld,

  initializeWorld: () => {
    set({
      world: new World(),
    });
  },

  addEntity: (entity) => {
    const { world } = get();
    world.addEntity(entity);
    // No set state needed as world is a mutable instance
  },

  removeEntity: (entityId: number) => {
    const { world } = get();
    const entity = unwrapOpt(world.getEntity(entityId));
    if (entity) {
      world.removeEntity(entity.id);
    }
  },

  addSystem: (system) => {
    const { world } = get();
    world.addSystem(system);
  },

  addResource: (resource) => {
    const { world } = get();
    world.addResource(resource);
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
}));