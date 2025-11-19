import { NetworkResource} from '../../src/ecs/resources';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let network: NetworkResource;
const SIGNALING_URL = "ws://127.0.0.1:3000/ws";
const WAITING_ROOM_URL = "ws://127.0.0.1:3001/ws";

describe("NetworkResource <-> Signaling Server Integration", () => {
    beforeAll(async () => {
        const joinData = {
            userId: "general-12345678",
        };

        network = new NetworkResource(SIGNALING_URL, WAITING_ROOM_URL, joinData);

        network.connectToSignalingServer();

        // Wait until connected
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout connecting")), 5000);
            const check = setInterval(() => {
                if (!network.signalingSocket || !network.signalingSocket.some) {
                    reject(new Error("None value of _signalingSocket"));
                    return;
                }

                if (network.signalingSocket.value.readyState === WebSocket.OPEN) {
                    clearInterval(check);
                    clearTimeout(timeout);
                    resolve();
                }
            }, 100);
        });
    });

    afterAll(() => {
        network.disconnectP2P();
    });

    it("should handle server create-offer message correctly", async () => {
        const msg = JSON.stringify({ type: 'create-offer' });
        if (!network.signalingSocket || !network.signalingSocket.some) {
            throw new Error("None value of _signalingSocket")
        }
        network.signalingSocket.value.dispatchEvent(new MessageEvent("message", { data: msg }));

        // Give time for async handler
        await new Promise((r) => setTimeout(r, 100));

        // Check peer connection was initialized
        expect(network["_peerConnection"]).toBeDefined();
    });
});