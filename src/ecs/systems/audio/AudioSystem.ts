import { PlayBgm, PlaySoundEffect } from "@/ecs/components";
import { AudioServer } from "@/ecs/resources";
import { isNone, type System, unwrapOpt, World } from "@/types";


/**
 * Listens for "PlaySoundEffect" event components and plays
 * them using the AudioServer resource.
 */
export class AudioSystem implements System {
    update(world: World): void {
        const audioServerRes = world.getResource(AudioServer);
        if (isNone(audioServerRes)) return;
        const audioServer = unwrapOpt(audioServerRes);

        // Handle one-shot audio (SFX)
        const sfxQuery = world.queryWithEntity(PlaySoundEffect);
        for (const [entity, soundEffect] of sfxQuery) {
            audioServer.playSfx(soundEffect.handle);
            // remove element because it is an event component
            entity.removeComponent(PlaySoundEffect);
        }

        // Handle BGM
        const bgmQuery = world.queryWithEntity(PlayBgm);
        for (const [entity, bgm] of bgmQuery) {
            audioServer.playBgm(bgm.handle, bgm.loop);
            // remove element because it is an event component
            entity.removeComponent(PlayBgm);
        }

    }
}