import { Entity, isNone, isSome, unwrapOpt, type System, type World } from "@/types";
import { Time } from "../../resources";
import { AttackRequest } from "../../components/character/AttackRequest";
import { Mesh2D, PlayerState, RigidBody, Transform } from "../../components";
import { Hitbox } from "../../components/character/Hitbox";
import Matter from "matter-js";
import { PhysicsResource } from "../../resources/PhysicsResource";
import { CollisionEvent } from "../../events/CollisionEvent";
import { Hurtbox } from "../../components/character/Hurtbox";
import { Knockbacker } from "../../components/character/Knockbacker";
import { Despawn } from "../../components/tag/Despawn";

export class CombatSystem implements System {
    update(world: World): void {
        const timeRes = world.getResource(Time);
        const physicsRes = world.getResource(PhysicsResource);
        if (isNone(timeRes) || isNone(physicsRes)) return;
        const dt = unwrapOpt(timeRes).fixedDeltaTime / 1000;

        const attackRequests = world.queryWithEntityAndFilter([PlayerState, RigidBody], [AttackRequest]);
        for (const [entity, state, rb] of attackRequests) {
            // Spawn a predicted hitbox
            const hitbox = new Hitbox({
                ownerId: entity.id,
                damage: 5,
                baseForce: 2,
                trajectory: { x: state.faceDirection, y: -0.5 },
                lifetime: 0.2,
                isPredicted: true
            });

            const hitboxSize = { width: 25, height: 25 };

            // position the hitbox in front of the player
            const hitboxPos = {
                x: rb.body.position.x + (state.faceDirection * 50),
                y: rb.body.position.y
            }

            const hitboxBody = Matter.Bodies.rectangle(
                hitboxPos.x, hitboxPos.y,
                hitboxSize.width, hitboxSize.height,
                {
                    isSensor: true,
                    isStatic: true,
                    collisionFilter: { group: 0 }
                });

            const hitboxEntity = new Entity()
                .addComponent(hitbox)
                .addComponent(RigidBody.createFromBody(hitboxBody))
                .addComponent(new Transform(hitboxPos.x, hitboxPos.y, 0))
                .addComponent(new Mesh2D(hitboxSize.width, hitboxSize.height));

            world.addEntity(hitboxEntity);
            entity.removeComponent(AttackRequest);
        }

        const activeHitboxes = world.queryWithEntity(Hitbox, RigidBody);
        for (const [entity, hitbox, _rb] of activeHitboxes) {
            hitbox.lifetime -= dt;
            if (hitbox.lifetime <= 0) {
                entity.addComponent(new Despawn());
            }
        }

        // Read the global event queue from the world
        const collisions = world.readEvents(CollisionEvent);
        for (const event of collisions) {
            const { entityA, entityB } = event;

            const hitboxOpt = isSome(entityA.getComponent(Hitbox)) ? entityA.getComponent(Hitbox) : entityB.getComponent(Hitbox);
            const hurtboxEntity = isSome(entityA.getComponent(Hurtbox)) ? entityA : entityB;

            if (isNone(hitboxOpt) || isNone(hurtboxEntity.getComponent(Hurtbox))) {
                continue;
            }

            const hitbox = unwrapOpt(hitboxOpt);
            const victim = hurtboxEntity;
            if (victim.id === hitbox.ownerId) continue;
            if (!hitbox.isPredicted) continue;

            const victimRb = victim.getComponent(RigidBody);
            const victimKnockbacker = victim.getComponent(Knockbacker);

            if (isSome(victimRb) && isSome(victimKnockbacker)) {
                console.log(`[CombatSystem] Local Hit! Applying knockback.`);
                const force = victimKnockbacker.value.applyHit(hitbox.damage, hitbox.baseForce);
                const trajectory = Matter.Vector.normalise(hitbox.trajectory);
                Matter.Body.applyForce(
                    victimRb.value.body,
                    victimRb.value.body.position,
                    Matter.Vector.mult(trajectory, force * 0.1)
                );
            }
        }
    }
    render?(_world: World): void { }

}