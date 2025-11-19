import { useUiStore } from "@/stores/ui.store";
import MainMenuUI from "./MainMenuUI";
import LoadingUI from "./LoadingUI";
import InGameUI from "./InGameUI";
import WaitingRoomUI from "./WaitingRoomUI";

const GameUIManager: React.FC = () => {
    const state = useUiStore((s)=> s.state);

    switch (state.type) {
        case 'MainMenu':
            return <MainMenuUI state={state}/>;
        case 'Loading':
            return <LoadingUI state={state}/>;
        case 'InGame':
            return <InGameUI state={state}/>;
        case 'WaitingRoom':
            return <WaitingRoomUI state={state}/>;
        default:
            return null;
    }
}

export default GameUIManager;