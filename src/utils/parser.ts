export function parseBoolean(value: string | undefined) {
    return value?.toLowerCase() === 'true';
}