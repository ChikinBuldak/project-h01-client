import { useEffect, useRef, useState } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { useWorldStore } from './stores/world.stores'
import { DomRenderSystem, InputSystem, InterpolationSystem, MovementSystem, ReconciliationSystem } from './ecs/systems'
import { Transform, NetworkStateBuffer } from './ecs/components'
import { InputManager } from './types/input'
import { isSome } from './types/option'
import { DiscordSDK, type IDiscordSDK } from '@discord/embedded-app-sdk'
import { isErr, tryCatchAsync } from './types/result'
import { CharacterFactory } from './ecs/entities/CharacterFactory'

let discordSdk: IDiscordSDK | null = null;

if (window.self !== window.top) {
  // Only initialize the SDK if we're in an iframe (i.e., inside Discord)
  discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
}

function App() {
  useGameLoop();
  const initRef = useRef(false);
  const [auth, setAuth] = useState<{ user: { username: string } } | null>(null);
  const backEndUrl = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function setupDiscordSDK() {
      if (!discordSdk) {
        console.warn("Not in Discord iframe, running in standalone mode");
        if (backEndUrl && backEndUrl !== '') {
          connect(backEndUrl as string);
        }
        return;
      }

      console.log("Waiting for Discord SDK to be ready...");
      const readyRes = await tryCatchAsync(async () => discordSdk.ready());
      if (isErr(readyRes)) {
        console.error("Error when calling ready():", readyRes.error);
        return;
      }
      console.log("Discord SDK is ready");

      // Authorize with Discord
      const authRes = await tryCatchAsync(
        async () => discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: 'code',
          state: '',
          prompt: 'none',
          scope: ['identify', 'rpc.activities.write'],
        })
      );
      if (isErr(authRes)) {
        console.error("Error authorizing with Discord:", authRes.error);
        return;
      }

      const { code } = authRes.value;
      console.log("Authorization complete.");

      // Authenticate with the game server
      console.log("Authenticating with Discord...");
      const authenticationResult = await tryCatchAsync(
        async () => await discordSdk.commands.authenticate({
          access_token: code,
        })
      );

      if (isErr(authenticationResult)) {
        console.error("Error authenticating with Discord server:", authenticationResult.error);
        return;
      }

      setAuth(authenticationResult.value);
      console.log(`Authenticated as ${authenticationResult.value.user.username}`);

      // Set the activity
      console.log("Setting activity...");
      const setActivityRes = await tryCatchAsync(
        async () => await discordSdk.commands.setActivity({
          activity: {
            details: "Running the ECS demo",
            state: "Predicting and Interpolating",
            timestamps: {
              start: Date.now(),
            },
            assets: {
              large_image: "imageku",
              large_text: "ECS Demo"
            }
          }
        })
      );

      if (isErr(setActivityRes)) {
        console.log("Error when setting the activity:", setActivityRes.error);
        return;
      }
      console.log("Activity set.");
      console.log("Connecting to game server...");
      if (backEndUrl !== '') {
        connect(backEndUrl);
      }

    }


    console.log("INITIALIZING APP...");
    InputManager.initialize();
    const { addSystem, addEntity, initializeWorld, connect, disconnect } = useWorldStore.getState();
    initializeWorld();

    addSystem(new InputSystem());
    addSystem(new MovementSystem());
    addSystem(new ReconciliationSystem());
    addSystem(new InterpolationSystem());
    addSystem(new DomRenderSystem());

    const localPlayer = CharacterFactory.createRed({
      xPos: 50,
      yPos: 50,
      isPlayer: true
    })

    const remotePlayer = CharacterFactory.createBlue({
      xPos: 150,
      yPos: 50,
    })

    addEntity(remotePlayer);
    addEntity(localPlayer);

    let intervalId: number | undefined = undefined;
    const netBuffer = remotePlayer.getComponent(NetworkStateBuffer);
    if (isSome(netBuffer)) {
      const buffer = netBuffer.value;
      intervalId = setInterval(() => {
        const serverTime = performance.now();
        const newState = new Transform(
          150 + Math.sin(serverTime / 500) * 75,
          50
        );
        buffer.addState(serverTime, newState);
      }, 100);
    }

    setupDiscordSDK();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      disconnect();
    }
  }, [])

  if (discordSdk && !auth) {
    return (
      <div id="instructions" style={{ textAlign: 'center', paddingTop: '50px' }}>
        Connecting to Discord...
      </div>
    );
  }
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
