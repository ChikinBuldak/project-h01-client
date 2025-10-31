Number.prototype.clamp = function (min: number, max: number): number {
    const value = Number(this);
    return Math.max(min, Math.min(max, value));
};