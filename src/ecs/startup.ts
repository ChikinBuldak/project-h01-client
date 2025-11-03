import {
    DomRenderSystem, InputSystem, InterpolationSystem,
    PlayerMovementSystem, ReconciliationSystem, PhysicsSystem,
    NetworkReceiveSystem, AudioSystem,
    AnimationSystem,
    CombatSystem,
    DebugRenderSystem
} from './systems';
import { NetworkStateBuffer} from './components';
import { CharacterFactory } from './factories/CharacterFactory';
import { WorldFactory } from './factories/WorldFactory';
import { Entity, type Resource, type System } from '../types/ecs';
import { NetworkResource, Time } from './resources';
import { isSome } from '@/types';
import type { GameConfig } from '@/types/config';
import { PhysicsResource } from './resources/PhysicsResource';
import { DomResource } from './resources/DomResource';
import { GarbageCollectorSystem } from './systems/others/GarbageCollectorSystem';

/**
 * Adds all necessary resources to the world.
 */
export function setupResources(
    addResource: (res: Resource) => void,
    isOnline: boolean,
    backEndUrl: string
) {
    addResource(new Time());
    addResource(new PhysicsResource());
    addResource(new DomResource());

    if (isOnline) {
        console.log("Running in ONLINE mode.");
        if (backEndUrl) {
            addResource(new NetworkResource(backEndUrl));
        }
    } else {
        console.log("Running in OFFLINE mode.");
    }
}

/**
 * Adds all necessary systems to the world.
 */
export function setupSystems(
    addSystem: (sys: System) => void,
    isOnline: boolean
) {
    // Core systems (always run)
    addSystem(new GarbageCollectorSystem());
    addSystem(new InputSystem());
    addSystem(new PlayerMovementSystem());
    addSystem(new DomRenderSystem());
    addSystem(new PhysicsSystem());
    addSystem(new AudioSystem());
    addSystem(new AnimationSystem());
    addSystem(new CombatSystem());
    addSystem(new DebugRenderSystem());

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
export function setupEntities(
    addEntity: (ent: Entity) => void,
    isOnline: boolean,
    config: GameConfig
): number | undefined {
    const characterFactory = new CharacterFactory();
    const worldFactory = new WorldFactory();

    // --- Create Players ---
    const playerConfig = config.player;
    const remotePlayerPos = config.scene.remotePlayer;
    const remotePlayer = characterFactory.createRed({
        xPos: remotePlayerPos.x,
        yPos: remotePlayerPos.y,
        width: playerConfig.width,
        height: playerConfig.height,
        isPlayer: true,
        config
    });
    const localPlayerPos = config.scene.localPlayer;
    const localPlayer = characterFactory.createBlue({
        xPos: localPlayerPos.x,
        yPos: localPlayerPos.y,
        width: playerConfig.width,
        height: playerConfig.height,
        isPlayer: false,
        config
    });
    // --- Create Map ---
    config.scene.ground.forEach(groundProps => {
        const ground = worldFactory.createGround(groundProps);
        addEntity(ground);
    })
    
    console.log("Grounds added");

    // --- Add to World ---
    addEntity(remotePlayer);
    addEntity(localPlayer);
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
            }, 100) as any; // Cast to number for Node.js/Browser compatibility
        }
    }

    return intervalId;
}
