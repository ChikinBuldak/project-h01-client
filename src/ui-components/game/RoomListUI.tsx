import { useUiStore, useWorldStore } from "@/stores";
import { createContext, useCallback, useContext, useState, type FC, type ReactNode } from "react";
import { getAllRooms } from "@/api/room-manager.api";
import { useQuery } from "@tanstack/react-query";
import type { AuthType } from "@/types/room-manager.types";

const RoomListUI: FC = () => {
    const { state, sendIntent } = useUiStore();
    const { auth } = useWorldStore();

    const [isCreateRoomOpen, setCreateRoom] = useState(false);

    const handleBackToMainMenu = () => {
        sendIntent({ type: 'BackToMainMenu' });
    }

    const openCreateRoom = () => {
        console.log(`Auth: ${auth}, isCreateRoomOpen: ${isCreateRoomOpen}`)
        console.log("[RoomUIList] Open Create Room menu")
        setCreateRoom(true);
    }

    const closeCreateRoom = () => {
        setCreateRoom(false);
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
        <div className="relative flex flex-col h-full p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Join a Room</h2>
                <button
                    className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={openCreateRoom}
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
                                <p> {room.room_id}</p>
                                <span className="text-sm text-gray-400">
                                    {room.number_of_members} / {room.max_capacity} players
                                </span>
                            </div>
                            <button
                                className="px-3 py-1 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                onClick={() => {
                                    sendIntent({
                                        type: 'JoinRoom',
                                        payload: { roomId: room.room_id },
                                    })
                                }}
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
            {isCreateRoomOpen && auth !== null && (
                <CreateRoomModal
                    auth={auth}
                    onClose={closeCreateRoom}
                />
            )}
        </div>
    )
};

function CreateRoomModal(props: { auth: AuthType, onClose: () => void }) {
    const [name, setName] = useState<string>('');
    const [capacity, setCapacity] = useState<number | null>(null);

    // validator state
    const [nameError, setNameError] = useState<string | null>(null);
    const [capacityError, setCapacityError] = useState<string | null>(null);

    const { sendIntent } = useUiStore();

    const validateName = (value: string) => {
        if (value.trim().length === 0) {
            setNameError("Room name cannot be empty.");
        } else {
            setNameError(null);
        }
        setName(value);
    };

    const validateCapacity = (value: string) => {
        const num = Number(value);

        if (value.trim().length === 0) {
            setCapacityError("Capacity is required.");
            setCapacity(null);
            return;
        }

        if (Number.isNaN(num)) {
            setCapacityError("Capacity must be a valid number.");
            setCapacity(null);
            return;
        }

        if (num < 1) {
            setCapacityError("Minimum capacity is 1.");
        } else if (num > 50) {
            setCapacityError("Maximum capacity allowed is 50.");
        } else {
            setCapacityError(null);
        }

        setCapacity(num);
    };

    const handleCreateNewRoom = () => {
        if (capacity === null) return;
        sendIntent({
            type: 'CreateRoom',
            payload: {
                name,
                capacity

            }
        })
    }


    return (
        <div className="flex flex-col items-center fixed inset-0 bg-teal-300/50 border rounded-lg border-black p-8">
            <div className="flex self-end cursor-pointer" onClick={props.onClose}>
                &times;
            </div>
            <div className="flex gap-y-2 justify-center flex-col">
                {/* Room name Label */}
                <label className="font-semibold text-gray-800">Room Name</label>
                <input
                    className="bg-white text-black border border-gray-400 rounded px-2 py-1"
                    value={name}
                    onChange={(e) => validateName(e.target.value)}
                />
                {nameError && (
                    <p className="text-red-600 text-sm">{nameError}</p>
                )}

                {/*Room capacity Label */}
                <label className="font-semibold text-gray-800 mt-3">Capacity</label>
                <input
                    className="bg-white text-black border border-gray-400 rounded px-2 py-1"
                    value={capacity ?? ""}
                    onChange={(e) => validateCapacity(e.target.value)}
                />
                {capacityError && (
                    <p className="text-red-600 text-sm">{capacityError}</p>
                )}
                <div
                    className="bg-teal-900 text-white border rounded-lg border-black cursor-pointer text-center"
                    onClick={handleCreateNewRoom}
                >
                    <h3>
                        Create

                    </h3>
                </div>
            </div>



        </div>
    )

}


export default RoomListUI;