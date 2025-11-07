import { type System, type SystemResourcePartial, unwrapOpt, World } from "@/types";
import { AnimationController, PlayerState, RigidBody } from "@/ecs/components";

export class AnimationSystem implements System {
    update(world: World, {time}: SystemResourcePartial): void {
        if (!time) return;

        const dt = time.fixedDeltaTime / 1000; // convert to second
        const query = world.query(
            AnimationController,
            PlayerState,
            RigidBody
        );

        for (const [controller, playerState, rb] of query) {
            // Decide new animation style
            let newState = "idle";
            if (!playerState.isGrounded) {
                newState = (rb.body.velocity.y < 0) ? "jump" : "fall";
            } else if (Math.abs(rb.body.velocity.x) > 0.1) {
                newState = "run";
            }
            // State changing
            controller.changeState(newState);
            
            // tick animation timer
            controller.tick(dt);
        }
    }
}