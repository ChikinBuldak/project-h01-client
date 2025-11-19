import type { EventECS } from "@/types";

type AudioSfx =  {type: "sfx"}
type AudioBGM = {type: "bgm", loop: boolean}
type AudioType = AudioSfx | AudioBGM

export default class AudioRequestEvent implements EventECS {
    public readonly handle: string;
    public readonly audio: AudioType;

    constructor(handle: string, type: AudioType) {
        this.handle = handle;
        this.audio = type;
    }
}