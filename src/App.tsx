import { useEffect, useRef, useState } from 'react'
import './App.css'
import { useGameLoop } from './hooks/world.hooks'
import { generateRandomUserId, useWorldStore } from './stores/world.store'
import { DiscordSDK, type IDiscordSDK } from '@discord/embedded-app-sdk'
import { NetworkResource, type NetworkDiscordJoinData } from './ecs/resources'
import { parseBoolean, setupDiscordSDK } from './utils';
import { LoadingScene } from './ecs/scenes/LoadingScene'
import { ConfigResource } from './ecs/resources/ConfigResource'
import { AppStateResource } from './ecs/resources/state.resource'
import ErrorScene from './ecs/scenes/ErrorScene'

import { initialAppLoadTask, MainMenuScene } from './ecs/scenes'
import GameUIManager from './ui-components/game/GameUIManager'

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
	const { initializeWorld, addResource, setDiscordJoinData } = useWorldStore.getState();
	const initRef = useRef(false);
	const [auth, setAuth] = useState<{ user: { username: string } } | null>(null);
	const backEndUrl = import.meta.env.VITE_BACKEND_URL;
	const discordBotUrl = import.meta.env.VITE_DISCORD_BOT_URL;
	const waitingRoomUrl = import.meta.env.VITE_WAITING_ROOM_URL;

	useEffect(() => {
		if (RUN_TEST_PAGE) return;
		if (initRef.current) return;
		initRef.current = true;
		let effectiveOnline = false;

		const IS_ONLINE = parseBoolean(import.meta.env.VITE_ONLINE || '');
		console.log("IS_ONLINE =", IS_ONLINE)

		// Handle TRULY OFFLINE case (when VITE_ONLINE is false)
        if (!IS_ONLINE) {
            console.log('Running in TRULY OFFLINE mode.');
            setAuth({ user: { username: 'Offline' } });
            effectiveOnline = false;
            // Start the game in offline mode
            addResource(new ConfigResource(effectiveOnline));
            addResource(new AppStateResource(new LoadingScene(new MainMenuScene(), initialAppLoadTask)));
            return;
        }

        // Handle FULLY ONLINE case (IS_ONLINE=true AND discordSdk is available)
        if (discordSdk) {
            // We are online and in the iframe. Start the auth process.
            async function authenticate() {
                console.log('Starting Discord authentication...');
                const authResult = await setupDiscordSDK(
                    discordSdk,
                    backEndUrl,
                    discordBotUrl
                );
                let joinData: NetworkDiscordJoinData;
                if (authResult) {
                    console.log('Discord auth success. Running in FULL ONLINE mode.');
                    setAuth(authResult.auth);
                    joinData = authResult.joinData;
                    addResource(new NetworkResource(backEndUrl, waitingRoomUrl, joinData));
					setDiscordJoinData(joinData);
                    effectiveOnline = true;
                } else {
                    console.warn('Discord SDK setup failed. Running in SEMI-OFFLINE mode.');
                    let thisJoinData = {
                        userId: generateRandomUserId(),
                    };
                    addResource(new NetworkResource(backEndUrl, waitingRoomUrl, thisJoinData));
                    setAuth({ user: { username: 'Offline' } });
                    effectiveOnline = false;
                }
                addResource(new ConfigResource(effectiveOnline));
                addResource(new AppStateResource(new LoadingScene(new MainMenuScene(), initialAppLoadTask)));
            }

            authenticate().catch((err) => {
                console.error('Critical error during authentication:', err);
                addResource(new ConfigResource(false));
                addResource(
                    new AppStateResource(
                        new LoadingScene(
                            new ErrorScene(err.message || 'An unknown authentication error occurred'),
                            undefined, // No task
                            'Error...'
                        )
                    )
                );
                setAuth({ user: { username: 'Offline' } }); // Set auth to unblock
            });

        // 3. Handle SEMI-ONLINE case (IS_ONLINE=true BUT no discordSdk)
        } else {
            console.warn('Running in SEMI-OFFLINE mode (IS_ONLINE=true, but no Discord SDK).');
            // This logic is copied from your `authenticate` function's `else` block
            const joinData = {
				// generate random id
                userId: generateRandomUserId()
            };
            addResource(new NetworkResource(backEndUrl, waitingRoomUrl,  joinData));
            setAuth({ user: { username: 'Offline' } });
            effectiveOnline = false;
            
            // Add resources and start LoadingState
            addResource(new ConfigResource(effectiveOnline));
            addResource(new AppStateResource(new LoadingScene(new MainMenuScene(), initialAppLoadTask)));
        }

	}, [addResource, backEndUrl, discordBotUrl, initializeWorld])

	if (RUN_TEST_PAGE) {
		return <TestPage />;
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
			<GameUIManager />
			<div id="world-container">
				<div id="world"></div>
			</div>
		</>
	)
}

export default App
