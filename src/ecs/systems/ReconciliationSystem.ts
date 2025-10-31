import { Entity, System } from "../../types/ecs";
import type { TransformState } from "../../types/network";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";
import { Transform } from "../components/Transform";
import type { MovementSystem } from "./MovementSystem";

const EPSILON = 0.01;

export class ReconciliationSystem extends System {
    update(_entities: Entity[], _deltaTime: number): void { }

    public onServerStateReceived(entities: Entity[],
        serverState: { tick: number, state: TransformState },
        movementSystem: MovementSystem,
        fixedDeltaTime: number

    ) {
        const localPlayerQuery = this.query(entities, LocalPlayerTag, Transform, PredictionHistory);
        if (localPlayerQuery.length === 0) return;
        const [_player, transform, history] = localPlayerQuery[0];

        const clientState = history.stateHistory.find((s) => s.tick === serverState.tick);
        if (!clientState) return;

        const error = Math.abs(clientState.state.position.x - serverState.state.position.x) 
        + Math.abs(clientState.state.position.y - serverState.state.position.y);
        if (error > EPSILON) {
            transform.position.x = serverState.state.position.x;
            transform.position.y = serverState.state.position.y;

            // Remove acknowledged tick from history
            history.stateHistory = history.stateHistory.filter((s) => s.tick > serverState.tick);
            history.pendingInputs = history.pendingInputs.filter((i) => i.tick > serverState.tick);

            for (const { input } of history.pendingInputs) {
                movementSystem.applyInput(transform, input, fixedDeltaTime);
                history.stateHistory.push({ tick: input.tick, state: transform.clone() })
            }

            history.stateHistory.sort((a, b) => a.tick - b.tick);
        } else {
            history.stateHistory = history.stateHistory.filter(s => s.tick > serverState.tick);
            history.pendingInputs = history.pendingInputs.filter(i => i.tick > serverState.tick);
        }
    }

} 