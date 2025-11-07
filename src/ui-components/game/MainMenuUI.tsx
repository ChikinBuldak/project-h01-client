// src/ui-components/game/MainMenuUI.tsx

import { useUiStore } from "@/stores";
import type { MainMenuUiState } from "@/stores/ui.types";

const MainMenuUI: React.FC<{ state: MainMenuUiState }> = ({ state }) => {
    const sendIntent = useUiStore((s) => s.sendIntent);
    const onStartClick = () => {
        sendIntent('StartGame');
    };

    return (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px' }}>
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
            <p>Version: {state.version}</p>
        </div>
    )
}

export default MainMenuUI;