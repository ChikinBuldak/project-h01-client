import { useUiStore } from "@/stores/ui.store";
import MainMenuUI from "./MainMenuUI";
import LoadingUI from "./LoadingUI";

const GameUIManager: React.FC = () => {
    const state = useUiStore((s)=> s.state);

    switch (state.type) {
        case 'MainMenu':
            return <MainMenuUI state={state}/>;
        case 'Loading':
            return <LoadingUI state={state}/>;
        default:
            return <></> // Unhandled case would be no UI at all
    }
}

export default GameUIManager;