import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { useWorldStore } from './stores/world.stores'
import {
	DomRenderSystem, InputSystem, InterpolationSystem,
	PlayerMovementSystem, ReconciliationSystem, PhysicsSystem,
	NetworkReceiveSystem
} from './ecs/systems'
import { Transform, NetworkStateBuffer, Mesh2D, DomMaterial } from './ecs/components'
import { InputManager } from './types/input'
import { isSome } from './types/option'
import { DiscordSDK, type IDiscordSDK } from '@discord/embedded-app-sdk'
import { CharacterFactory } from './ecs/entities/CharacterFactory'
import { WorldFactory } from './ecs/entities/WorldFactory'
import { Entity } from './types/ecs'
import { NetworkResource, Time } from './ecs/resources'
import { parseBoolean, setupDiscordSDK } from './utils';

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
	const backEndUrl = import.meta.env.VITE_BACKEND_URL;

	const setupDiscord = useCallback(() => {
		setupDiscordSDK(discordSdk, setAuth);
	}, []);
	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;

		const IS_ONLINE = parseBoolean(import.meta.env.VITE_ONLINE || '');

		console.log("INITIALIZING APP...");
		InputManager.initialize();
		initializeWorld();
		addResource(new Time());
		addSystem(new InputSystem());
		addSystem(new PlayerMovementSystem());
		addSystem(new DomRenderSystem());
		addSystem(new PhysicsSystem());

		if (IS_ONLINE) {
			console.log("Running in ONLINE mode.");
			if (backEndUrl !== '') addResource(new NetworkResource(backEndUrl as string));
			addSystem(new NetworkReceiveSystem());
			addSystem(new ReconciliationSystem());
			addSystem(new InterpolationSystem());
		} else {
			console.log("Running in OFFLINE mode.")
		}

		const playerWidth = 20;
		const playerHeight = 20;
		const localPlayer = CharacterFactory.createBlue({
			xPos: 860,
			yPos: 50,
			width: playerWidth,
			height: playerHeight,
			isPlayer: true
		})
		const remotePlayer = new Entity()
			.addComponent(new Transform(150, 50))
			.addComponent(new NetworkStateBuffer())
			.addComponent(new Mesh2D(playerWidth, playerHeight))
			.addComponent(new DomMaterial({
				className: 'remote-player',
				styles: { backgroundColor: 'firebrick' }
			}));
		const ground1 = WorldFactory.createGround({
			x: 860,
			y: 500,
			width: 960,
			height: 50
		})
		const ground2 = WorldFactory.createGround({
			x: 800,
			y: 200,
			width: 200,
			height: 30
		})

		addEntity(remotePlayer);
		addEntity(localPlayer);
		addEntity(ground1);
		addEntity(ground2);

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

		setupDiscord();

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}

			const { world } = useWorldStore.getState();
			const net = world.getResource(NetworkResource);
			if (isSome(net)) net.value.disconnect();
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
