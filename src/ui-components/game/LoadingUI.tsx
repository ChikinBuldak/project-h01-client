import type { LoadingUiState } from "@/stores/ui.types";

const LoadingUI: React.FC<{ state: LoadingUiState }> = ({ state }) => {
  return (
    <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px' }}>
      <h1>Loading... {state.progress}%</h1>
      <p>{state.message}</p>
    </div>
  );
};

export default LoadingUI;