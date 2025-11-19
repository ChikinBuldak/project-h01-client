import { useWorldStore } from "@/stores";
import type { System, SystemResourcePartial, World } from "@/types";

/**
 * This is a system to sync UI state with the ECS state
 */
export class GlobalUiSystem implements System {
    update(_world: World, {networkResource}: SystemResourcePartial): void {
        if (networkResource)  {
            // update user id to world store if the user Id inside Auth is changing
            const {auth, setAuth} = useWorldStore.getState();

            if (auth) {
                const isTypeSame = networkResource.lobbyAuth.type === auth.type;
                const isUserIDSame = networkResource.lobbyAuth.user_id === auth.user_id;

                // check if it is discord type
                if (!isTypeSame || !isUserIDSame) {
                    setAuth(networkResource.lobbyAuth);
                } else if (networkResource.lobbyAuth.type === 'Discord') {
                    // check guild id and channel id
                    switch (auth.type) {
                        case 'Discord':
                            const isGuildSame = networkResource.lobbyAuth.guild_id === auth.guild_id;
                            const isChannelSame = networkResource.lobbyAuth.channel_id === auth.channel_id;
                            if (!isGuildSame || !isChannelSame) {
                                setAuth(networkResource.lobbyAuth);
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        
    }

}