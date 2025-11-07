import { buildCamelCasedResources } from '@/utils';
import { Time } from '../ecs/resources/Time';
import { isSome, none, some, type Option } from "./option";
import { buildResourceMap, type ResourceRegistry } from '@/utils/registry/resource.registry';

/**
 * Component, If you want to define a component, you are required to implement this interface
 */
export interface Component { }

/**
 * A "Resource".
 * A resource is a global, singleton piece of data that can be accessed by systems.
 * e.g., NetworkConnection, AssetLoader, etc.
 */
export interface Resource { }

/**
 * An "Event"
 * Every event that happens will be handled here
 */
export interface EventECS { }

/**
 * Every application state (like MainMenu, InGame) will implement this.
 */
export interface AppState {
    /**
     * Logic that will be run once after entering this state. use this
     * to initiate all systems and entities required
     */
    onEnter(world: World, args?: SystemResourcePartial): void;

    /**
     * Logic that will be run once after entering this state. use this
     * to remove unusud systems and entities
     */
    onExit(world: World,args?: SystemResourcePartial): void;
}

/**
 * A collection of all registered resources, keyed by their constructor name.
 * Systems will receive this object in their update/render methods.
 */
export type SystemResources = ResourceRegistry

export type SystemResourcePartial = Partial<SystemResources>;

/**
 * A single instance of "Entity". Can have 0 to many components
 */
export class Entity {
    readonly id: number;
    private components = new Map<Function, Component>();
    private static idCounter = 0;

    constructor() {
        this.id = Entity.idCounter++;
    }

    /**
     * Add component to the entity
     * @param component 
     * @returns 
     */
    addComponent(component: Component): this {
        this.components.set(component.constructor, component);
        return this;
    }

    removeComponent<T extends Component>(ctor: new (...args: any[]) => T): this {
        this.components.delete(ctor);
        return this;
    }

    getComponent<T extends Component>(ctor: new (...args: any[]) => T): Option<T> {
        const comp = this.components.get(ctor);
        return comp ? some(comp as T) : none;
    }

    hasComponent<T extends Component>(ctor: new (...args: any[]) => T): boolean {
        return this.components.has(ctor);
    }

    getAllComponents(): Component[] {
        return [...this.components.values()];
    }
}

export type ComponentInstance<T> = T extends new (...args: any[]) => infer R ? R : never;

// Helper type for extracting constructor parameter types
export type ComponentCtor<T extends Component> = new (...args: any[]) => T;

export interface System {
    update(world: World, resources: SystemResourcePartial): void;
    render?(world: World, resources: SystemResourcePartial): void;
}

type SystemCtor<T extends System> = new (...args: any[]) => T;

export class World {
    private entities = new Map<number, Entity>();
    private systems = new Map<Function, System>();
    private resources = new Map<Function, Resource>();
    /** A map holding queues for all events sent this frame. */
    private events: Map<Function, EventECS[]> = new Map();

    addEntity(entity: Entity): this {
        this.entities.set(entity.id, entity);
        return this;
    }
    removeEntity(entityId: number): this {
        this.entities.delete(entityId);
        return this;
    }
    clearEntities(): this {
        this.entities.clear();
        return this;
    }
    addSystem(system: System): this {
        this.systems.set(system.constructor, system);
        return this;
    }
    removeSystem<T extends System>(ctor: SystemCtor<T>): boolean {
        return this.systems.delete(ctor);
    }

    /**
     * Removes a resource from the world.
     */
    removeResource<T extends Resource>(ctor: new (...args: any[]) => T): this {
        this.resources.delete(ctor);
        return this;
    }
    update(deltaTime: number): void {
        this.clearEvents();
        const resources = buildResourceMap(this.resources);
        const time = resources.time as Time | undefined;
        if (time) {
            time.fixedDeltaTime = deltaTime;
            time.elapsedTime += deltaTime;
            time.currentTick = time.currentTick + 1;
        }

        // Run all systems
        for (const system of this.systems.values()) {
            system.update(this, resources);
        }
    }
    render(alpha: number): void {
        const resources = buildResourceMap(this.resources);

        const time = resources.time;
        if (time) time.alpha = alpha;

        for (const system of this.systems.values()) {
            if (system.render) {
                system.render(this, resources);
            }
        }
    }
    getEntity(id: number): Option<Entity> {
        const entity = this.entities.get(id);
        if (!entity) return none;
        return some(entity);
    }
    getEntities(): Entity[] {
        return Array.from(this.entities.values());
    }
    getEntitiesByComponent<T extends Component>(ctor: new (...args: any[]) => T): Entity[] {
        const matches: Entity[] = [];
        for (const entity of this.entities.values()) {
            if (entity.hasComponent(ctor)) {
                matches.push(entity);
            }
        }
        return matches;
    }
    getSystem<T extends System>(ctor: SystemCtor<T>): Option<T> {
        const system = this.systems.get(ctor);
        return system ? some(system as T) : none;
    }
    addResource(resource: Resource): this {
        this.resources.set(resource.constructor, resource);
        return this;
    }
    getResource<T extends Resource>(ctor: new (...args: any[]) => T): Option<T> {
        const res = this.resources.get(ctor);
        return res ? some(res as T) : none;
    }
    /**
     * Sends an event to the world's event queue.
     * Systems can read these events in the same frame.
     * @param event The event instance to send.
     */
    public sendEvent(event: EventECS) {
        const eventType = event.constructor;
        if (!this.events.has(eventType)) {
            this.events.set(eventType, []);
        }
        this.events.get(eventType)!.push(event);
    }

    /**
     * Reads all events of a specific type that have been
     * sent in the current frame.
     * @param eventType The class of the event to read (e.g., CollisionEvent).
     * @returns An array of event instances.
     */
    public readEvents<T extends EventECS>(eventType: new (...args: any[]) => T): T[] {
        const queue = this.events.get(eventType) as T[];
        return queue || [];
    }

    /**
     * Clears all event queues.
     * This is called by the World's update loop.
     */
    private clearEvents() {
        this.events.clear();
    }


    /**
     * Queries all entities that have *all* required components.
     * Returns a list of tuples containing component instances.
     */
    query<C extends ReadonlyArray<ComponentCtor<Component>>>(
        ...componentTypes: C
    ): Array<{ [K in keyof C]: ComponentInstance<C[K]> }> {
        const matches: Array<{ [K in keyof C]: ComponentInstance<C[K]> }> = [];

        for (const entity of this.entities.values()) {
            if (!componentTypes.every((ctor) => entity.hasComponent(ctor))) continue;

            const components = componentTypes.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            matches.push(components as { [K in keyof C]: ComponentInstance<C[K]> });
        }
        return matches;
    }

    /**
     * Same as query, but also includes the Entity object.
     */
    queryWithEntity<C extends ReadonlyArray<ComponentCtor<Component>>>(
        ...componentTypes: C
    ): Array<[Entity, ...{ [K in keyof C]: ComponentInstance<C[K]> }]> {
        const matches: Array<[Entity, ...{ [K in keyof C]: ComponentInstance<C[K]> }]> = [];

        for (const entity of this.entities.values()) {
            if (!componentTypes.every((ctor) => entity.hasComponent(ctor))) continue;

            const components = componentTypes.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            matches.push([entity, ...components] as unknown as [Entity, ...{ [K in keyof C]: ComponentInstance<C[K]> }]);
        }
        return matches;
    }

    /**
 * Queries all entities that have *all* required components,
 * but only returns instances of the `componentsToReturn`.
 *
 * @example
 * // Finds entities with Transform AND LocalPlayerTag,
 * // but only returns [transform]
 * world.queryWithFilter(
 * [Transform], // Components to RETURN
 * [LocalPlayerTag] // Components to FILTER BY
 * );
 */
    queryWithFilter<
        R extends ReadonlyArray<ComponentCtor<Component>>,
        F extends ReadonlyArray<ComponentCtor<Component>>
    >(
        props: {
            returnComponents: [...R],
            filterComponents: [...F]
        }
    ): Array<{ [K in keyof R]: ComponentInstance<R[K]> }> {
        const { returnComponents: componentsToReturn, filterComponents: componentsToFilter } = props;
        const matches: Array<{ [K in keyof R]: ComponentInstance<R[K]> }> = [];

        // Combine all types to check for existence
        const allTypes = [...componentsToReturn, ...componentsToFilter];

        for (const entity of this.entities.values()) {
            // Check if entity has ALL components (both return and filter)
            if (!allTypes.every((ctor) => entity.hasComponent(ctor))) continue;
            const components = componentsToReturn.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            matches.push(components as { [K in keyof R]: ComponentInstance<R[K]> });
        }
        return matches;
    }

    /**
 * Same as queryWithFilter, but also includes the Entity object.
 *
 * @example
 * // Finds entities with Transform AND LocalPlayerTag,
 * // but only returns [entity, transform]
 * world.queryWithEntityAndFilter(
 * [Transform], // Components to RETURN
 * [LocalPlayerTag] // Components to FILTER BY
 * );
 */
    queryWithEntityAndFilter<
        R extends ReadonlyArray<ComponentCtor<Component>>,
        F extends ReadonlyArray<ComponentCtor<Component>>
    >(props: {
        returnComponents: [...R],
        filterComponents: [...F]
    }): Array<[Entity, ...{ [K in keyof R]: ComponentInstance<R[K]> }]> {
        const matches: Array<[Entity, ...{ [K in keyof R]: ComponentInstance<R[K]> }]> = [];
        const { returnComponents: componentsToReturn, filterComponents: componentsToFilter } = props;
        const allTypes = [...componentsToReturn, ...componentsToFilter];

        for (const entity of this.entities.values()) {
            if (!allTypes.every((ctor) => entity.hasComponent(ctor))) continue;
            const components = componentsToReturn.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            matches.push([entity, ...components] as unknown as [Entity, ...{ [K in keyof R]: ComponentInstance<R[K]> }]);
        }
        return matches;
    }

    /** Find the first element from the query. returns Option of components */
    querySingle<C extends ReadonlyArray<ComponentCtor<Component>>>(
        ...componentTypes: C
    ): Option<{ [K in keyof C]: ComponentInstance<C[K]> }> {
        for (const entity of this.entities.values()) {
            if (!componentTypes.every((ctor) => entity.hasComponent(ctor))) continue;

            const components = componentTypes.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            return some(components as { [K in keyof C]: ComponentInstance<C[K]> })
        }
        return none;
    }

    queryWithEntitySingle<C extends ReadonlyArray<ComponentCtor<Component>>>(
        ...componentTypes: C
    ): Option<[Entity, ...{ [K in keyof C]: ComponentInstance<C[K]> }]> {
        for (const entity of this.entities.values()) {
            if (!componentTypes.every((ctor) => entity.hasComponent(ctor))) continue;

            const components = componentTypes.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            return some([entity, ...components] as unknown as [Entity, ...{ [K in keyof C]: ComponentInstance<C[K]> }]);
        };

        return none;
    }

    queryWithFilterSingle<
        R extends ReadonlyArray<ComponentCtor<Component>>,
        F extends ReadonlyArray<ComponentCtor<Component>>
    >(
        props: {
            returnComponents: [...R],
            filterComponents: [...F]
        }
    ): Option<{ [K in keyof R]: ComponentInstance<R[K]> }> {
        const { returnComponents, filterComponents } = props;

        const allTypes = [...returnComponents, ...filterComponents];

        for (const entity of this.entities.values()) {
            if (!allTypes.every((ctor) => entity.hasComponent(ctor))) continue;
            const components = returnComponents.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            return some(components as { [K in keyof R]: ComponentInstance<R[K]> });
        }

        return none;
    }

    queryWithEntityAndFilterSingle<
        R extends ReadonlyArray<ComponentCtor<Component>>,
        F extends ReadonlyArray<ComponentCtor<Component>>
    >(
        props: {
            returnComponents: [...R],
            filterComponents: [...F]
        }
    ): Option<[Entity, ...{ [K in keyof R]: ComponentInstance<R[K]> }]> {
        const { returnComponents, filterComponents } = props;

        const allTypes = [...returnComponents, ...filterComponents];

        for (const entity of this.entities.values()) {
            if (!allTypes.every((ctor) => entity.hasComponent(ctor))) continue;
            const components = returnComponents.map((ctor) => {
                const compOpt = entity.getComponent(ctor);
                return isSome(compOpt)
                    ? compOpt.value
                    : (() => {
                        throw new Error(`Missing component ${ctor.name} after check`);
                    })();
            });
            return some([entity, ...components] as unknown as [Entity, ...{ [K in keyof R]: ComponentInstance<R[K]> }]);
        }

        return none;
    }
}