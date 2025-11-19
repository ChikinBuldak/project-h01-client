import { type System, type SystemResourcePartial, World } from "@/types/ecs";
import { InputManager, KeyCode } from "@/types/input";
import type { Input } from "@/types/network";
import { LocalPlayerTag } from "@/ecs/components";
import { InputEvent } from "@/ecs/events/InputEvent";
import { AttackRequest } from "@/ecs/components/character/AttackRequest";
import { useUiStore } from "@/stores";
import { InGameStateComponent } from "@/ecs/components/scenes/InGameStateComponent";
import { match } from "@/types/utils";

export class InGameInputSystem implements System {
    update(world: World, { time }: SystemResourcePartial): void {
        if (InputManager.isJustPressed(KeyCode.Escape)) {
            this.changeIsPaused(world, { type: 'toggle' })
        }

        // Add a guard to ensure the Time resource was passed
        if (!time) {
            console.warn(
                "InGameInputSystem: Time resource not found, skipping update."
            );
            return;
        }

        const currentTick = time.currentTick;
        const didJump =
            InputManager.isJustPressed(KeyCode.Space) ||
            InputManager.isJustPressed(KeyCode.W);
        const didDodge = InputManager.isJustPressed(KeyCode.Shift);
        const didAttack = InputManager.isJustPressed(KeyCode.J);

        if (didJump) console.log("Jumping");
        const inputPayload: Input = {
            dx: 0,
            dy: 0,
            tick: currentTick,
            jump: didJump,
            dodge: didDodge,
            attack: didAttack
        }
        if (InputManager.isDown(KeyCode.A)) inputPayload.dx = -1;
        if (InputManager.isDown(KeyCode.D)) inputPayload.dx = 1;

        // Send local event for player movement system
        world.sendEvent(new InputEvent(currentTick, inputPayload));

        if (didAttack) {
            const playerQuery = world.queryWithEntityAndFilter({ returnComponents: [], filterComponents: [LocalPlayerTag] });
            if (playerQuery.length > 0) {
                const [playerEntity] = playerQuery[0];
                playerEntity.addComponent(new AttackRequest());
            }
        }
        InputManager.lateUpdate();
        
    }

    private changeIsPaused(world: World, set: SetMethod) {
        const gameStateComponentOpt = world.querySingle(InGameStateComponent);
        if (gameStateComponentOpt.some) {
            const [gameStateComponent] = gameStateComponentOpt.value;
            const updateUi = useUiStore.getState().updateCurrentState;
            const isPaused = match(set)({
                toggle: (_arg) => !gameStateComponent.isPaused,
                patch: (arg) => arg.value,
                _: () => gameStateComponent.isPaused,
            });
            // update the gameStateIsPaused component
            updateUi({
                isPaused
            })
            gameStateComponent.isPaused = isPaused
        }
    }
}

type Toggle = {
    type: 'toggle'
}

type Patch = {
    type: 'patch',
    value: boolean
}
type SetMethod = Toggle | Patch;

