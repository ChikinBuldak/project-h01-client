import Matter from "matter-js";
import { Entity, System, World } from "../../types/ecs";
import type { PlayerStateMessage, TransformState } from "../../types/network";
import { PlayerState, RigidBody } from "../components";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";
import { Transform } from "../components/Transform";
import { PlayerMovementSystem } from "./PlayerMovementSystem";
import { isNone, isSome } from "../../types/option";

const POSITION_EPSILON = 1.0;
const VELOCITY_EPSILON = 0.1

export class ReconciliationSystem extends System {
    update(_world: World): void { }

    public onServerStateReceived(world: World,
        serverMessage: PlayerStateMessage

    ) {
        const localPlayerQuery = world.queryWithFilter(
            [RigidBody, PlayerState, PredictionHistory],
            [LocalPlayerTag],
        );
        if (localPlayerQuery.length === 0) return;
        const [rb, state, history] = localPlayerQuery[0];
        const { tick, state: serverState } = serverMessage;

        const clientState = history.stateHistory.find(s => s.tick === tick);

        // Prune old history. All inputs/states before this are now confirmed.
        // We do this *regardless* of error to keep the buffers clean.
        history.pendingInputs = history.pendingInputs.filter(i => i.tick > tick);
        history.stateHistory = history.stateHistory.filter(s => s.tick > tick);
        if (!clientState) {
            // We have no local state to compare against. This can happen
            // on first join or after heavy packet loss.
            // We must accept the server's state as truth.
            Matter.Body.setPosition(rb.body, serverState.transform.position);
            Matter.Body.setVelocity(rb.body, serverState.velocity);
            state.isGrounded = serverState.isGrounded;
            return;
        }

        // calculate error
        const posError = Matter.Vector.magnitude(
            Matter.Vector.sub(clientState.state.position, serverState.transform.position)
        );
        const velError = Matter.Vector.magnitude(
            Matter.Vector.sub(clientState.state.velocity, serverState.velocity)
        );

        if (posError < POSITION_EPSILON && velError < VELOCITY_EPSILON) {
            // No error. We predicted correctly! Do nothing.
            return;
        }

        console.warn(`Mis-prediction at tick ${tick}. Reconciling...`);

        // a. Get the "predictor" system
        const predictor = world.getSystem(PlayerMovementSystem);
        if (isNone(predictor)) return;

        // b. Snap the client's "live" body to the server's authoritative state
        Matter.Body.setPosition(rb.body, serverState.transform.position);
        Matter.Body.setVelocity(rb.body, serverState.velocity);
        state.isGrounded = serverState.isGrounded;

        // c. Re-play all pending inputs *on top of* the corrected state
        //    (These are inputs the server hasn't seen yet)
        for (const { tick: inputTick, input } of history.pendingInputs) {
            // Run the *exact same* prediction logic
            predictor.value.applyInput(rb, state, input);

            // Save the *new, re-predicted* state to history
            const replayedState = predictor.value.cloneState(rb, state);
            history.stateHistory.push({ tick: inputTick, state: replayedState });
        }
    }

} 