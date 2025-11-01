import type { Component } from "@/types";

/**
 * Defines the properties for a single animation state
 * (e.g., "idle", "run").
 */
interface AnimationClip {
    /** The 'y' index (row) of the sprite sheet for this animation. */
    row: number;
    /** The total number of frames in this row. */
    frameCount: number;
    /** The duration of each frame, in seconds. */
    frameDuration: number;
}

/**
 * Stores all animation data for an entity.
 * This is controlled by the AnimationSystem.
 */
export class AnimationController implements Component {
    /** A map of all available animation states. */
    public states: Map<string, AnimationClip>;
    
    /** The key of the currently active state (e.g., "idle"). */
    public currentState: string;
    
    /** The currently visible frame index (0, 1, 2, ...). */
    public currentFrame: number;
    
    /** A timer used to track frame duration. */
    public frameTimer: number;

    constructor(defaultState: string, states: Record<string, AnimationClip>) {
        this.states = new Map(Object.entries(states));
        this.currentState = defaultState;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
}