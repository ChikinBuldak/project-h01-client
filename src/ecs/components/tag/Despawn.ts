import type { Component } from "@/types";

/**
 * A "tag" component.
 * Add this to any entity to mark it for deletion at the
 * end of the frame by the GarbageCollectorSystem.
 */
export class Despawn implements Component {}