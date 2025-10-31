import type { Component } from "../../types/ecs";

/**
 * A component that defines the 2D shape of an entity.
 */
export class Mesh2D implements Component {
    public width: number;
    public height: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}