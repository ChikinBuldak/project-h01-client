import { DiscordSDK, type IDiscordSDK } from "@discord/embedded-app-sdk";
import { isErr, tryCatchAsync, unwrapRes } from '../types/result';

export async function setupDiscordSDK(
  discordSdk: IDiscordSDK | null,
  backEndUrl: string | undefined,
  discordBotUrl?: string | undefined
) {

  if (!discordSdk) {
    if (!discordSdk) {
      // This case should not be hit if frameId check in App.tsx is working
      console.warn("discordSdk is null, re-initializing. This might be an error.");
      const queryParams = new URLSearchParams(window.location.search);
      if (queryParams.get('frame_id')) {
        discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
      } else {
        console.error("Cannot init SDK, not in iframe.");
        return null;
      }
    }
  }
  if (!discordBotUrl || !backEndUrl) {
    console.warn("Not in Discord iframe, running in standalone mode");
    return null;
  }

  try {
    console.log("Waiting for Discord SDK to be ready...");
    // Add origin validation
    const currentOrigin = window.location.origin;
    if (currentOrigin === 'null' || currentOrigin === 'file://') {
      console.warn('Running with null origin, Discord features may be limited');
      // You might want to return null here or handle differently
    }
    const readyRes = await tryCatchAsync(async () => discordSdk.ready());
    if (readyRes.isErr()) {
      console.error("Error when calling ready():", readyRes.error);
      return null;
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
          scope: ["identify",
            "rpc.activities.write",
            "applications.commands",
            "rpc",
            "activities.read",
            "activities.write"
          ],
        })
    );

    if (isErr(authRes)) {
      console.error("Error authorizing with Discord:", authRes.error);
      return null;
    }

    const { code } = authRes.value;
    console.log("Authorization complete.");



    const accessTokenRes = await tryCatchAsync(async () => {
      // Get access token
      const response = await fetch(`${discordBotUrl}/.proxy/api/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      return await response.json() as { access_token: string };
    });

    if (isErr(accessTokenRes)) {
      console.error("Error getting Discord access token: ", accessTokenRes.error);
      return null;
    }

    const { access_token } = unwrapRes(accessTokenRes);

    // Authenticate with the game server
    console.log("Authenticating with Discord...");
    const authenticationResult = await tryCatchAsync(
      async () => await discordSdk.commands.authenticate({ access_token })
    );
    if (isErr(authenticationResult)) {
      console.error("Error authenticating with Discord server:", authenticationResult.error);
      return;
    }

    const auth = authenticationResult.value;
    console.log(`Authenticated as ${authenticationResult.value.user.username}`);

    const guildId = discordSdk.guildId;
    const channelId = discordSdk.channelId;
    const userId = auth.user.id;

    if (!guildId || !channelId || !userId) {
      console.error("Missing guildId, channelId, or userId after auth.");
      return null; // Fail
    }
    const joinData = { guildId, channelId, userId };
    console.log("NetworkResource created and added to world.");

    // Set the activity
    console.log("Setting activity...");
    const setActivityRes = await tryCatchAsync(async () =>
      discordSdk.commands.setActivity({
        activity: {
          details: "Running the ECS demo",
          state: "Predicting and Interpolating",
          timestamps: { start: Date.now() },
          assets: {
            // large_image: "imageku",
            large_text: "ECS Demo",
          },
        },
      })
    );

    if (isErr(setActivityRes)) {
      // Don't fail the whole setup for this, just warn
      console.warn("Error setting activity:", setActivityRes.error);
    } else {
      console.log("Activity set successfully.");
    }

    console.log("Activity set successfully.");

    return { auth, joinData };
  } catch (error) {
    console.error("A critical error occurred during Discord setup:", error);
    return null;
  }
}
