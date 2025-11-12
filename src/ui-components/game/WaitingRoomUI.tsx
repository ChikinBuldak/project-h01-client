import { useWaitingRoomSocket } from "@/hooks/waiting-room.hooks";
import { useUiStore, type WaitingRoomUiState } from "@/stores";
import { useWaitingRoomStore } from "@/stores/waiting-room.store";
import { useEffect, type FC } from "react";
import { shallow } from "zustand/shallow";

const WaitingRoomUI: FC<{ state: WaitingRoomUiState }> = ({ state }) => {

    const { currentRoom, isConnecting, isConnected, error } =
        useWaitingRoomStore();


    const { sendIntent } = useUiStore();

    const handleLeave = () => {
        // Let ECS handle cleanup & transition
        sendIntent({ type: "LeaveRoom" });
    };
    const handleStartGame = () => {

    }

    const renderStatus = () => {
        if (error) {
            return <p className="text-red-400">Error: {error}</p>;
        }
        if (isConnecting) {
            return <p className="text-yellow-400">Connecting...</p>;
        }
        if (isConnected && !currentRoom) {
            return <p className="text-yellow-400">Joining room...</p>;
        }
        if (isConnected && currentRoom) {
            return <p className="text-green-400">Connected!</p>;
        }
        console.log(`isConnnected: ${isConnected}, currentRoom: ${currentRoom}`)
        return <p className="text-gray-500">Disconnected</p>;
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-4 text-white">
            <h2 className="text-xl font-bold">
                Room: {currentRoom?.name || 'Loading...'}
            </h2>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto bg-gray-800 rounded-lg">
                <h3 className="font-semibold">
                    Players ({currentRoom?.members.length || 0} /{' '}
                    {currentRoom?.max_capacity || '...'})
                </h3>
                <div className="p-3 text-center bg-gray-700 rounded-lg">
                    {renderStatus()}
                </div>

                {currentRoom?.members.map((memberId) => (
                    <div
                        key={memberId}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                        <span>Player {memberId}</span>
                        {memberId === currentRoom.owner_id && (
                            <span className="text-xs font-semibold text-yellow-400">
                                (Host)
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex space-x-2">
                <button
                    onClick={handleLeave}
                    className="w-full px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                    Leave
                </button>
                {/* TODO: Add logic to show this only for the host */}
                <button
                    onClick={handleStartGame}
                    className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Start Game
                </button>
            </div>
        </div>
        // <div>
        //     Lorem ipsum
        // </div>
    );
}

export default WaitingRoomUI;