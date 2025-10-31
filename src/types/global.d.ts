export {};

declare global {
    interface Number {
        clamp(min: number, max: number): number;
    }

    interface Array {
        isEmpty(): boolean;
    }
}