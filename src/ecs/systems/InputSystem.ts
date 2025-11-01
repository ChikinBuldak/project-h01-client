import { useWorldStore } from "../../stores/world.stores";
import { Entity, System } from "../../types/ecs";
import { InputManager, type Input } from "../../types/input";
import type { PlayerInput } from "../../types/network";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";

export class InputSystem extends System {
    private currentTick = 0;
    private wasJumpPressed = false;
    
    update(entities: Entity[], _deltaTime: number): void {
        const {sendMessage} = useWorldStore.getState();
        const localPlayerQuery = this.query(entities, LocalPlayerTag, PredictionHistory);
        // console.log(localPlayerQuery);
        if (localPlayerQuery.length === 0) return;
        const [_player, history] = localPlayerQuery[0];

        const inputPayload: Input = {
            dx: 0,
            dy: 0,
            tick: this.currentTick,
            jump: false,
        }

        if (InputManager.isDown("a")) inputPayload.dx = -1;
        if (InputManager.isDown("d")) inputPayload.dx = 1;
        
        const isJumpPressed = InputManager.isDown(" ") || InputManager.isDown("w");

        if (isJumpPressed && !this.wasJumpPressed) {
            inputPayload.jump = true;
        }

        this.wasJumpPressed = isJumpPressed;

        history.pendingInputs.push({ tick: this.currentTick, input: inputPayload });
        const message: PlayerInput = {
            type: 'playerInput',
            payload: inputPayload
        };
        sendMessage(message);
        this.currentTick++;
    }
}