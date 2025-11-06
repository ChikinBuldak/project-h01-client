import { z } from "zod";
import type { Transform } from "@/ecs/components";


export type TransformState = Pick<Transform,  'position' | 'rotation'>;
// === BASE SCHEMAS ===
const zVector = z.object({
    x: z.number(),
    y: z.number(),
});
const zTransform: z.ZodType<Pick<Transform,  'position' | 'rotation'>> = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number()
  
});

// === CLIENT-TO-SERVER MESSAGES ===

export const zInputPayload = z.object({
    dx: z.number(),
    dy: z.number(), // This is 0 for platformer, but good to keep
    tick: z.number(),
    jump: z.boolean(),
    dodge: z.boolean(),
    attack: z.boolean()
});


export const zPlayerInput = z.object({
    type: z.literal('playerInput'),
    payload: zInputPayload,
});
/**
 * The full, authoritative physics state for a player.
 * Sent by the server during reconciliation.
 */
export const zPlayerPhysicsState = z.object({
    transform: z.object({
      position: zVector,
      rotation: z.number()
    }),
    velocity: zVector,
    isGrounded: z.boolean(),
});
/**
 * The server's main reconciliation packet for the local player.
*/
export const zPlayerStateMessage = z.object({
    type: z.literal("player_state"),
    tick: z.number(), // The input tick this state *acknowledges*
    state: zPlayerPhysicsState,
  });
  
  /**
   * A message for an entity we are just interpolating (not ourself).
  */
 export const zEntityStateMessage = z.object({
   type: z.literal("entity_state"),
   id: z.string(),
   tick: z.number(),
   state: zPlayerPhysicsState, // Can re-use the same state shape
  });

  /**
 * The "welcome packet" sent once when a player joins.
 * Tells the client its own ID, the server's current tick,
 * and the state of all other entities.
 */
export const zWorldInitMessage = z.object({
  type: z.literal("world_init"),
  /** The entity ID the server has assigned to you. */
  yourId: z.string(),
  /** The server's current tick. Use this to sync your game loop. */
  serverTick: z.number(),
  /** A list of all other entities currently in the game. */
  entities: z.array(z.object({
      id: z.string(),
      state: zPlayerPhysicsState, // Use the full physics state
  })),
});


  
  // Union schema for all possible client messages
  export const zClientMessage = z.discriminatedUnion("type", [
    zPlayerInput,
  ]);

  // --- Map Data ---
export const zMapObject = z.object({
    id: z.string(),
    position: zVector,
    width: z.number(),
    height: z.number(),
});
export const zMapLoadMessage = z.object({
    type: z.literal("map_load"),
    objects: z.array(zMapObject),
});
  
  // Infer TypeScript types from Zod schemas
  export type Input = z.infer<typeof zInputPayload>;
  export type PlayerInput = z.infer<typeof zPlayerInput>;
  export type ClientMessage = z.infer<typeof zClientMessage>;
  export type PlayerPhysicsState = z.infer<typeof zPlayerPhysicsState>;
  export type EntityStateMessage = z.infer<typeof zEntityStateMessage>;
  export type PlayerStateMessage = z.infer<typeof zPlayerStateMessage>;
  export type WorldInitMessage = z.infer<typeof zWorldInitMessage>;
  export type MapObject = z.infer<typeof zMapObject>;
  export type MapLoadMessage = z.infer<typeof zMapLoadMessage>;
  

// === SERVER-TO-CLIENT MESSAGES ===

const zPlayerJoined = z.object({
  type: z.literal("playerJoined"),
  payload: z.object({
    id: z.string(),
    state: zTransform,
  }),
});

const zPlayerLeft = z.object({
  type: z.literal("playerLeft"),
  payload: z.object({
    id: z.string(),
  }),
});

const zWorldState = z.object({
  type: z.literal("worldState"),
  payload: z.object({
    tick: z.number(),
    entities: z.array(
      z.object({
        id: z.string(),
        state: zTransform,
      })
    ),
  }),
});

const zReconciliation = z.object({
  type: z.literal("reconciliation"),
  payload: z.object({
    tick: z.number(),
    state: zTransform,
  }),
});

// Union schema for all possible server messages
export const zServerMessage = z.discriminatedUnion("type", [
    zWorldInitMessage,
    zPlayerStateMessage,
    zEntityStateMessage,
    zMapLoadMessage,
]);

// Infer TypeScript types from Zod schemas
export type PlayerJoined = z.infer<typeof zPlayerJoined>;
export type PlayerLeft = z.infer<typeof zPlayerLeft>;
export type WorldState = z.infer<typeof zWorldState>;
export type Reconciliation = z.infer<typeof zReconciliation>;
export type ServerMessage = z.infer<typeof zServerMessage>;

/**
 * Validates and parses an unknown message from the server using Zod.
 * @param data The unknown data (from JSON.parse())
 * @returns The strongly-typed ServerMessage, or null if invalid.
 */
export function parseServerMessage(data: unknown): z.ZodSafeParseResult<ServerMessage> {
  // Use Zod's safeParse to validate the data
    const result = zServerMessage.safeParse(data);
    if (!result.success) {
        console.error("Failed to parse server message:", result.error);
    }
    return result;
}

// Signalling server data

// PeerType enum (assuming it exists based on usage)
export const PeerType = z.enum(['player', 'server']);
export type PeerType = z.infer<typeof PeerType>;

// Base schemas for common fields
const baseRoomSchema = z.object({
  guild_id: z.string(),
  channel_id: z.string(),
});

const basePeerMessageSchema = baseRoomSchema.extend({
  from_peer: z.string(),
  to_peer: z.string(),
});

// Individual message schemas
export const JoinMessage = z.object({
  type: z.literal('join'),
  guild_id: z.string(),
  channel_id: z.string(),
  peer_type: PeerType,
  user_id: z.string(),
});

export const CreateOfferMessage = z.object({
  type: z.literal('create-offer'),
});

export const OfferMessage = basePeerMessageSchema.extend({
  type: z.literal('offer'),
  sdp: z.string(),
});

export const AnswerMessage = basePeerMessageSchema.extend({
  type: z.literal('answer'),
  sdp: z.string(),
});

export const IceCandidateMessage = basePeerMessageSchema.extend({
  type: z.literal('ice-candidate'),
  candidate: z.string(),
  sdp_mid: z.string().optional(),
  sdp_mline_index: z.number().int().nonnegative().optional(),
});

export const ChatMessage = basePeerMessageSchema.extend({
  type: z.literal('chat'),
  content: z.string(),
});

// Main SignalMessage union type
export const SignalMessage = z.discriminatedUnion('type', [
  JoinMessage,
  CreateOfferMessage,
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
  ChatMessage,
]);

export type SignalMessage = z.infer<typeof SignalMessage>;

// Individual type exports for convenience
export type JoinMessage = z.infer<typeof JoinMessage>;
export type CreateOfferMessage = z.infer<typeof CreateOfferMessage>;
export type OfferMessage = z.infer<typeof OfferMessage>;
export type AnswerMessage = z.infer<typeof AnswerMessage>;
export type IceCandidateMessage = z.infer<typeof IceCandidateMessage>;
export type ChatMessage = z.infer<typeof ChatMessage>;