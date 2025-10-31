export * from './number'

Array.prototype.isEmpty = function (): boolean {
    const value = Array(this);
    return value.length === 0;
}