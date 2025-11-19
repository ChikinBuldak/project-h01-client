import type { EventECS, System, SystemCtor } from "@/types";
import type { YourAverageHTTPResponse } from "@/types/http";

export class RestAPIResponseEvent<TargetSystem extends System, PayloadType> implements EventECS {
    public readonly response: YourAverageHTTPResponse<PayloadType>;
    public readonly forWhom?: SystemCtor<TargetSystem>;
    constructor(response: YourAverageHTTPResponse<PayloadType>, forWhom?: SystemCtor<TargetSystem>) {
        this.response = response;
        this.forWhom = forWhom;
    }
}