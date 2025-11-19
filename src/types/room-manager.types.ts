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


// ===== Client -> Room Manager API Types =====


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

export const DiscordAuthSchema = z.object({
    type: z.literal('Discord'),
    user_id: z.string(),
    guild_id: z.string(),
    channel_id: z.string()
})

export const GeneralAuthSchema = z.object({
    type: z.literal('General'),
    user_id: z.string()
})
export const AuthSchema = z.discriminatedUnion('type', [
    DiscordAuthSchema,
    GeneralAuthSchema
]);

export type AuthType = z.infer<typeof AuthSchema>;

export interface WsCreateRoomRequest {
    name: string;
    auth: AuthType;
    max_capacity: number;
}

export const RoomClientMessageSchema = RoomManagerPayloadSchema;

export type RoomClientMessage = RoomManagerPayload;

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
    z.object({
        type: z.literal('game_started'),
        room_id: z.string()
    })
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/// CLIENT MESSAGE

// Based on ClientMessage from types.rs in the waiting room server
export const LobbyClientConnectSchema = z.object({
    type: z.literal('connect'),
    auth: AuthSchema,
    room_id: z.string()
});

export type LobbyClientConnect = z.infer<typeof LobbyClientConnectSchema>;

export const LobbyClientCreateRoomSchema = z.object({
    type: z.literal('create_room'),
    auth: AuthSchema,
    name: z.string(),
    max_capacity: z.number()
});
export type LobbyClientCreateRoom = z.infer<typeof LobbyClientCreateRoomSchema>;

export const LobbyClientLeaveRoomSchema = z.object({
    type: z.literal('leave_room'),
    room_id: z.string(),
});
export type LobbyClientLeaveRoom = z.infer<typeof LobbyClientLeaveRoomSchema>;

export const LobbyClientStartGameSchema = z.object({
    type: z.literal('start_game')
});
export type LobbyClientStartGame = z.infer<typeof LobbyClientStartGameSchema>;

export const LobbyClientPingSchema = z.object({
    type: z.literal('ping')
});
export type LobbyClientPing = z.infer<typeof LobbyClientPingSchema>

export const LobbyClientMessageSchema = z.union([
    LobbyClientConnectSchema,
    LobbyClientCreateRoomSchema,
    LobbyClientLeaveRoomSchema,
    LobbyClientPingSchema,
    LobbyClientStartGameSchema
]);
export type LobbyClientMessage = z.infer<typeof LobbyClientMessageSchema>;

// ==================================================
// ============== REST API RESPONSE =================
// ==================================================

export const CreateRoomRequestSchema = z.object({
    type: z.literal('create_room'),
    name: z.string(),
    max_capacity: z.number().min(1).max(100),
    auth: AuthSchema
});
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const CreateRoomResponseSchema = z.object({
    type: z.literal('create_room'),
    owner_id: z.string(),
    room_id: z.string(),
    name: z.string(),
    created_at: z.coerce.date(),
    max_capacity: z.number(),
});

export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>;

export const JoinRoomResponseSchema = z.object({
    type: z.literal('join_room'),
    room_id: z.string(),
    owner_id: z.string(),
    name: z.string(),
    created_at: z.coerce.date(),
    max_capacity: z.number(),
    members: z.array(z.string())
});

export type JoinRoomResponse = z.infer<typeof JoinRoomResponseSchema>;

export const JoinRoomRequestSchema = z.object({
    auth: AuthSchema,
    room_id: z.string()
})

export type JoinRoomRequest = z.infer<typeof JoinRoomRequestSchema>