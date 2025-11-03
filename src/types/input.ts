export class InputManager {
    private static keys = new Map<string, boolean>();

    public static initialize() {
        document.addEventListener('keydown', (e) => {
            this.keys.set(e.key.toLowerCase(), true);
        });

        document.addEventListener('keyup', (e) => {
            this.keys.set(e.key.toLowerCase(), false);
        });
    }

    public static isDown(key: KeyCodeType | string): boolean {
        return this.keys.get(key.toLowerCase()) || false;
    }
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