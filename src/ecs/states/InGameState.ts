import { useWorldStore } from '@/stores';
import type { IInterval, Undefinable } from '@/types';
import { type AppState, World } from '@/types/ecs';
import { ConfigResource } from '../resources/ConfigResource';
import type { InGameUiState } from '@/stores/ui.types';
import { useUiStore } from '@/stores/ui.store';
import { setupEntities, setupSystems } from '../startup';
import { CombatResource, DomResource, NetworkResource, PhysicsResource } from '../resources';
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
            health: 100,
            maxHealth: 100,
            score: 0
        }

        useUiStore.getState().transitionTo(initialState);
        setupSystems(addSystem, configRes.effectiveOnline);
        this.entityInterval = setupEntities(
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
    }

}