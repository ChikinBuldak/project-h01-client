import Matter from "matter-js";
import { Entity, System } from "../../types/ecs";
import { RigidBody } from "../components";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";
import { PlayerState } from "../components/PlayerState";
import type { Input } from "../../types/input";
// import { Transform } from "../components/Transform";

const PLAYER_SPEED = 5;
const JUMP_FORCE = 8;
export class MovementSystem extends System {
    update(entities: Entity[], deltaTime: number): void {
        const localPlayerQuery = this.query(entities,
            LocalPlayerTag,
            RigidBody,
            PlayerState,
            PredictionHistory);
        // console.log(localPlayerQuery);
        if (localPlayerQuery.length === 0) return;
        const [_tag, rb, state, history] = localPlayerQuery[0];
        const body = rb.body;
        const lastInput = history.pendingInputs[history.pendingInputs.length - 1]?.input as Input | undefined;

        if (lastInput) {
            // Horizontal movement
            const currentVelocity = body.velocity;
            Matter.Body.setVelocity(body, {
                x: lastInput.dx * PLAYER_SPEED,
                y: currentVelocity.y
            });
        }
        let didJump = false;
        for (const { input } of history.pendingInputs) {
            // Jump
            if (input.jump && state.isGrounded) {
                Matter.Body.setVelocity(body, {
                    x: body.velocity.x,
                    y: -JUMP_FORCE
                });

                state.isGrounded = false;
                didJump = true;
                break;
            }
        }

        history.pendingInputs = [];

        if (!didJump && body.velocity.y < -0.1) {
            state.isGrounded = false;
        }
    }

    // applyInput(transform: Transform, input: any, deltaTime: number) {
    //     const speed = 5;
    //     transform.position.x += input.dx * speed * (deltaTime / 1000);
    //     transform.position.y += input.dy * speed * (deltaTime / 1000);
    // }

}