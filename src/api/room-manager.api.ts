// src/api/room-manager.api.ts
// This file contains function to call the api related to room management.

import { err, ok, type Result } from "@/types";
import { zRoomPayloadSchema, type CreateRoomRequest, type RoomResponsePayload } from "@/types/room-manager.types";
import z from "zod";

const ROOM_MANAGER_URL = import.meta.env.VITE_DISCORD_BOT_URL || '';

type GeneralRequest = {
    type: 'general';
    userId: string;
}

type DiscordRequest = {
    type: 'discord';
    userId: string
    guildId: string;
    channelId: string;
}

type RoomCreateRequestType = GeneralRequest | DiscordRequest;

export function createNewRoom(type: RoomCreateRequestType, name: string = 'New Room', capacity: number = 2): CreateRoomRequest {
    let returnData: CreateRoomRequest;

    let createdAt = new Date();

    switch (type.type) {
        case 'general':
            const roomId = `general_${Math.random().toString(36).substring(2, 15)}`;
            returnData = {
                user_id: type.userId,
                room_id: {
                    type: 'general',
                    id: roomId,
                },
                name: name,
                created_at: createdAt,
                max_capacity: capacity,
            };
            break;
        case 'discord':
            returnData = {
                user_id: type.userId,
                room_id: {
                    type: 'discord',
                    guildId: type.guildId,
                    channelId: type.channelId,
                },
                name: name,
                created_at: createdAt,
                max_capacity: capacity,
            };
            break;
    }

    return returnData;
}

// export async function createRoom(request: CreateRoomRequest): Promise<Result<Response, Error>> {
//     try {
//         const roomId = createRoomIdString(request.room_id);

//         const payload = {
//             ...request,
//             room_id: roomId,
//         };

//         const response = await fetch(`${ROOM_MANAGER_URL}/rooms`, );

//     } catch (error) {
//         return err(new Error('Failed to create room: ' + (error as Error).message));
//     }
// }

export async function getAllRooms() : Promise<Result<RoomResponsePayload[], Error>> {
    try {
        const response = await fetch(`${ROOM_MANAGER_URL}/.proxy/api/activity/rooms`);

        if (!response.ok) {
            return err(new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`));
        };

        const data = await response.json();
        const zRoomArraySchema = z.array(zRoomPayloadSchema);
        
        const parse = await zRoomArraySchema.safeParseAsync(data);
        if (!parse.success) {
            return err(new Error(`Invalid room data format: ${parse.error.message}`));
        }

        return ok(parse.data);

    } catch (error) {
        return err(new Error('Failed to get rooms: ' + (error as Error).message));
    }
}