import type { Component, ToType } from "@/types";

export class InGameStateComponent implements Component {
    public isPaused: boolean;

    constructor() {
        this.isPaused = false;
    }

}

export type InGameStateType = ToType<InGameStateComponent, "InGameStateType">;