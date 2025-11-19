import {  none, OptionWrapper, type AppScene, type Resource, type Option, some, isSome, World} from "@/types";
import { registerResource, type ResourceRegistry } from '@/utils/registry/resource.registry';

export class CurrentState implements Resource {
    private state: AppScene;

    constructor(initialState: AppScene) {
        this.state = initialState;
    }

    public get(): AppScene {
        return this.state;
    }

    public set(newState: AppScene) {
        if (this.state.constructor !== newState.constructor) {
            console.log(`[State] Transitioned from '${this.state.constructor.name}' to '${newState.constructor.name}'`);
            this.state = newState;
        }
    }
}

export class NextState implements Resource {
    private state: OptionWrapper<AppScene> = OptionWrapper.none();

    public set(newState: AppScene) {
        this.state = OptionWrapper.some(newState);
    }

    public take(): OptionWrapper<AppScene> {
        if (this.state.isSome()) {
            const next = this.state;
            this.state = OptionWrapper.none();
            return next;
        }
        return OptionWrapper.none();
    }
}

export class AppStateResource implements Resource {
  private currentState: Option<AppScene> = none;
  private nextState: Option<AppScene> = none;

  /**
   * @param initialState The *first* state the app should enter
   * (e.g., LoadingState or MainMenuState).
   */
  constructor(initialState: AppScene) {
    // Schedule the initial state to be entered on the first frame
    this.nextState = some(initialState);
  }

  /**
   * Call this from anywhere (e.g., a system, or a UI button click)
   * to schedule a state transition for the *next* frame.
   * @param next The new AppState instance to transition to.
   */
  public scheduleTransition(next: AppScene) {
    this.nextState = some(next);
  }

  /**
   * This method must be called by your main game loop (e.g., `useGameLoop`)
   * *every frame*. It checks if a transition is pending and handles
   * the `onExit` and `onEnter` logic.
   * @param world The main ECS World object.
   */
  public handleTransition(world: World) {
    // Check if there is a state transition scheduled
    if (isSome(this.nextState)) {
      const next = this.nextState.value;

      // 1. Exit the current state (if one exists)
      if (isSome(this.currentState)) {
        console.log(`Exiting state: ${this.currentState.value.constructor.name}`);
        this.currentState.value.onExit(world);
      }
      
      // 2. Enter the new state
      console.log(`Entering state: ${next.constructor.name}`);
      next.onEnter(world);
      
      // 3. Update the resource to reflect the new state
      this.currentState = some(next);
      this.nextState = none; // Clear the scheduled state
    }
  }

  /**
   * Gets the currently active state, if any.
   */
  public getCurrentState(): Option<AppScene> {
    return this.currentState;
  }
}

registerResource("appStateResource", AppStateResource);

declare module "@/utils/registry/resource.registry" {
  interface ResourceRegistry {
    appStateResource: AppStateResource;
  }
}