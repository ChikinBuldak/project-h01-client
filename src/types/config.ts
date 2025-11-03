// Define a type for our new config
// (You could move this to a types/config.ts file later)
export interface GameConfig {
    assets: {
        images: string[];
        audio: string[];
    };
    player: {
        width: number;
        height: number;
        frameWidth: number;
        frameHeight: number;
        sprite: string;
        animations: Record<string, {
            row: number;
            frameCount: number;
            frameDuration: number;
        }>;
    };
    scene: {
        localPlayer: { x: number, y: number };
        remotePlayer: { x: number, y: number, mockMove: boolean };
        ground: Array<{
            x: number, y: number, width: number, height: number
        }>;
    };
}