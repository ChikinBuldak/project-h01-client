import { isErr, tryCatch, tryCatchAsync } from '@/types';
import type { Resource } from '../../types/ecs';
import { registerResource } from '@/utils/registry/resource.registry';

/**
 * A resource for handling audio player
 */
export class AudioServer implements Resource {
    private context: AudioContext | null = null;
    private buffers = new Map<string, AudioBuffer>();
    private preloaded = false;

    /** Master gain node for Sound Effects */
    private sfxGain: GainNode | null = null;
    /** Master gain node for Background Music */
    private bgmGain: GainNode | null = null;
    /** A reference to the currently playing BGM source */
    private bgmSource: AudioBufferSourceNode | null = null;

    constructor() {
        const res = tryCatch(() => new (window.AudioContext || (window as any).webkitAudioContext)())
        if (isErr(res)) {
            console.error("[AudioServer] Web Audio API is not supported in this browser.", res.error);
            return;
        }
        this.context = res.value;

        this.sfxGain = this.context.createGain();
        this.bgmGain = this.context.createGain();

        this.sfxGain.connect(this.context.destination);
        this.bgmGain.connect(this.context.destination);
    }

    /**
     * Call this in response to a user gesture (e.g., a "click to start" button)
     * to enable audio playback in all browsers.
     */
    public unlockAudio() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    /**
     * Loads an array of audio file URLs and decodes them into AudioBuffers.
     * @param urls A list of asset URLs to preload (e.g., "/assets/jump.wav").
     */
    public async preload(urls: string[]) {
        if (this.preloaded) return;
        console.log(`[AudioServer] Preloading ${urls.length} audio assets...`);
        const promises = urls.map(url => this.load(url));
        await Promise.all(promises);
        this.preloaded = true;
        console.log("[AudioServer] Audio preload complete.");
    }

    private async load(url: string): Promise<void> {
        if (this.buffers.has(url) || !this.context) return;

        const res = await tryCatchAsync(async () => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${url}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
            return audioBuffer;
        });

        if (isErr(res)) {
            console.error(res.error);
        } else {
            this.buffers.set(url, res.value);
        }
    }

    public playSfx(handle: string) {
        if (!this.context || !this.sfxGain) return;

        const buffer = this.buffers.get(handle);
        if (!buffer) {
            console.warn(`[AudioServer] Tried to play SFX, but buffer not found: ${handle}`);
            return;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(0);
    }

    /**
     * Plays or loops background music. Stops any previously playing BGM.
     * @param handle The asset handle (URL) of the music to play.
     * @param loop Whether the music should loop (default: true).
     */
    public playBgm(handle: string, loop: boolean = true) {
        if (!this.context || !this.bgmGain) return;

        // Stop any playing BGM
        this.stopBgm();

        const buffer = this.buffers.get(handle);
        if (!buffer) {
            console.warn(`[AudioServer] Tried to play BGM, but buffer not found: ${handle}`);
            return;
        }

        this.bgmSource = this.context.createBufferSource();
        this.bgmSource.buffer = buffer;
        this.bgmSource.loop = loop;
        this.bgmSource.connect(this.bgmGain);
        this.bgmSource.start(0);
    }

    public stopBgm() {
        if (this.bgmSource) {
            this.bgmSource.stop(0);
            this.bgmSource.disconnect();
            this.bgmSource = null;
        }
    }

    /**
     * Sets the volume for sound effects.
     * @param volume A value from 0.0 (silent) to 1.0 (full).
     */
    public setSfxVolume(volume: number) {
        if (this.sfxGain && this.context) {
            this.sfxGain.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }

    /**
     * Sets the volume for background music.
     * @param volume A value from 0.0 (silent) to 1.0 (full).
     */
    public setBgmVolume(volume: number) {
        if (this.bgmGain && this.context) {
            this.bgmGain.gain.setValueAtTime(volume, this.context.currentTime);
        }
    }
}

registerResource("audioServer", AudioServer);
declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    audioServer: AudioServer;
  }
}