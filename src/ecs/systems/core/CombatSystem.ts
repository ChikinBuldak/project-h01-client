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
import CharacterTag from "@/ecs/components/tag/CharacterTag";
import { CombatState } from "@/ecs/components/character/combat/CombatState";
import LogEvent from "@/ecs/events/LogEvent";

export class CombatSystem implements System {
    update(world: World): void {
        const timeRes = world.getResource(Time);
        const physicsRes = world.getResource(PhysicsResource);
        if (isNone(timeRes) || isNone(physicsRes)) return;
        const dt = unwrapOpt(timeRes).fixedDeltaTime / 1000;

        this.tickComboTimers(world, dt);

        const attackRequests = world.queryWithEntityAndFilter([CharacterTag, PlayerState], [AttackRequest, RigidBody]);
        for (const [entity, tag, state] of attackRequests) {
            if (state.isBusy) {
                entity.removeComponent(AttackRequest);
                continue;
            }

            state.isBusy = true;
            const actionHandler = CharacterTag.mapToAction(tag, world)
            if (actionHandler.isSome()) {
                // only applies basic attack if it is not in the air
                if (state.isGrounded) {
                    actionHandler.value.basicAttack(entity, world);
                }
            }
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
            const victimState = victim.getComponent(PlayerState);

            if (isSome(victimRb) && isSome(victimKnockbacker) && isSome(victimState)) {
                // check whether the current enemy is invisible
                if (victimState.value.isInvisible) {
                    return;
                }
                world.sendEvent(new LogEvent('info', `[CombatSystem] Local Hit! Applying knockback`));
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

    private tickComboTimers(world: World, dt: number) {
        const query = world.query(CombatState, PlayerState);
        for (const [state, playerState] of query) {
            const isAttacking = playerState.isBusy && playerState.getDodgeTimer <= 0;
            state.timeSinceLastAttack += dt;

            if (state.timeSinceLastAttack > state.resetThreshold) {
                if (state.sequenceCount !== 0) {
                    state.sequenceCount = 0;
                }
            }

            if (isAttacking && state.timeSinceLastAttack >= state.basicAttackDelay) {
                playerState.isBusy = false;
            }
        }
    }

}