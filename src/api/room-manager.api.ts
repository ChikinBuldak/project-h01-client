// src/api/room-manager.api.ts
// This file contains function to call the api related to room management.

import { err, ok, type Result } from "@/types";
import {
    CreateRoomResponseSchema,
    JoinRoomResponseSchema,
    zRoomPayloadSchema,
    type AuthType,
    type CreateRoomRequest,
    type CreateRoomResponse,
    type JoinRoomRequest,
    type JoinRoomResponse,
    type RoomResponsePayload
} from "@/types/room-manager.types";
import z from "zod";
import { type YourAverageHTTPResponse, YourAverageHttpResponseFactory, type HTTPResponseError, type RestApiError,RestApiErrorSchema } from '../types/http';

const ROOM_MANAGER_URL = import.meta.env.VITE_DISCORD_BOT_URL || '';


export function createNewRoom(type: AuthType, name: string = 'New Room', capacity: number = 2): CreateRoomRequest {
    const returnData: CreateRoomRequest = {
        type: 'create_room',
        name,
        max_capacity: capacity,
        auth: type
    };

    return returnData;
}

export async function getAllRooms(): Promise<Result<RoomResponsePayload[], Error>> {
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

export const RoomManagerAPIHandler = {
    getAllRooms() {
        return getAllRooms();
    },
    /**
     * @deprecated
     * @param req 
     * @returns 
     */
    async createRoom(req: CreateRoomRequest): Promise<Result<YourAverageHTTPResponse<CreateRoomResponse>, HTTPResponseError>> {
        try {
            const response = await fetch(`${ROOM_MANAGER_URL}/.proxy/api/activity/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req),
            });

            if (!response.ok) {
                let backendError: RestApiError | null = null;

                try {
                    const json = await response.json();
                    const parse = RestApiErrorSchema.safeParse(json);
                    if (parse.success) backendError = parse.data
                } catch (_) { }

                return err({
                    statusCode: backendError?.code ?? response.status,
                    message: backendError?.message ??
                        `Failed to create room: ${response.status} ${response.statusText}`
                });
            }

            const data = await response.json();
            const parse = await CreateRoomResponseSchema.safeParseAsync(data);
            if (!parse.success) {
                return err({
                    statusCode: 400,
                    message: `Invalid room response format: ${parse.error.message}`
                });
            }

            const responseData = YourAverageHttpResponseFactory.new(
                200,
                'room successfully created',
                parse.data
            )

            return ok(responseData);
        } catch (error) {
            return err({
                statusCode: 500,
                message: `Failed to create room: ${(error as Error).message}`
            });
        }
    },
    /**
     * @deprecated
     * @param req 
     * @returns 
     */
    async joinRoom(req: JoinRoomRequest): Promise<Result<YourAverageHTTPResponse<JoinRoomResponse>, HTTPResponseError>> {
        try {
            const response = await fetch(`${ROOM_MANAGER_URL}/.proxy/api/activity/rooms/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req)
            })

            if (!response.ok) {
                let backendError: RestApiError | null = null;

                try {
                    const json = await response.json();
                    const parse = RestApiErrorSchema.safeParse(json);
                    if (parse.success) backendError = parse.data;
                } catch (_) { }

                return err({
                    statusCode: backendError?.code ?? response.status,
                    message: backendError?.message ??
                        `Failed to join room: ${response.status} ${response.statusText}`
                });
            }

            const data = await response.json();
            const parse = await JoinRoomResponseSchema.safeParseAsync(data);
            if (!parse.success) return err({
                statusCode: 400,
                message: `Invalid room response format: ${parse.error.message}`
            });

            const responseData: YourAverageHTTPResponse<JoinRoomResponse> = YourAverageHttpResponseFactory.new(
                200, 'success', parse.data
            );

            return ok(responseData);

        } catch (e) {
            return err({
                statusCode: 500,
                message: `Failed to join room: ${(e as Error).message}`
            });
        }
    }
}