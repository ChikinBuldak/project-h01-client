import { type System, World } from "@/types/ecs";
import { InputManager, KeyCode } from "@/types/input";
import type { Input} from "@/types/network";
import { LocalPlayerTag} from "@/ecs/components";
import { InputEvent } from "@/ecs/events/InputEvent";
import { AttackRequest } from "@/ecs/components/character/AttackRequest";

export class InGameInputSystem implements System {
    private currentTick = 0;

    private prevJumpState = false;
    private prevDodgeState = false;
    private prevAttackState = false;

    update(world: World): void {
        // Get the current state
        const isJumpPressed = InputManager.isDown(KeyCode.Space) || InputManager.isDown(KeyCode.W);
        const isDodgePressed = InputManager.isDown(KeyCode.Shift);
        const isAttackPressed = InputManager.isDown(KeyCode.J);
        
        
        // Compare current vs. previous state to find the "edge"
        const didJump = isJumpPressed && !this.prevJumpState;
        const didDodge = isDodgePressed && !this.prevDodgeState;
        const didAttack = isAttackPressed && !this.prevAttackState;
        
        // Update previous state for the next frame ---
        this.prevJumpState = isJumpPressed;
        this.prevDodgeState = isDodgePressed;
        this.prevAttackState = isAttackPressed;
        const inputPayload: Input = {
            dx: 0,
            dy: 0,
            tick: this.currentTick,
            jump: didJump,
            dodge: didDodge,
            attack: didAttack
        }        
        if (InputManager.isDown(KeyCode.A)) inputPayload.dx = -1;
        if (InputManager.isDown(KeyCode.D)) inputPayload.dx = 1;
        
        // Send local event for player movement system
        world.sendEvent(new InputEvent(this.currentTick, inputPayload));

        if (didAttack) {
            const playerQuery = world.queryWithEntityAndFilter({returnComponents: [], filterComponents: [LocalPlayerTag]});
            if (playerQuery.length > 0) {
                const [playerEntity] = playerQuery[0];
                playerEntity.addComponent(new AttackRequest());
            }
        }
        this.currentTick++;
    }
}