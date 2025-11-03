import {  OptionWrapper, type AppState, type Resource } from "@/types";

export class CurrentState implements Resource {
    private state: AppState;

    constructor(initialState: AppState) {
        this.state = initialState;
    }

    public get(): AppState {
        return this.state;
    }

    public set(newState: AppState) {
        if (this.state.constructor !== newState.constructor) {
            console.log(`[State] Transitioned from '${this.state.constructor.name}' to '${newState.constructor.name}'`);
            this.state = newState;
        }
    }
}

export class NextState implements Resource {
    private state: OptionWrapper<AppState> = OptionWrapper.none();

    public set(newState: AppState) {
        this.state = OptionWrapper.some(newState);
    }

    public take(): OptionWrapper<AppState> {
        if (this.state.isSome()) {
            const next = this.state;
            this.state = OptionWrapper.none();
            return next;
        }
        return OptionWrapper.none();
    }
}