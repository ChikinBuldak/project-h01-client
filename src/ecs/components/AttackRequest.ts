import type { Component } from "@/types";

/**
 * An "event" component.
 * The InputSystem adds this to the player entity when the
 * attack button is pressed. The CombatSystem reads it.
 */
export class AttackRequest implements Component {}