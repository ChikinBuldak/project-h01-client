import { isErr, tryCatch, type Audio } from '@/types';
import type { Resource } from '../../types/ecs';
import { resource } from '@/utils/decorators/resource.decorator';

/**
 * A resource for handling audio player
 */
@resource("audioServer")
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
    public async preload(config: Audio) {
        const urls = collectAudioUrlsTyped(config);
        if (this.preloaded) return;
        console.log(`[AudioServer] Preloading ${urls.length} audio assets...`);

        const results = await Promise.allSettled(urls.map(url => this.load(url)));

        const failed = results
            .map((r, i) => (r.status === "rejected" ? urls[i] : null))
            .filter(Boolean);

        if (failed.length > 0) {
            console.warn(`[AudioServer] Some audio files failed to preload:`, failed);
        }

        this.preloaded = true;
        console.log("[AudioServer] Audio preload complete.");
    }

    private async load(url: string): Promise<void> {
        if (this.buffers.has(url) || !this.context) return;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${url} (${response.status})`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
                this.context!.decodeAudioData(arrayBuffer, resolve, reject);
            });

            this.buffers.set(url, audioBuffer);
        } catch (err) {
            console.warn(`[AudioServer] Could not load or decode ${url}:`, err);
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

    /**
     * Clears all loaded audio resources and stops all sounds.
     * Should be called when exiting an AppState (e.g., scene unload).
     */
    public async clear() {
        console.log("[AudioServer] Clearing all audio resources...");

        // Stop any playing sources
        this.stopBgm();

        // Disconnect gain nodes
        if (this.sfxGain) {
            this.sfxGain.disconnect();
            this.sfxGain = null;
        }
        if (this.bgmGain) {
            this.bgmGain.disconnect();
            this.bgmGain = null;
        }

        // Clear all buffers
        this.buffers.clear();
        this.preloaded = false;

        // Close audio context (frees system resources)
        if (this.context) {
            try {
                await this.context.close();
            } catch (err) {
                console.warn("[AudioServer] Error closing AudioContext:", err);
            }
            this.context = null;
        }

        console.log("[AudioServer] Audio resources cleared.");
    }

    /**
     * Soft clear:
     * Stops all currently playing audio but keeps preloaded buffers
     * and does NOT close the AudioContext.
     */
    public softClear() {
        console.log("[AudioServer] Performing soft clear...");

        // Stop currently playing audio
        this.stopBgm();

        // Disconnect any SFX still playing (if any exist)
        // We can't track SFX sources easily here unless we store them,
        // but we can temporarily mute all SFX channels.
        if (this.sfxGain && this.context) {
            this.sfxGain.gain.setValueAtTime(0, this.context.currentTime);
            setTimeout(() => {
                // Restore normal gain a moment later for future playback
                if (this.sfxGain && this.context) {
                    this.sfxGain.gain.setValueAtTime(1, this.context.currentTime);
                }
            }, 100);
        }

        console.log("[AudioServer] All active audio stopped (buffers preserved).");
    }
}

function collectAudioUrlsTyped<T extends Record<string, any>>(obj: T): string[] {
  return Object.values(obj).flatMap(v =>
    typeof v === "string" ? [v] : collectAudioUrlsTyped(v)
  );
}

declare module "@/utils/registry/resource.registry" {
    interface ResourceRegistry {
        audioServer: AudioServer;
    }
}