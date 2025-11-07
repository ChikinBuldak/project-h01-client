import Matter from "matter-js";
import { type System, type SystemResourcePartial, World } from "@/types/ecs";
import { LocalPlayerTag, PlayerState, PredictionHistory, RigidBody } from "@/ecs/components";

import { NetworkResource, Time } from "@/ecs/resources";
import { isNone, isSome, unwrapOpt, type Input, type PlayerInput, type PlayerPhysicsState } from "@/types";
import { InputEvent } from "@/ecs/events/InputEvent";
import { AttackRequest } from "@/ecs/components/character/AttackRequest";

const PLAYER_SPEED = 5;
const JUMP_FORCE = 12;
const DODGE_FORCE = 15;
const DODGE_DURATION = 0.2;
const DODGE_COOLDOWN = 1.0;

export class PlayerMovementSystem implements System {
    public cloneState(rb: RigidBody, state: PlayerState): PlayerPhysicsState {
        return {
            transform: { position: { ...rb.body.position }, rotation: rb.body.angle * (180 / Math.PI) },
            velocity: { ...rb.body.velocity },
            isGrounded: state.isGrounded,
        };
    }

    update(world: World, {time}:SystemResourcePartial): void {
        if (!time) return;

        // get delta time from resource
        const dt = time.fixedDeltaTime / 1000;

        const localPlayerQuery = world.queryWithEntityAndFilter({
            returnComponents: [RigidBody, PlayerState, PredictionHistory],
            filterComponents: [LocalPlayerTag],
        });
        if (localPlayerQuery.length === 0) return;

        const [playerEntity, rb, state, history] = localPlayerQuery[0];

        this.tickTimers(state, dt);

        const inputEvents = world.readEvents(InputEvent);
        const net = world.getResource(NetworkResource);

        for (const event of inputEvents) {
            history.pendingInputs.push({ tick: event.tick, input: event.payload });

            if (isSome(net)) {
                const message: PlayerInput = {
                    type: 'playerInput',
                    payload: event.payload
                };
                unwrapOpt(net).sendMessage(message);
            }

            // Handle one-shot attack events
            if (event.payload.attack) {
                playerEntity.addComponent(new AttackRequest());
            }
        }

        if (history.pendingInputs.length === 0) return;

        // Loop through all pending inputs, apply them, and save the resulting state.
        for (const { tick, input } of history.pendingInputs) {
            // Apply the input logic
            this.applyInput(rb, state, input as Input);

            // Save the *resulting* state to history, tagged with the tick
            const newState = this.cloneState(rb, state);
            history.stateHistory.push({ tick, state: newState });
        }

        history.pendingInputs = [];

        if (history.stateHistory.length > 300) { // Keep ~5 seconds of history
            history.stateHistory.splice(0, history.stateHistory.length - 300);
        }

    }

    /**
     * Public helper to apply a single input.
     * This is used by both this system and the ReconciliationSystem's "replay" logic.
     */
    public applyInput(rb: RigidBody, state: PlayerState, input: Input): void {
        const body = rb.body;

        // Update faceDirection based on horizontal input
        if (input.dx > 0) {
            state.faceDirection = 1;
        } else if (input.dx < 0) {
            state.faceDirection = -1;
        }

        if (state.isBusy) return;

        // Handle dodge event
        if (input.dodge && state.getDodgeTimer <= 0 && state.getDodgeCooldown <= 0 && state.isGrounded) {
            this.startDodge(rb, state);
        }

        if (state.getDodgeTimer <= 0) {
            // Horizontal movement "state"
            const currentVelocity = body.velocity;
            Matter.Body.setVelocity(body, {
                x: input.dx * PLAYER_SPEED,
                y: currentVelocity.y
            });

        }

        // Jump "event"
        if (input.jump && state.JumpCount > 0) {
            Matter.Body.setVelocity(body, {
                x: body.velocity.x,
                y: -JUMP_FORCE
            });
            state.isGrounded = false;
            state.decreaseJumpCount();
        }

        // Self-correction
        if (!input.jump && body.velocity.y < -0.1) {
            state.isGrounded = false;
        }
    }

    /**
     * Ticks down all active timers.
     */
    private tickTimers(state: PlayerState, dt: number): void {
        // Tick down timers
        if (state.getDodgeCooldown > 0) {
            state.setDodgeCooldown = state.getDodgeCooldown - dt;
        }

        if (state.getDodgeTimer > 0) {
            state.setDodgeTimer = state.getDodgeTimer - dt;
            if (state.getDodgeTimer <= 0) {
                state.isInvisible = false;
                state.isBusy = false;
                // if (combatState.timeSinceLastAttack >= combatState.attackDelay) {
                //     state.isBusy = false;
                //     state.isInvisible = false;
                // }
            }
        }
    }

    /**
     * Applies the dodge/dash mechanics to the player.
     */
    private startDodge(rb: RigidBody, state: PlayerState) {
        const body = rb.body;
        const direction = state.faceDirection;

        // Give a strong horizontal boost
        Matter.Body.setVelocity(body, {
            x: direction * DODGE_FORCE,
            y: 0
        });

        // Set state properties
        state.isInvisible = true;
        state.setDodgeTimer = DODGE_DURATION;
        state.setDodgeCooldown = DODGE_COOLDOWN;
    }
}