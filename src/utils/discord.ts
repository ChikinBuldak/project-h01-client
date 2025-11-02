import { DiscordSDK, type IDiscordSDK } from "@discord/embedded-app-sdk";
import { isErr, tryCatchAsync } from "../types/result";
import type { Resource } from "@/types";
import { NetworkResource } from "@/ecs/resources";

export async function setupDiscordSDK(
  discordSdk: IDiscordSDK | null,
  setAuth: (auth: any) => void,
  addResource: (res: Resource) => void,
  backEndUrl: string | undefined
) {
  if (!discordSdk) {
    console.warn("Not in Discord iframe, running in standalone mode");
    if (backEndUrl) {
      addResource(new NetworkResource(backEndUrl));
    }
    return;
  }

  console.log("Waiting for Discord SDK to be ready...");
  const readyRes = await tryCatchAsync(async () => discordSdk.ready());
  if (isErr(readyRes)) {
    console.error("Error when calling ready():", readyRes.error);
    return;
  }
  console.log("Discord SDK is ready");

  // Authorize with Discord
  const authRes = await tryCatchAsync(
    async () =>
      await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "rpc.activities.write"],
      })
  );

  if (isErr(authRes)) {
    console.error("Error authorizing with Discord:", authRes.error);
    return;
  }

  const { code } = authRes.value;
  console.log("Authorization complete.");

  // Authenticate with the game server
  console.log("Authenticating with Discord...");
  const authenticationResult = await tryCatchAsync(
    async () => await discordSdk.commands.authenticate({ access_token: code })
  );
  if (isErr(authenticationResult)) {
    console.error("Error authenticating with Discord server:", authenticationResult.error);
    return;
  }

  setAuth(authenticationResult.value);
  console.log(`Authenticated as ${authenticationResult.value.user.username}`);

  // Set the activity
  console.log("Setting activity...");
  const setActivityRes = await tryCatchAsync(async () =>
    discordSdk.commands.setActivity({
      activity: {
        details: "Running the ECS demo",
        state: "Predicting and Interpolating",
        timestamps: { start: Date.now() },
        assets: {
          large_image: "imageku",
          large_text: "ECS Demo",
        },
      },
    })
  );

  if (isErr(setActivityRes)) {
    console.error("Error setting activity:", setActivityRes.error);
    return;
  }

  console.log("Activity set successfully.");
}
