import { isSome, none, some, type Option } from "./utils/option";

/**
 * Component, If you want to define a component, you are required to implement this interface
 */
export interface Component { }

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

type ComponentInstance<T> = T extends new (...args: any[]) => infer R ? R : never;

// Helper type for extracting constructor parameter types
type ComponentCtor<T extends Component> = new (...args: any[]) => T;

export abstract class System {
    abstract update(entities: Entity[], deltaTime: number): void;

    /**
     * Queries all entities that have *all* required components.
     * Returns a list of tuples containing component instances
     * in the same order as the constructors provided.
     */
    protected query<C extends ReadonlyArray<ComponentCtor<Component>>>(
        entities: Entity[],
        ...componentTypes: C
    ): Array<{ [K in keyof C]: ComponentInstance<C[K]> }> {
        // console.log("call query!");
        const matches: Array<{ [K in keyof C]: ComponentInstance<C[K]> }> = [];

        for (const entity of entities) {
            // Skip if entity doesn't have all required components
            if (!componentTypes.every((ctor) => entity.hasComponent(ctor))) continue;

            // Collect components
            const components = componentTypes.map(
                (ctor) => {
                    const compOpt = entity.getComponent(ctor);
                    return isSome(compOpt)
                        ? compOpt.value
                        : (() => { throw new Error(`Missing component ${ctor.name} after check`); })();
                }
            );

            matches.push(components as { [K in keyof C]: ComponentInstance<C[K]> });
        }

        return matches;
    }

    render?(entities: Entity[], alpha: number): void;
}
type SystemCtor<T extends System> = new (...args: any[]) => T;

export class World {
    private entities: Entity[] = [];
    private systems: System[] = [];

    addEntity(entity: Entity): this {
        this.entities.push(entity);
        return this;
    }

    removeEntity(entityId: number ): this {
        this.entities = this.entities.filter((e) => e.id !== entityId);
        return this;
    }

    addSystem(system: System): this {
        this.systems.push(system);
        return this;
    }

    update(deltaTime: number): void {
        for (const system of this.systems) {
            system.update(this.entities, deltaTime);
        }
    }

    render(alpha: number): void {
        for (const system of this.systems) {
            if (system.render) {
                system.render(this.entities, alpha);
            }
        }
    }

    getEntity(id: number): Option<Entity> {
        const entity = this.entities.find((e) => e.id === id);

        if (entity) {
            return some(entity);
        } else {
            return none as Option<Entity>;
        }
    }

    getEntities(): Entity[] {
        return this.entities;
    }

    getSystem<T extends System>(ctor: SystemCtor<T>): Option<T> {
        const system = this.systems.find((s) => s instanceof ctor);
        return system ? some(system as T) : none;
    }
}