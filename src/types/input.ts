export interface Input {
    dx: number,
    dy: number,
    tick: number
}

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

    public static isDown(key: string): boolean {
        return this.keys.get(key.toLowerCase()) || false;
    }
}