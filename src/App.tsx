import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { useWorldStore } from './stores/world.stores'
import { InputManager } from './types/input'
import { isSome, unwrapOpt } from './types/option'
import { DiscordSDK, type IDiscordSDK } from '@discord/embedded-app-sdk'
import { AssetServer, AudioServer, NetworkResource } from './ecs/resources'
import { parseBoolean, setupDiscordSDK } from './utils';
import { setupEntities, setupResources, setupSystems } from './ecs/startup'
import { isErr, tryCatchAsync, unwrapRes, type Result } from './types'
import type { GameConfig } from './types/config'

let discordSdk: IDiscordSDK | null = null;

if (window.self !== window.top) {
	// Only initialize the SDK if we're in an iframe (i.e., inside Discord)
	discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
}

function App() {
	useGameLoop();
	const { addSystem, addEntity, initializeWorld, addResource } = useWorldStore.getState();
	const initRef = useRef(false);
	const [auth, setAuth] = useState<{ user: { username: string } } | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const backEndUrl = import.meta.env.VITE_BACKEND_URL;

	const setupDiscord = useCallback(() => {
		setupDiscordSDK(discordSdk, setAuth, addResource, backEndUrl);
	}, [addResource, backEndUrl]);

	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;

		const IS_ONLINE = parseBoolean(import.meta.env.VITE_ONLINE || '');

		async function initializeGame() {
			console.log("INITIALIZING APP...");
			InputManager.initialize();
			initializeWorld();

			// load config
			const configResponse = await fetch('/game.config.json');
			if (!configResponse.ok) {
				const message = `Failed to fetch game.config.json: ${configResponse.statusText}`
				console.error(message);
				setError(message)
				return;
			}
			const configRes: Result<GameConfig, unknown> = await tryCatchAsync(async () => await configResponse.json());
			if (isErr(configRes)) {
				console.error(`cannot load config from JSON: ${configRes}`);
				setError(configRes.error as string);
				return;
			}
			const config = unwrapRes(configRes);
			const assetServer = new AssetServer();
			const audioServer = new AudioServer();
			addResource(assetServer);
			addResource(audioServer);

			// preload assets
			console.log("Preloading assets...");
			const loadAssetRes = await tryCatchAsync(() => assetServer.preload(config.assets.images));
			if (isErr(loadAssetRes)) {
				console.error(`Error loading asset: ${loadAssetRes.error}`);
				return;
			}
			const loadAudioRes = await tryCatchAsync(()=>audioServer.preload(config.assets.audio));
			if (isErr(loadAudioRes)) {
				console.error(`Error loading audio assets: ${loadAudioRes.error}`);
				// return;
			}

			setupResources(addResource, IS_ONLINE, backEndUrl);
			setupSystems(addSystem, IS_ONLINE);
			if (IS_ONLINE) {
				setupDiscord();
			}
			setIsLoading(false);

			const intervalId = setupEntities(addEntity, IS_ONLINE, config);
			console.log("Everything good");
			return () => {
				if (intervalId) {
					clearInterval(intervalId);
				}
				const { world } = useWorldStore.getState();
				const net = world.getResource(NetworkResource);
				if (isSome(net)) unwrapOpt(net).disconnect();
			}
		}

		// Call the async setup function
		let cleanup = () => {};
		initializeGame().then(cleanupFn => {
			if (cleanupFn) {
				cleanup = cleanupFn;
			}
		});

		return () => {
			cleanup();
		}

	}, [addEntity, addResource, addSystem, backEndUrl, initializeWorld, setupDiscord])

	if (error) {
		return (
			<div id="instructions" style={{ textAlign: 'center', paddingTop: '50px', color: 'red' }}>
				Error: {error}
			</div>
		);
	}
	
	if (isLoading) {
		return (
			<div id="instructions" style={{ textAlign: 'center', paddingTop: '50px' }}>
				Loading Assets & Config...
			</div>
		);
	}

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
