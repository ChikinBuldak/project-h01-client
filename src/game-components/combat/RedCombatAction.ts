import { Hitbox, Mesh2D, PlayerState, RigidBody, Transform } from "@/ecs/components";
import { CombatState } from "@/ecs/components/character/combat/CombatState";
import LogEvent from "@/ecs/events/LogEvent";
import type { CombatActionMap, ICombatAction } from "@/interfaces/combat/ICombatAction";
import { Entity, isNone, type World } from "@/types";
import Matter from "matter-js";

interface RedCombatActionMap extends CombatActionMap {
    basicAttack: []
    hardAttack: [damage: number, force: number]
    ultimate: [damage: number, force: number, AOERadius: number]
}

/**
 * Action handler for character "Red"
 */
export class RedCombatAction implements ICombatAction<RedCombatActionMap> {
    private static HITBOX_SEQ_1 = { width: 30, height: 20, damage: 3, baseForce: 1, trajectory: { x: 1, y: -0.2 }, lifetime: 0.15, moveToFrontDistance: 10 };
    private static HITBOX_SEQ_2 = { width: 30, height: 20, damage: 3, baseForce: 1, trajectory: { x: 1, y: -0.2 }, lifetime: 0.15, moveToFrontDistance: 10};
    private static HITBOX_SEQ_3 = { width: 35, height: 25, damage: 6, baseForce: 5, trajectory: { x: 1, y: -0.75 }, lifetime: 0.2, moveToFrontDistance: 18 };

    hardAttack: (
        entity: Entity,
        world: World,
        damage: number,
        force: number
    ) => void = (entity, world, damage, force) => {

    }
    ultimate: (entity: Entity,
        world: World,
        damage: number,
        force: number,
        AOERadius: number
    ) => void = (entity, world, damage, force, aoe) => {

    }
    /**
     * This attack will have different form of attack 
     * depending on current attack sequence count
     * @param entity entity who called the action
     * @param world world where we can add the hit area entity
     */
    basicAttack: (entity: Entity, world: World) => void = (
        entity, world
    ) => {
        const stateOpt = entity.getComponent(CombatState);
        const rbOpt = entity.getComponent(RigidBody);
        const playerStateOpt = entity.getComponent(PlayerState);
        if (isNone(stateOpt) || isNone(rbOpt) || isNone(playerStateOpt)) return;

        const state = stateOpt.value;
        const rb = rbOpt.value;
        const playerState = playerStateOpt.value;

        if (state.timeSinceLastAttack < state.basicAttackDelay) {
            return;
        }
        state.timeSinceLastAttack = 0;

        let hitboxData;
        switch (state.sequenceCount) {
            case 0:
                hitboxData = RedCombatAction.HITBOX_SEQ_1;
                world.sendEvent(new LogEvent('info', "[Combat] Basic attack 1!"))
                break;
            case 1:
                hitboxData = RedCombatAction.HITBOX_SEQ_2;
                world.sendEvent(new LogEvent('info', "[Combat] Basic attack 2!"))
                break;
            case 2:
            default:
                hitboxData = RedCombatAction.HITBOX_SEQ_3;
                world.sendEvent(new LogEvent('info', "[Combat] Basic attack 3 (last attack)!"))
                break;
        }

        state.sequenceCount = (state.sequenceCount + 1) % state.maxSequence;

        const hitbox = new Hitbox({
            ownerId: entity.id,
            damage: hitboxData.damage,
            baseForce: hitboxData.baseForce,
            trajectory: {
                x: playerState.faceDirection * hitboxData.trajectory.x,
                y: hitboxData.trajectory.y
            },
            lifetime: hitboxData.lifetime,
            isPredicted: true
        });

        const hitboxPos = {
            x: rb.body.position.x + (playerState.faceDirection * 50),
            y: rb.body.position.y
        }

        const hitboxBody = Matter.Bodies.rectangle(
            hitboxPos.x, hitboxPos.y, 
            hitboxData.width, hitboxData.height, {
            isSensor: true,
            isStatic: true,
            collisionFilter: { group: 0 }
        });

        const hitboxEntity = new Entity()
        .addComponent(hitbox)
        .addComponent(RigidBody.createFromBody(hitboxBody))
        .addComponent(new Transform(hitboxPos.x, hitboxPos.y, 0))
        .addComponent(new Mesh2D(hitboxData.width, hitboxData.height));

        this.applyForwardMovement(rb, playerState, hitboxData.moveToFrontDistance);

        world.addEntity(hitboxEntity);
    }
    onAirAttack?: undefined;

        /**
     * Applies forward movement to the entity based on the moveToFrontDistance
     * @param entity The entity to move
     * @param rb The rigid body component
     * @param playerState The player state component
     * @param moveDistance The distance to move forward
     */
    private applyForwardMovement(
        rb: RigidBody, 
        playerState: PlayerState, 
        moveDistance: number
    ): void {
        if (moveDistance <= 0) return;

        // Calculate the movement vector based on face direction
        const moveVector = {
            x: playerState.faceDirection * moveDistance,
            y: 0
        };

        // Apply the movement to the rigid body
        Matter.Body.translate(rb.body, moveVector);

        const impulseStrength = 0.3;
        Matter.Body.applyForce(rb.body, rb.body.position, {
            x: playerState.faceDirection * impulseStrength,
            y: 0
        });

        // Log the movement for debugging
        console.log(`[Combat] Applied forward movement: ${moveDistance} units in direction ${playerState.faceDirection}`);
    }

}