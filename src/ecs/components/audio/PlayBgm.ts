import type { Component } from "@/types";

/**
 * An "event" component.
 * Add this to an entity to make the AudioSystem
 * play background music.
 */
export class PlayBgm implements Component {
    /** The asset handle (URL) of the music to play. */
    public handle: string;
    /** Whether the music should loop (default: true). */
    public loop: boolean;

    constructor(handle: string, loop: boolean = true) {
        this.handle = handle;
        this.loop = loop;
    }
}