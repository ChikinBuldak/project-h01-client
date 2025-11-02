import Matter from "matter-js";
import { Entity, type System, World } from "../../types/ecs";
import { RigidBody } from "../components/RigidBody";
import { Transform } from "../components/Transform";
import { LocalPlayerTag } from "../components/LocalPlayerTag";
import { Mesh2D } from "../components/Mesh2D";
import { PlayerState } from '../components/PlayerState';
import { Collider } from "../components";
import { isNone, isSome } from "../../types/option";
import { GroundCheckRay } from "../components/GroundCheckRay";
import { Time } from "../resources/Time";
import { PhysicsResource } from "../resources/PhysicsResource";
import { Hitbox } from "../components/Hitbox";
import { Hurtbox } from "../components/Hurtbox";
import { CollisionEvent } from "../events/CollisionEvent";

export class PhysicsSystem implements System {
    /** A guard to ensure we only set up event listeners once. */
    private isInitialized = false;


    /**
     * This method is called once on the first update
     * to safely set up event listeners on the PhysicsResource's engine.
     */
    private setupEventListeners(world: World, resource: PhysicsResource) {
        Matter.Events.on(resource.engine, 'collisionStart', (event) => {
            // 'world' and 'resource' are safely captured in this closure
            for (const pair of event.pairs) {
                const idA = resource.bodyEntityMap.get(pair.bodyA.id);
                const idB = resource.bodyEntityMap.get(pair.bodyB.id);

                if (idA !== undefined && idB !== undefined) {
                    const entityA = world.getEntity(idA);
                    const entityB = world.getEntity(idB);

                    if (isSome(entityA) && isSome(entityB)) {
                        const isHit = entityA.value.hasComponent(Hitbox) && entityB.value.hasComponent(Hurtbox);
                        const isHurt = entityA.value.hasComponent(Hurtbox) && entityB.value.hasComponent(Hitbox);

                        if (isHit || isHurt) {
                            // Send the global CollisionEvent
                            world.sendEvent(new CollisionEvent(entityA.value, entityB.value));
                        }
                    }
                }
            }
        });
    }

    private checkGround(world: World, resource: PhysicsResource) {
        const groundCheckingQuery = world.query(RigidBody, PlayerState, GroundCheckRay);
        const allBodies = Matter.Composite.allBodies(resource.engine.world);
        for (const [rb, playerState, groundCheck] of groundCheckingQuery) {
            const startPoint = rb.body.position;
            const endPoint = {
                x: startPoint.x,
                y: startPoint.y + groundCheck.rayLength
            }

            // cast a ray downwards
            const hits = Matter.Query.ray(allBodies, startPoint, endPoint);
            let hitGround = false;
            for (const hit of hits) {
                if (hit.bodyA.id !== rb.body.id && hit.bodyB.id !== rb.body.id) {
                    hitGround = true;
                    break;
                }
            }
            playerState.isGrounded = hitGround;
            if (playerState.isGrounded) playerState.resetJumpCount();
            groundCheck.hit = hitGround;
        }
    }

    private addNewBodies(world: World, resource: PhysicsResource) {
        const query = world.queryWithEntity(RigidBody);
        for (const [entity, rb] of query) {
            if (rb.isAdded) continue;

            // Use the resource to add the body
            resource.addBody(entity, rb.body);
            rb.isAdded = true;
        }
    }

    update(world: World): void {
        const timeRes = world.getResource(Time);
        const physicsRes = world.getResource(PhysicsResource);
        if (isNone(timeRes) || isNone(physicsRes)) return;
        const time = timeRes.value;
        const resource = physicsRes.value;
        if (!this.isInitialized) {
            console.log("Initialize collision event listener");
            this.setupEventListeners(world, resource);
            this.isInitialized = true;
        }
        this.addNewBodies(world, resource);

        // Run the physics engine
        Matter.Engine.update(resource.engine, time.fixedDeltaTime);


        // Sync transforms back to ECS
        const syncQuery = world.query(RigidBody, Transform);
        for (const [rb, transform] of syncQuery) {
            const body = rb.body;
            if (!body) continue;
            transform.position.x = body.position.x;
            transform.position.y = body.position.y;
            transform.rotation = body.angle * (180 / Math.PI);
        }

        // Perform ground checking
        this.checkGround(world, resource);
    }
}