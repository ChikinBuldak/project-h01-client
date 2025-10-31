import { useEffect, useRef } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { useWorldStore } from './stores/world.stores'
import { DomRenderSystem, InputSystem, InterpolationSystem, MovementSystem, ReconciliationSystem } from './ecs/systems'
import { Entity } from './types/ecs'
import { Transform } from './ecs/components/Transform'
import { NetworkStateBuffer } from './ecs/components/NetworkStateBuffer'
import { InputManager } from './types/input'
import { LocalPlayerTag, PredictionHistory } from './ecs/components/LocalPlayerTag'
import { isSome } from './types/utils/option'

function App() {
  useGameLoop();
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log("INITIALIZING APP..."); // Add a log
    InputManager.initialize();
    const { addSystem, addEntity, initializeWorld, connect } = useWorldStore();
    initializeWorld();

    addSystem(new InputSystem());
    addSystem(new MovementSystem());
    addSystem(new ReconciliationSystem());
    addSystem(new InterpolationSystem());
    addSystem(new DomRenderSystem());

    const localPlayer = new Entity()
      .addComponent(new Transform(50, 50))
      .addComponent(new LocalPlayerTag())
      .addComponent(new PredictionHistory())
      .addComponent(new NetworkStateBuffer());

    const remotePlayer = new Entity()
      .addComponent(new Transform(150, 50))
      .addComponent(new NetworkStateBuffer());

    addEntity(remotePlayer);
    addEntity(localPlayer);
    const netBuffer = remotePlayer.getComponent(NetworkStateBuffer);
    if (isSome(netBuffer)) {
      const buffer = netBuffer.value;
      setInterval(() => {
        const serverTime = performance.now();
        const newState = new Transform(
          150 + Math.sin(serverTime / 500) * 75,
          50
        );
        buffer.addState(serverTime, newState);
      }, 100);
    }
  }, [])

  return (
    <>
      <div id="world-container">
        <div id="world"></div>
      </div>
      <div id="instructions">
        Use WASD keys to move your cube (client-side prediction).
        <br />
        The other cube moves on its own (server interpolation).
      </div>
    </>
  )
}

export default App
