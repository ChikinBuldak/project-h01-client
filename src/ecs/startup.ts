import {
    DomRenderSystem, InterpolationSystem,
    PlayerMovementSystem, ReconciliationSystem, PhysicsSystem,
    NetworkReceiveSystem, AudioSystem,
    AnimationSystem,
    CombatSystem,
    DebugRenderSystem,
} from './systems';
import { NetworkStateBuffer } from './components';
import { CharacterFactory } from './factories/CharacterFactory';
import { WorldFactory } from './factories/WorldFactory';
import { Entity, type Resource, type System } from '../types/ecs';
import { Time } from './resources';
import { isSome } from '@/types';
import type { GameConfig } from '@/types/config';
import { GarbageCollectorSystem } from './systems/others/GarbageCollectorSystem';
import { PlayerLifecycleSystem } from './systems/core/PlayerLifecycleSystem';
import { LogSystem } from './systems/others/LogSystem';
import { InGameInputSystem } from './systems/core/input/InGameInputSystem';
import { InGameStateComponent } from './components/scenes/InGameStateComponent';

export function setupCoreSystems(
    addSystem: (sys: System) => void
) {
    addSystem(new LogSystem());
    addSystem(new AudioSystem());
    addSystem(new GarbageCollectorSystem());
        addSystem(new DomRenderSystem());
}
/**
 * Adds all necessary resources to the world.
 */
export function setupResources(
    addResource: (res: Resource) => void,
) {
    addResource(new Time());
}

/**
 * Adds all necessary systems to the world.
 */
export function setupInGameSystems(
    addSystem: (sys: System) => void,
    isOnline: boolean
) {
    // Core systems (always run)
    addSystem(new InGameInputSystem());
    addSystem(new PlayerMovementSystem());
    addSystem(new PhysicsSystem());
    addSystem(new AnimationSystem());
    addSystem(new CombatSystem());
    addSystem(new DebugRenderSystem());
    addSystem(new PlayerLifecycleSystem());

    // Online-only systems
    if (isOnline) {
        addSystem(new NetworkReceiveSystem());
        addSystem(new ReconciliationSystem());
        addSystem(new InterpolationSystem());
    }
}

/**
 * Spawns all initial entities into the world.
 * Returns an interval ID for the mock server if in offline mode.
 */
export function setupInGameEntities(
    addEntity: (ent: Entity) => void,
    isOnline: boolean,
    config: GameConfig
): number | undefined {

    // --- Create Players ---
    const playerConfig = config.player;
    const remotePlayerPos = config.scene.remotePlayer;
    const remotePlayer = CharacterFactory.createRed({
        xPos: remotePlayerPos.x,
        yPos: remotePlayerPos.y,
        width: playerConfig.width,
        height: playerConfig.height,
        isPlayer: true,
        config
    });
    const localPlayerPos = config.scene.localPlayer;
    const localPlayer = CharacterFactory.createBlue({
        xPos: localPlayerPos.x,
        yPos: localPlayerPos.y,
        width: playerConfig.width,
        height: playerConfig.height,
        isPlayer: false,
        config
    });
    // --- Create Map ---
    config.scene.ground.forEach(groundProps => {
        const ground = WorldFactory.createGround(groundProps);
        addEntity(ground);
    })

    const pit = WorldFactory.createPit({
        x: config.scene.pit.x,
        y: config.scene.pit.y,
        width: config.scene.pit.width,
        height: config.scene.pit.height
    })

    // Add InGameStateComponent
    addEntity(new Entity().addComponent(new InGameStateComponent()));


    console.log("Grounds added");

    // --- Add to World ---
    addEntity(remotePlayer);
    addEntity(localPlayer);
    addEntity(pit);
    console.log("Players added");

    // --- Mock Server (if offline) ---
    let intervalId: number | undefined = undefined;
    if (!isOnline && config.scene.remotePlayer.mockMove) {
        const netBuffer = remotePlayer.getComponent(NetworkStateBuffer);
        if (isSome(netBuffer)) {
            const buffer = netBuffer.value;
            let serverTick = 0;
            intervalId = setInterval(() => {
                const serverTime = performance.now();
                // We need to provide the full physics state
                const newState = {
                    transform: {
                        position: {
                            x: 150 + Math.sin(serverTime / 500) * 75,
                            y: 50
                        },
                        rotation: 0,
                    },
                    velocity: { x: 0, y: 0 },
                    isGrounded: true
                };
                buffer.addState(serverTick++, newState);
            }, 100) as any;
        }
    }

    return intervalId;
}
