import { useWorldStore } from '@/stores';
import type { IInterval, Undefinable } from '@/types';
import { type AppState, World } from '@/types/ecs';
import { ConfigResource } from '../resources/ConfigResource';
import type { InGameUiState } from '@/stores/ui.types';
import { useUiStore } from '@/stores/ui.store';
import { setupInGameEntities, setupInGameSystems } from '../startup';
import { CombatResource, DomResource, NetworkResource, PhysicsResource } from '../resources';
import { GarbageCollectorSystem, InGameInputSystem, PlayerMovementSystem, DomRenderSystem, PhysicsSystem, AnimationSystem, CombatSystem, DebugRenderSystem, NetworkReceiveSystem, ReconciliationSystem } from '../systems';
import { PlayerLifecycleSystem } from '../systems/core';
import { InterpolationSystem } from '../systems/network/InterpolationSystem';
import { Despawn } from '../components';
export class InGameState implements AppState {
    private entityInterval: Undefinable<IInterval>;

    onEnter(world: World): void {
        const { addSystem, addEntity, addResource } = useWorldStore.getState();
        const configResOpt = world.getResource(ConfigResource);
        if (!configResOpt.some) {
            console.error("Cannot get Config Resource from the world");
            return;
        }

        // add in game resource
        addResource(new PhysicsResource());
        addResource(new DomResource());
        addResource(new CombatResource());

        const configRes = configResOpt.value;

        const initialState: InGameUiState = {
            type: 'InGame',
            isPaused: false
        } as InGameUiState;

        useUiStore.getState().transitionTo(initialState);
        setupInGameSystems(addSystem, configRes.effectiveOnline);
        this.entityInterval = setupInGameEntities(
            addEntity, configRes.effectiveOnline, configRes.config
        );
    }
    onExit(world: World): void {
        if (this.entityInterval) {
            clearInterval(this.entityInterval);
        }

        const net = world.getResource(NetworkResource);
        if (net.some) {
            net.value.disconnect();
        }

        this.cleanup(world)
    }

    /**
     * Clean system, entity, and resource up
     * @param world 
     */
    private cleanup(world: World) {
        // world.clearEntities();
        for (const entity of world.getEntities()) {
            entity.addComponent(new Despawn());
        }
        world.removeSystem(InGameInputSystem);
        world.removeSystem(PlayerMovementSystem);
        world.removeSystem(PhysicsSystem);
        world.removeSystem(AnimationSystem);
        world.removeSystem(CombatSystem);
        world.removeSystem(DebugRenderSystem);
        world.removeSystem(PlayerLifecycleSystem);
        world.removeSystem(NetworkReceiveSystem);
        world.removeSystem(ReconciliationSystem);
        world.removeSystem(InterpolationSystem);

        world.removeResource(PhysicsResource);
        world.removeResource(CombatResource);
    }

}