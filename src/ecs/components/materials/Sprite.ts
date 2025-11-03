import type { Component } from "@/types/ecs";

/**
 * Replaces DomMaterial.
 * Holds a handle (the URL) to an asset in the AssetServer.
 */
export class Sprite implements Component {
    /**
     * The handle for the asset (its URL).
     * e.g., "/assets/player.png"
     */
    public assetHandle: string;

    constructor(handle: string) {
        this.assetHandle = handle;
    }
}