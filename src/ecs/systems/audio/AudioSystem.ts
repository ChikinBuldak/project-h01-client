import { PlayBgm, PlaySoundEffect } from "@/ecs/components";
import AudioRequestEvent from "@/ecs/events/AudioRequestEvent";
import { AudioServer } from "@/ecs/resources";
import { isNone, type System, type SystemResourcePartial, unwrapOpt, World } from "@/types";


/**
 * Listens for "PlaySoundEffect" event components and plays
 * them using the AudioServer resource.
 */
export class AudioSystem implements System {
    update(world: World, {audioServer}: SystemResourcePartial): void {
        if (!audioServer) return;

        // Read audio events
        const events = world.readEvents(AudioRequestEvent);
        // console.log("Read audio events...");    
        for (const event of events) {
            console.log(event);
            switch (event.audio.type) {
                case "sfx":
                    audioServer.playSfx(event.handle);
                    break;
                case "bgm":
                    audioServer.playBgm(event.handle, event.audio.loop);
                    break;

            }
        }
    }
}