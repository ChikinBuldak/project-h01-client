import { Entity, System } from "../../types/ecs";
import { InputManager } from "../../types/input";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";

export class InputSystem extends System {
    private currentTick = 0;

    update(entities: Entity[], _deltaTime: number): void {
        const localPlayerQuery = this.query(entities, LocalPlayerTag, PredictionHistory);
        // console.log(localPlayerQuery);
        if (localPlayerQuery.length === 0) return;
        const [_player, history] = localPlayerQuery[0];

        // Creatae input payload
        const input = {
            dx: 0,
            dy: 0,
            tick: this.currentTick
        }

        // TODO: add input manager here, e.g., if (Input.isDown("w")) input.dy = 1;)
        if (InputManager.isDown("w")) input.dy = -1;
        if (InputManager.isDown("a")) input.dx = -1;
        if (InputManager.isDown("s")) input.dy = 1;
        if (InputManager.isDown("d")) input.dx = 1;

        if (input.dx !== 0 || input.dy !== 0) {
            history.pendingInputs.push({ tick: this.currentTick, input });
            // In a real app, you would also send this input to the server
            // network.sendInput(input);
        }

        // network.sendInput(input);

        this.currentTick++;
    }
}