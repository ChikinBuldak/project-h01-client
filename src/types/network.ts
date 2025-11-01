import { z } from "zod";
import type { Transform } from "../ecs/components/Transform";


export type TransformState = Pick<Transform,  'position' | 'rotation'>;
// === BASE SCHEMAS ===
const zTransform: z.ZodType<Pick<Transform,  'position' | 'rotation'>> = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number()
  
});

// === CLIENT-TO-SERVER MESSAGES ===

export const zPlayerInput = z.object({
  type: z.literal("playerInput"),
  payload: z.object({
    tick: z.number(),
    dx: z.number(),
    dy: z.number(),
    jump: z.boolean(),
  }),
});

// Union schema for all possible client messages
export const zClientMessage = z.discriminatedUnion("type", [
  zPlayerInput,
]);

// Infer TypeScript types from Zod schemas
export type PlayerInput = z.infer<typeof zPlayerInput>;
export type ClientMessage = z.infer<typeof zClientMessage>;


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
  zPlayerJoined,
  zPlayerLeft,
  zWorldState,
  zReconciliation,
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
export function parseServerMessage(data: unknown): ServerMessage | null {
  // Use Zod's safeParse to validate the data
  const result = zServerMessage.safeParse(data);

  if (result.success) {
    return result.data;
  } else {
    console.error("[WS Parser] Invalid message received:", result.error.issues);
    return null;
  }
}