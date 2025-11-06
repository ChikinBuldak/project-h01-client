import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { useWorldStore } from './stores/world.stores'
import { InputManager } from './types/input'
import { isSome, unwrapOpt } from './types/option'
import { DiscordSDK, type IDiscordSDK } from '@discord/embedded-app-sdk'
import { AssetServer, AudioServer, NetworkResource, type NetworkDiscordJoinData } from './ecs/resources'
import { parseBoolean, setupDiscordSDK } from './utils';
import { setupEntities, setupResources, setupSystems } from './ecs/startup'
import { gameConfig, isErr, tryCatchAsync, unwrapRes, type Result } from './types'
import type { GameConfig } from './types/config'

const queryParams = new URLSearchParams(window.location.search);
const frameId = queryParams.get('frame_id');

const RUN_TEST_PAGE = false;

let discordSdk: IDiscordSDK | null = null;

if (frameId) {
	// Only initialize the SDK if we are inside Discord's iframe
	discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
} else {
	// This is useful for debugging in the browser
	console.warn("Not in Discord iframe (no frame_id). SDK will not be initialized.");
}

function TestPage() {
	const [count, setCount] = useState(0);

	const onTestClick = () => {
		console.log("Test button clicked! Count is:", count + 1);
		setCount(c => c + 1);
	};

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100vh',
				width: '100vw',
				backgroundColor: '#1e1e1e', // A dark grey, not pure black
				color: 'white',
				fontSize: '24px',
				fontFamily: 'sans-serif',
			}}
		>
			<h1 style={{ color: '#5865F2' }}>Render Test Successful!</h1>
			<p>If you can see this, your Vite server and React are working.</p>
			<p>Your CSS file is also likely loaded.</p>
			<p style={{ fontSize: '18px', color: '#bbb' }}>
				Frame ID: {frameId ? frameId : 'Not in iframe'}
			</p>

			<button
				onClick={onTestClick}
				style={{
					fontSize: '20px',
					padding: '10px 20px',
					marginTop: '20px',
					backgroundColor: '#5865F2',
					color: 'white',
					border: 'none',
					borderRadius: '5px',
					cursor: 'pointer',
				}}
			>
				Click to Test JS (Count: {count})
			</button>
			<p style={{ fontSize: '16px', color: '#bbb', marginTop: '10px' }}>
				(Check the Discord client console after clicking)
			</p>
		</div>
	);
}



function App() {
	useGameLoop();
	const { addSystem, addEntity, initializeWorld, addResource } = useWorldStore.getState();
	const initRef = useRef(false);
	const [auth, setAuth] = useState<{ user: { username: string } } | null>(null);
	const [joinData, setJoinData] = useState<NetworkDiscordJoinData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const backEndUrl = import.meta.env.VITE_BACKEND_URL;
	const discordBotUrl = import.meta.env.VITE_DISCORD_BOT_URL;

	useEffect(() => {
		if (RUN_TEST_PAGE) return; // Skip if testing

		const IS_ONLINE = parseBoolean(import.meta.env.VITE_ONLINE || '');

		// If not in iframe or not online, set mock auth and finish
		if (!IS_ONLINE || !discordSdk) {
			console.log("Running in TRULY OFFLINE mode (not in iframe or VITE_ONLINE=false).");
			setAuth({ user: { username: "Offline" } }); // Mock auth to skip loading
			return;
		}

		// We are online and in the iframe. Start the auth process.
		async function authenticate() {
			console.log("Starting Discord authentication...");
			const authResult = await setupDiscordSDK(
				discordSdk,
				// 1. REMOVED `addResource` from here
				backEndUrl,
				discordBotUrl
			);

			if (authResult) {
				// --- STATE: FULLY ONLINE ---
				console.log("Discord auth success. Running in FULL ONLINE mode.");
				// 2. Set the auth object from the result
				setAuth(authResult.auth);

				// 3. ADD the NetworkResource here, *after* success
				const { joinData } = authResult;
				addResource(new NetworkResource(backEndUrl, joinData));
				console.log("NetworkResource created and added to world.");

			} else {
				// --- STATE: SEMI-OFFLINE ---
				console.warn("Discord SDK setup failed. Running in SEMI-OFFLINE mode.");
				// This is placeholder for joinData, in this we set the guild id and
				// channel id to be "mock" and "mock", and user id will be a random uuid
				const mockJoinData:NetworkDiscordJoinData = {
					guildId: 'mock',
					channelId: 'mock',
					userId: crypto.randomUUID()
				}
				addResource(new NetworkResource(backEndUrl, mockJoinData))
				setAuth({ user: { username: "Offline" } }); // Mock auth
			}
		}

		authenticate().catch(err => {
			console.error("Critical error during authentication:", err);
			setError(err.message || "An unknown authentication error occurred.");
			setAuth({ user: { username: "Offline" } }); // Set to offline on error
		});

	}, [addResource, backEndUrl, discordBotUrl]);

	useEffect(() => {
		if (RUN_TEST_PAGE) return;
		if (initRef.current) return;
		if (!auth) return;
		initRef.current = true;

		async function initializeGame() {
			console.log("INITIALIZING APP...");
			InputManager.initialize();
			initializeWorld();
			const effectiveOnline = auth?.user.username !== "Offline";
			console.log("Game running in effective mode:", effectiveOnline ? "ONLINE" : "OFFLINE");
			// load config
			// const configResponseRes = await tryCatchAsync(() => fetch(`${import.meta.env.VITE_CLIENT_URL_SECURE}/game.config.json`));
			// if (isErr(configResponseRes)) {
			// 	const message = `Failed to fetch game.config.json: ${configResponseRes.error}`
			// 	console.error(message);
			// 	setError(message);
			// 	setIsLoading(false);
			// 	return;
			// }

			// const configResponse = unwrapRes(configResponseRes);
			// if (!configResponse.ok) {
			// 	const message = `Failed to fetch game.config.json: ${configResponse.statusText}`
			// 	console.error(message);
			// 	setError(message);
			// 	setIsLoading(false);
			// 	return;
			// }
			// const configRes: Result<GameConfig, unknown> = await tryCatchAsync(async () => await configResponse.json());
			// if (isErr(configRes)) {
			// 	console.error(`cannot load config from JSON: ${configRes}`);
			// 	setError(configRes.error as string);
			// 	setIsLoading(false);
			// 	return;
			// }
			// const config = unwrapRes(configRes);
			const config = gameConfig;
			const assetServer = new AssetServer();
			const audioServer = new AudioServer();
			addResource(assetServer);
			addResource(audioServer);

			// preload assets
			console.log("Preloading assets...");
			const loadAssetRes = await tryCatchAsync(() => assetServer.preload(config.assets.images));
			if (isErr(loadAssetRes)) {
				console.error(`Error loading asset: ${loadAssetRes.error}`);
				setIsLoading(false);
				return;
			}
			const loadAudioRes = await tryCatchAsync(() => audioServer.preload(config.assets.audio));
			if (isErr(loadAudioRes)) {
				console.error(`Error loading audio assets: ${loadAudioRes.error}`);
				// return;
				// setIsLoading(false);
			}


			setupResources(addResource);
			setupSystems(addSystem, effectiveOnline);

			const intervalId = setupEntities(addEntity, effectiveOnline, config);
			setIsLoading(false);
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
		let cleanup = () => { };
		initializeGame().then(cleanupFn => {
			if (cleanupFn) {
				cleanup = cleanupFn;
			}
		});

		return () => {
			cleanup();
		}

	}, [auth, addEntity, addResource, addSystem, backEndUrl, initializeWorld])

	if (RUN_TEST_PAGE) {
		return <TestPage />;
	}
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
