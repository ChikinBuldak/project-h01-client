import type { Component } from "../../types/ecs";

export type ColliderShape = "rectangle" | "circle" | "polygon";

export class Collider implements Component {
    shape: ColliderShape;
    width: number;
    height: number;
    radius?: number;
    isSensor: boolean = false;

    /**
     * Create a new Collider
     * @param shape determine the same, could be 'rectangle', 'circle', and 'polygon'. Default to `rectangle`
     * @param width set the collider width. Default to `1`
     * @param height set the collider height Default to `1`
     * @param radius (Optional) set the collider radius (for circle only)
     * @param isSensor determine whether it is a sensor collider. Default to `false`
     */
    constructor({
        shape = "rectangle",
        width = 1,
        height = 1,
        radius,
        isSensor = false,
    }: Partial<Collider> = {}) {
        this.shape = shape;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.isSensor = isSensor;
    }
}