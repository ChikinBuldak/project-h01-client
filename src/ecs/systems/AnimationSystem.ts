import { isNone, type System, unwrapOpt, World } from "@/types";
import { Time } from "../resources";
import { AnimationController, PlayerState, RigidBody } from "../components";

export class AnimationSystem implements System {
    update(world: World): void {
        const timeRes= world.getResource(Time);
        if (isNone(timeRes)) return;

        const dt = unwrapOpt(timeRes).fixedDeltaTime / 1000; // convert to second
        const query = world.query(
            AnimationController,
            PlayerState,
            RigidBody
        );

        for (const [controller, playerState, rb] of query) {
            // Decide new animation style
            let newState = "idle";
            // if (!playerState.isGrounded) {
            //     newState = (rb.body.velocity.y < 0) ? "jump" : "fall";
            // } else if (Math.abs(rb.body.velocity.x) > 0.1) {
            //     newState = "run";
            // }
            // State changing
            if (controller.currentState !== newState) {
                const clip = controller.states.get(newState);
                if (clip) {
                    controller.currentState = newState;
                    controller.currentFrame = 0;
                    controller.frameTimer = 0;
                }
            }

            // tick animation timer
            const clip = controller.states.get(controller.currentState);
            if (!clip) continue;
            controller.frameTimer += dt;
            if (controller.frameTimer >= clip.frameDuration) {
                controller.frameTimer -= clip.frameDuration;
                controller.currentFrame = (controller.currentFrame + 1) % clip.frameCount;
            }
        }
    }
}