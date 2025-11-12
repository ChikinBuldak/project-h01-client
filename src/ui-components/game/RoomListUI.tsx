import { useUiStore } from "@/stores";
import { useState, type FC } from "react";
import type { MainMenuUiState } from '../../stores/ui.types';
import { getAllRooms } from "@/api/room-manager.api";
import { useQuery } from "@tanstack/react-query";


const RoomListUI: FC = () => {
    const { state, sendIntent } = useUiStore();
    const mainMenuState = state as MainMenuUiState;

    const handleBackToMainMenu = () => {
        sendIntent({ type: 'BackToMainMenu' });
    }

    const {
        data: rooms = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['rooms'],
        queryFn: async () => {
            const res = await getAllRooms();
            if (!res.ok) {
                throw res.error;
            }
            return res.value;
        },
        refetchInterval: (query) =>
            query.state.status === 'success' ? 3000 : false,
        refetchOnWindowFocus: (query) =>
            query.state.status !== 'error',
        retry: 1,

    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400">
                Loading rooms...
            </div>
        )
    }

    // Handle error state
    if (isError) {
        console.error("Failed to fetch rooms:", error);
        return (
            <div className="flex flex-col h-full p-4 space-y-4">
                <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <h3 className="text-lg font-semibold text-red-400">Error Loading Rooms</h3>
                    <p className="text-sm text-gray-500 max-w-xs truncate" title={error?.message}>
                        {error?.message || 'Please try again later.'}
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>

                <button
                    onClick={handleBackToMainMenu}
                    className="w-full px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Back
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Join a Room</h2>
                <button
                    className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Create Room
                </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-2 space-y-2">
                {rooms.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        No active rooms. Be the first to create one!
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div key={room.room_id}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                        >
                            <div>
                                <h3 className="font-semibold">{room.name}</h3>
                                <span className="text-sm text-gray-400">
                                    {room.number_of_members} / {room.max_capacity} players
                                </span>
                            </div>
                            <button
                                className="px-3 py-1 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                            >
                                Join
                            </button>
                        </div>
                    ))
                )
                }
            </div>
            <button
                onClick={handleBackToMainMenu}
                className="px-4 py-2 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
                Back
            </button>
        </div>
    )



};


export default RoomListUI;