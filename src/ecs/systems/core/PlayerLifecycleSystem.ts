import { Knockbacker, PlayerState, RigidBody } from "@/ecs/components";
import LogEvent from "@/ecs/events/LogEvent";
import { PlayerFallEvent } from "@/ecs/events/PlayerFallEvent";
import { isSome, type System, type World } from "@/types";
import Matter from "matter-js";

const RESPAWN_POINT = { x: 700, y: 50 };

export class PlayerLifecycleSystem implements System {
    update(world: World): void {
        const fallEvents = world.readEvents(PlayerFallEvent);
        if (fallEvents.length === 0) return;
        for (const event of fallEvents) {
            const victim = event.victim;
            world.sendEvent(new LogEvent('info', `[PlayerLifecycle] Entity ${victim.id} falls! Respawning...`))
            
            const rb = victim.getComponent(RigidBody);
            const knockbacker = victim.getComponent(Knockbacker);
            const state = victim.getComponent(PlayerState);

            if (isSome(knockbacker)) {
                knockbacker.value.reset();
            }
            if (isSome(state)) {
                state.value.isGrounded = false;
                state.value.resetJumpCount();
            }
            if (isSome(rb)) {
                const body = rb.value.body;
                Matter.Body.setPosition(body, RESPAWN_POINT);
                Matter.Body.setVelocity(body, {x: 0, y:0});
            }

        }
    }

}