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

    public frameWidth: number;
    public frameHeight: number;

    constructor(
        defaultState: string,
        states: Record<string, AnimationClip>,
        frameWidth: number,
        frameHeight: number
    ) {
        this.states = new Map(Object.entries(states));
        this.currentState = defaultState;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
    }

    public changeState(newState: string): boolean {
        // Don't restart the animation if it's already playing
        if (this.currentState === newState) {
            return false;
        }

        const clip = this.states.get(newState);
        if (clip) {
            this.currentState = newState;
            this.currentFrame = 0;
            this.frameTimer = 0;
            return true;
        }

        // New state doesn't exist in the map
        return false;
    }

    public tick(dt: number): void {
        const clip = this.states.get(this.currentState);
        if (!clip) {
            return; // No clip to play
        }

        // Add delta time to our frame timer
        this.frameTimer += dt;

        // Check if it's time to advance to the next frame
        if (this.frameTimer >= clip.frameDuration) {
            // Subtract duration (handles multiple frame skips if lagging)
            this.frameTimer -= clip.frameDuration;

            // Advance frame and loop
            this.currentFrame = (this.currentFrame + 1) % clip.frameCount;
        }
    }
}