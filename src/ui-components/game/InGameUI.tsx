import { useUiStore, type InGameUiState } from "@/stores";

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const menuStyle: React.CSSProperties = {
    background: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minWidth: '300px',
    textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#222',
};

const InGameUI: React.FC<{ state: InGameUiState }> = ({ state }) => {
    const sendIntent = useUiStore((store) => store.sendIntent);

    function handleResume() {
        sendIntent({type: 'ResumeGame'});
    }

    function handleExit() {
        sendIntent({type: 'ExitToMenu'});
    }

    if (!state.isPaused) return null;

    // return a pause menu (this is not actually paused the game system, it just to give menu to exit the game)
    return (
        <div style={overlayStyle}>
            <div style={menuStyle}>
                <h2 style={{color: '#111'}}>Game Menu</h2>
                <button style={buttonStyle} onClick={handleResume}>
                    Resume
                </button>
                <button style={buttonStyle} onClick={handleExit}>
                    Exit to Main Menu
                </button>
            </div>
        </div>
    )
}

export default InGameUI;