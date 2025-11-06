import type { SignalMessage } from "@/types";
import type { Into } from "@/utils/type-cast";

export class SignalMessageIntoRTCSessionDescription implements Into<RTCSessionDescription> {
    private inner: SignalMessage;

    constructor(val: SignalMessage) {
        this.inner = val;
    }
    into<Target>(): Target extends RTCSessionDescription ? Target : never {
        throw new Error("Method not implemented.");
    }
}