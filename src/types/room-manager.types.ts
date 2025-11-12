import { z } from 'zod';

export const RoomInfoSchema = z.object({
    id: z.string(),
    guild_id: z.string().optional(),
    channel_id: z.string().optional(),
    name: z.string(),
    created_at: z.date(),
    max_capacity: z.number().min(1).max(100),
})

export const RoomIdPatterns = {
    GENERAL: /^general_[a-zA-Z0-9]+$/,
    DISCORD: /^discord_\d+-\d+$/,
};

export const RoomIdSchema = z.object({
    type: z.enum(['general', 'discord']),
    /** ID that only valid for general room type */
    id: z.string().optional(),
    guildId: z.string().optional(),
    channelId: z.string().optional(),
});

export type RoomInfo = z.infer<typeof RoomInfoSchema>;
export type RoomId = z.infer<typeof RoomIdSchema>;

// Parser for room creation requests (if needed)
export const CreateRoomRequestSchema = z.object({
    user_id: z.string(),
    room_id: RoomIdSchema,
    name: z.string(),
    created_at: z.coerce.date(),
    max_capacity: z.number().min(1).max(100),
});


export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

// ===== Client -> Room Manager API Types =====

export const CreateRoomWSPayloadSchema = z.object({
    type: z.literal('create_room'),
    payload: CreateRoomRequestSchema,
})

export type CreateRoomWSPayload = z.infer<typeof CreateRoomWSPayloadSchema>;

const JoinRoomSchema = z.object({
    room_id: z.string(),
});

export const JoinRoomPayloadSchema = z.object({
    type: z.literal('join_room'),
    payload: JoinRoomSchema,
})

export type JoinRoomPayload = z.infer<typeof JoinRoomPayloadSchema>;

export const LeaveRoomPayloadSchema = z.object({
    type: z.literal('leave_room'),
    payload: JoinRoomSchema,
})

export const PingPayloadSchema = z.object({
    type: z.literal('ping'),
});

export const RoomManagerPayloadSchema = z.discriminatedUnion('type', [
    CreateRoomWSPayloadSchema,
    JoinRoomPayloadSchema,
    LeaveRoomPayloadSchema,
    PingPayloadSchema,
]);
export type RoomManagerPayload = z.infer<typeof RoomManagerPayloadSchema>;

export const zRoomPayloadSchema = z.object({
    room_id: z.string(),
    name: z.string(),
    owner_id: z.string(),
    created_at: z.coerce.date(),
    max_capacity: z.number(),
    number_of_members: z.number(),
})

export type RoomResponsePayload = z.infer<typeof zRoomPayloadSchema>;

// ====== Waiting Room related types =========

export const ServerSuccessCode = {
    Authenticated: 1,
    RoomCreated: 2,
    UserJoined: 3,
    UserLeft: 4,
    UserKicked: 5,
} as const;

export const ServerSuccessCodeSchema = z.enum(
    Object.freeze(ServerSuccessCode)
)


export const zRoomStateSchema = z.object({
    room_id: z.string(),
    name: z.string(),
    owner_id: z.string(),
    created_at: z.coerce.date(),
    max_capacity: z.number(),
    members: z.array(z.string()),
});

export type RoomState = z.infer<typeof zRoomStateSchema>;

export type WsAuthRequest =
    | {
        type: 'Discord',
        user_id: string,
        guild_id: string,
        channel_id: string,
    }
    | {
        type: 'General',
        user_id: string
    };

export interface WsCreateRoomRequest {
    user_id: string;
    room_id: string;
    name: string;
    created_at: string; // ISO 8601 string
    max_capacity: number;
}

export const ClientMessageSchema = RoomManagerPayloadSchema;

export type ClientMessage = RoomManagerPayload;

export const ServerMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('success'),
        message: z.string(),
        code: ServerSuccessCodeSchema,
    }),
    z.object({
        type: z.literal('error'),
        message: z.string(),
    }),
    zRoomStateSchema.extend({
        type: z.literal("room_state"),
    }),
    z.object({
        type: z.literal('pong'),
    }),
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/// CLIENT MESSAGE

// Based on ClientMessage from types.rs
export const LobbyClientMessageSchema = z.union([
    z.object({
        type: z.literal('create_room'),
        user_id: z.string(),
        room_id: z.string(),
        name: z.string(),
        created_at: z.string(), // ISO string
        max_capacity: z.number(),
    }),
    z.object({
        type: z.literal('join_room'),
        room_id: z.string(),
    }),
    z.object({
        type: z.literal('leave_room'),
        room_id: z.string(),
    }),
    z.object({
        type: z.literal('ping'),
    })
]);
export type LobbyClientMessage = z.infer<typeof LobbyClientMessageSchema>;

