import Matter from "matter-js";
import { Entity, System, World } from "../../types/ecs";
import { RigidBody } from "../components/RigidBody";
import { Transform } from "../components/Transform";
import { LocalPlayerTag } from "../components/LocalPlayerTag";
import { Mesh2D } from "../components/Mesh2D";
import { PlayerState } from '../components/PlayerState';
import { Collider } from "../components";
import { isNone, isSome } from "../../types/option";
import { GroundCheckRay } from "../components/GroundCheckRay";
import { Time } from "../resources/Time";

export class PhysicsSystem extends System {
    private engine: Matter.Engine;
    private world: Matter.World;

    // Maps to keep track of bodies and their corresponding entities
    private bodyToEntity = new Map<number, Entity>();
    private entityToBody = new Map<number, Matter.Body>();

    constructor() {
        super();
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;
        this.engine.gravity.y = 1;
        this.engine.gravity.x = 0;

        // this.setupCollisionEvents();
    }

    private setupCollisionEvents() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                const { bodyA, bodyB } = pair;

                // Find which entity is the player and which is the ground
                const playerEntity = this.bodyToEntity.get(bodyA.id) ?? this.bodyToEntity.get(bodyB.id);
                const otherEntity = playerEntity?.id === this.bodyToEntity.get(bodyA.id)?.id
                    ? this.bodyToEntity.get(bodyB.id) : this.bodyToEntity.get(bodyA.id);
                
                if (!playerEntity || !otherEntity) continue;

                const playerStateOpt = playerEntity.getComponent(PlayerState);
                const colliderOpt = otherEntity.getComponent(Collider);

                if (isSome(playerStateOpt) && isSome(colliderOpt)) {
                    // check collision normal 
                    if (pair.collision.normal.y === 1 || pair.collision.normal.y === -1) {
                        const playerState = playerStateOpt.value;
                        playerState.isGrounded = true;
                    }
                }
            }
        })

        Matter.Events.on(this.engine, 'collisionEnd', (event) => {
            for (const pair of event.pairs) {
                const {bodyA, bodyB} = pair;
                const playerEntity = this.bodyToEntity.get(bodyA.id) ?? this.bodyToEntity.get(bodyB.id);
                if (!playerEntity) continue;

                const playerStateOpt = playerEntity?.getComponent(PlayerState);
                if (isSome(playerStateOpt)) {
                    const PlayerState = playerStateOpt.value;
                    PlayerState.isGrounded = false;
                }
            }
        })
    }

    update(world: World): void {
        const time = world.getResource(Time);
        if(isNone(time)) return;
        const deltaTime = time.value.fixedDeltaTime
        const newBodiesQuery = world.queryWithEntity(RigidBody);
        const allBodies: Matter.Body[] = [];
        for (const [entity, rb] of newBodiesQuery) {
            allBodies.push(rb.body);
            if (!this.entityToBody.has(entity.id)) {
                Matter.World.add(this.world, rb.body);
                this.entityToBody.set(entity.id, rb.body);
                this.bodyToEntity.set(rb.body.id, entity);
            }
        }

        // Run the physics engine
        Matter.Engine.update(this.engine, deltaTime);

        // Perform ground checking
        const groundCheckingQuery = world.query(RigidBody, PlayerState, GroundCheckRay);
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
            groundCheck.hit = hitGround;
        }

        // Sync transforms back to ECS
        const syncQuery = world.query(RigidBody, Transform);
        for (const [rb, transform] of syncQuery) {
            const body = rb.body;
            if (!body) continue;
            transform.position.x = body.position.x;
            transform.position.y = body.position.y;
            transform.rotation = body.angle;
        }
    }
}