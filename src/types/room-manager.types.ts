import {z} from 'zod';

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
