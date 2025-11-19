// src/ui-components/game/MainMenuUI.tsx

import { useUiStore } from "@/stores";
import type { MainMenuUiState } from "@/stores/ui.types";
import RoomListUI from "./RoomListUI";

const MainMenuUI: React.FC<{ state: MainMenuUiState }> = ({ state }) => {
    const sendIntent = useUiStore((s) => s.sendIntent);
    const onStartClick = () => {
        sendIntent({ type: 'Start' });
    };

    const onSearchForRoomsClick = () => {
        sendIntent({ type: 'SearchForRooms' });
    }
    switch (state.currentSection) {
        case 'Main':
            return (
                <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <h1>My Game</h1>
                    <div
                        onClick={onStartClick}
                        style={{
                            background: state.selectedButton === 'Start' ? 'blue' : 'grey',
                            cursor: 'pointer',
                            padding: '10px 20px',
                            display: 'inline-block',
                            borderRadius: '5px',
                            userSelect: 'none',
                        }}
                    >
                        Start Game
                    </div>
                    <div
                        onClick={onSearchForRoomsClick}
                        style={{
                            background: state.selectedButton === 'SearchForRooms' ? 'blue' : 'grey',
                            cursor: 'pointer',
                            padding: '10px 20px',
                            display: 'inline-block',
                            borderRadius: '5px',
                            userSelect: 'none',
                        }}
                    >
                        Join Room
                    </div>
                    <p>Version: {state.version}</p>
                </div>
            )
        case 'RoomSearch':
            return (
                <RoomListUI />
            );
    }

}

export default MainMenuUI;