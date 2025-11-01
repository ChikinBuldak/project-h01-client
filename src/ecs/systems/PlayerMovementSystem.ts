import Matter from "matter-js";
import { System, World } from "../../types/ecs";
import { RigidBody } from "../components";
import { LocalPlayerTag, PredictionHistory, type PlayerPhysicsState } from "../components/LocalPlayerTag";
import { PlayerState } from "../components/PlayerState";
import { Time } from "../resources";
import { isNone, unwrapOpt, type Input } from "@/types";
// import { Transform } from "../components/Transform";

const PLAYER_SPEED = 5;
const JUMP_FORCE = 16;
const DODGE_FORCE = 15;
const DODGE_DURATION = 0.2;
const DODGE_COOLDOWN = 1.0;

export class PlayerMovementSystem extends System {
    public cloneState(rb: RigidBody, state: PlayerState): PlayerPhysicsState {
        return {
            position: { ...rb.body.position },
            velocity: { ...rb.body.velocity },
            isGrounded: state.isGrounded,
        };
    }

    update(world: World): void {
        const timeRes = world.getResource(Time);
        if (isNone(timeRes)) return;

        // get delta time from resource
        const dt = unwrapOpt(timeRes).fixedDeltaTime / 1000;

        const localPlayerQuery = world.queryWithFilter(
            [RigidBody, PlayerState, PredictionHistory],
            [LocalPlayerTag],
        );
        if (localPlayerQuery.length === 0) return;

        const [rb, state, history] = localPlayerQuery[0];

        this.tickTimers(rb, state, dt);
        if (history.pendingInputs.length === 0) return;

        // Loop through all pending inputs, apply them, and save the resulting state.
        for (const { tick, input } of history.pendingInputs) {
            // Apply the input logic
            this.applyInput(rb, state, input as Input, dt);

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
    public applyInput(rb: RigidBody, state: PlayerState, input: Input, dt: number): void {
        const body = rb.body;

        // Update faceDirection based on horizontal input
        if (input.dx > 0) {
            state.faceDirection = 1;
        } else if (input.dx < 0) {
            state.faceDirection = -1;
        }

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
        if (input.jump && state.isGrounded) {
            Matter.Body.setVelocity(body, {
                x: body.velocity.x,
                y: -JUMP_FORCE
            });
            state.isGrounded = false;
        }

        // 3. Self-correction
        if (!input.jump && body.velocity.y < -0.1) {
            state.isGrounded = false;
        }
    }

    /**
 * Ticks down all active timers.
 */
    private tickTimers(rb: RigidBody, state: PlayerState, dt: number): void {
        // Tick down timers
        if (state.getDodgeCooldown > 0) {
            state.setDodgeCooldown = state.getDodgeCooldown - dt;
        }
        if (state.getDodgeTimer > 0) {
            state.setDodgeTimer = state.getDodgeTimer - dt;
            if (state.getDodgeTimer <= 0) {
                state.isInvisible = false;
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