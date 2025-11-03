import type { Component } from "@/types";

/**
 * A one-shot "event" component.
 * Add this to an entity to make the AudioSystem play a sound.
 * The AudioSystem will automatically remove this component after playing.
 */
export class PlaySoundEffect implements Component {
    /** The handle (URL) of the sound in the AudioServer. */
    public handle: string
    constructor(handle: string) {
        this.handle = handle;
    }
}
