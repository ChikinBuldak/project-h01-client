interface Clampable {
    clamp(min: number, max: number): number;
}

export class ClampWrapper implements Clampable {
    private readonly val: number;
    constructor(val: number) {
        this.val = val;
    }
    clamp(min: number, max: number): number {
        return Math.max(min, Math.min(max, this.val));
    }
}