import { useWorldStore } from "../../stores/world.stores";
import { Entity, System, World } from "../../types/ecs";
import { InputManager, KeyCode} from "../../types/input";
import type { Input, PlayerInput } from "../../types/network";
import { isSome, unwrapOpt } from "../../types/option";
import { LocalPlayerTag, PredictionHistory } from "../components/LocalPlayerTag";
import { NetworkResource } from "../resources/NetworkResource";

export class InputSystem extends System {
    private currentTick = 0;
    
    update(world: World): void {
        const inputPayload: Input = {
            dx: 0,
            dy: 0,
            tick: this.currentTick,
            jump: false,
            dodge: false
        }

        const localPlayerQuery = world.queryWithFilter([PredictionHistory],[LocalPlayerTag]);
        if (localPlayerQuery.length === 0) return;
        const [history] = localPlayerQuery[0];
        
        if (InputManager.isDown(KeyCode.A)) inputPayload.dx = -1;
        if (InputManager.isDown(KeyCode.D)) inputPayload.dx = 1;
        
        const isJumpPressed = InputManager.isDown(KeyCode.Space);
        
        if (isJumpPressed) {
            inputPayload.jump = true;
        }
        if (InputManager.isDown(KeyCode.Shift)) {
            inputPayload.dodge = true;
        }
        
        history.pendingInputs.push({ tick: this.currentTick, input: inputPayload });
        // send input message to the server
        const net = world.getResource(NetworkResource);
        if (isSome(net)) {
            const message: PlayerInput = {
                type: 'playerInput',
                payload: inputPayload
            };
            unwrapOpt(net).sendMessage(message);
        }
        this.currentTick++;
    }
}