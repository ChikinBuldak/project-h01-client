import Matter from "matter-js";
import { type Resource, type Entity } from "../../types/ecs";
import { registerResource } from "@/utils/registry/resource.registry";

/**
 * A resource that holds the global Matter.js physics state.
 * This is created once and accessed by multiple systems.
 */
export class PhysicsResource implements Resource {
    public readonly engine: Matter.Engine;
    public readonly world: Matter.World;
    
    /** Maps a Matter.Body.id to its corresponding ECS Entity.id */
    public bodyEntityMap = new Map<number, number>();

    constructor() {
        console.log("[PhysicsResource] Initializing Matter.js Engine...");
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.engine.gravity.y = 1.0;
    }

    /**
     * Safely adds a body to the physics world and maps it.
     */
    public addBody(entity: Entity, body: Matter.Body) {
        Matter.World.add(this.world, body);
        this.bodyEntityMap.set(body.id, entity.id);
    }

    /**
     * Safely removes a body from the physics world and unmaps it.
     */
    public removeBody(body: Matter.Body) {
        Matter.World.remove(this.world, body);
        this.bodyEntityMap.delete(body.id);
    }
}

registerResource("physicsResource", PhysicsResource);

declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    physicsResource: PhysicsResource;
  }
}
