import { z } from "zod";
import type { Transform } from "../ecs/components/Transform";


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