import { Entity, System } from "../../types/ecs";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";
import { Transform } from "../components/Transform";

export class MovementSystem extends System {
    update(entities: Entity[], deltaTime: number): void {
        const localPlayerQuery = this.query(entities, LocalPlayerTag, Transform, PredictionHistory);
        // console.log(localPlayerQuery);
        if (localPlayerQuery.length > 0) {
            const [_player, transform, history] = localPlayerQuery[0];
            
            // store pre-input state for rollback
            history.stateHistory.push({tick: history.pendingInputs[0]?.tick - 1, state: transform.clone()});

            // Apply all pending inputs
            for (const {input} of history.pendingInputs) {
                this.applyInput(transform, input, deltaTime);
            }
        }
    }

    applyInput(transform: Transform, input: any, deltaTime: number) {
        const speed = 5;
        transform.position.x += input.dx * speed * (deltaTime / 1000);
        transform.position.y += input.dy * speed * (deltaTime / 1000);
    }

}