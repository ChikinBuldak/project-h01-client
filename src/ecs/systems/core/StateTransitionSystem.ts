import { CurrentState, NextState } from "@/ecs/resources/state";
import { isNone, type System, type World } from "@/types";

export class StateTransitionSystem implements System {
    update(world: World): void {
        // get resource
        const currentRes = world.getResource(CurrentState); 
        const nextRes = world.getResource(NextState);
        if (isNone(currentRes) || isNone(nextRes)) return;

        const current = currentRes.value;
        const next = nextRes.value;

        // take transition request
        const requestedTransition = next.take();

        if (requestedTransition.isSome()) {
            const newState = requestedTransition.value;
            const oldState = current.get();
            if (newState.constructor === oldState.constructor) return;

            oldState.onExit(world);
            newState.onEnter(world);

            current.set(newState);
        }
    }

}