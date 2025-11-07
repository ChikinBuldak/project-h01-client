import { getFromStringToKeyCodeType } from "@/utils/registry/input.registry";

const FromString = getFromStringToKeyCodeType();

export class InputManager {
    private static keys = new Map<string, boolean>();
    private static currentState = new Set<KeyCodeType>();
    // `previousState` is a snapshot of `currentState` from the *end* of the last frame
    private static previousState = new Set<KeyCodeType>();

    /**
     * Initializes the InputManager and binds to browser events.
     * Call this once when your game starts.
     */
    public static initialize() {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        window.addEventListener("blur", this.handleBlur);
    }
    /**
     * Cleans up event listeners.
     */
    public static destroy() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("blur", this.handleBlur);
    }

    public static isDown(key: KeyCodeType): boolean {
        return this.currentState.has(key);
    }


    /**
     * Checks if a key was held down in the previous frame.
     */
    public static wasDown(key: KeyCodeType): boolean {
        return this.previousState.has(key);
    }

    /**
     * Checks if a key was pressed *down* on this frame.
     * (Was up last frame, is down this frame)
     */
    public static isJustPressed(key: KeyCodeType): boolean {
        return this.isDown(key) && !this.wasDown(key);
    }

    /**
     * Checks if a key was *released* on this frame.
     * (Was down last frame, is up this frame)
     */
    public static isJustReleased(key: KeyCodeType): boolean {
        return !this.isDown(key) && this.wasDown(key);
    }

    /**
     * CRITICAL: This must be called ONCE per frame, at the
     * *end* of your game loop (after all systems have run).
     * It snapshots the current state to be used as the "previous"
     * state in the *next* frame.
     */
    public static lateUpdate() {
        this.previousState = new Set(this.currentState);
    }

    private static handleKeyDown = (event: KeyboardEvent) => {
        // get the safe casting
        const keyCode = FromString.from(event.key);
        if (!keyCode.some) return;
        this.currentState.add(keyCode.value);
    };

    private static handleKeyUp = (event: KeyboardEvent) => {
        const keyCodeOpt = FromString.from(event.key);
        if (!keyCodeOpt.some) return;
        this.currentState.delete(keyCodeOpt.value);
    };

    /**
     * When the window loses focus, clear all keys
     * to prevent "stuck" keys.
     */
    private static handleBlur = () => {
        this.currentState.clear();
    };

}

/**
 * This maps friendly names to the `e.key.toLowerCase()` string.
 */
export const KeyCode = {
    // Letters
    A: 'a',
    B: 'b',
    C: 'c',
    D: 'd',
    E: 'e',
    F: 'f',
    G: 'g',
    H: 'h',
    I: 'i',
    J: 'j',
    K: 'k',
    L: 'l',
    M: 'm',
    N: 'n',
    O: 'o',
    P: 'p',
    Q: 'q',
    R: 'r',
    S: 's',
    T: 't',
    U: 'u',
    V: 'v',
    W: 'w',
    X: 'x',
    Y: 'y',
    Z: 'z',

    // Numbers
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',

    // Special Keys
    Space: ' ',
    Enter: 'enter',
    Escape: 'escape',
    Shift: 'shift',
    Control: 'control',
    Alt: 'alt',
    Tab: 'tab',

    // Arrow Keys
    ArrowUp: 'arrowup',
    ArrowDown: 'arrowdown',
    ArrowLeft: 'arrowleft',
    ArrowRight: 'arrowright',

} as const;

/**
 * A type representing all valid KeyCode values (e.g., "a", "w", " ").
 */
export type KeyCodeType = typeof KeyCode[keyof typeof KeyCode];