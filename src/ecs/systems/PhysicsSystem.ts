import Matter from "matter-js";
import { Entity, System } from "../../types/ecs";
import { RigidBody } from "../components/RigidBody";
import { Transform } from "../components/Transform";
import { LocalPlayerTag } from "../components/LocalPlayerTag";

export class PhysicsSystem extends System {
    private engine: Matter.Engine;

    constructor() {
        super();
        this.engine = Matter.Engine.create();
    }
    update(entities: Entity[], deltaTime: number): void {
        const query = this.query(entities, RigidBody, Transform, LocalPlayerTag);
        if (query.isEmpty()) return;

        for (const [rb, transform, _tag] of query) {
            if (!rb.body) {
                rb.body = this.createMatterBody(rb, transform);
            }
        }

        // Step the physics engine
        Matter.Engine.update(this.engine, deltaTime * 1000);

        for (const [rb, transform] of query) {
            if (!rb.body) continue;
            transform.position.x = rb.body.position.x;
            transform.position.y = rb.body.position.y;
            transform.rotation = rb.body.angle;
        }
    }

    private createMatterBody(rb: RigidBody, tf: Transform): Matter.Body {
        const options: Matter.IChamferableBodyDefinition = {
            friction: rb.friction,
            restitution: rb.restitution,
            isStatic: rb.type === "static",
            isSensor: rb.isSensor,
        };

        // Temporary: use 1x1 box as rigid body
        return Matter.Bodies.rectangle(tf.position.x, tf.position.y, 1, 1, options);
    }

}