import type { Component } from "../../types/ecs";

export interface ColliderBound {
    width: number;
    height: number;
}

/**
 * Stores the *authoritative* collider bounds from the server.
 * This is for visualization only. A DebugRenderSystem will
 * query for this component and a Transform to draw a wireframe.
 */
export class DebugCollider implements Component {
    public shape: ColliderBound
    constructor(shape: ColliderBound) { 
        this.shape = shape;
    }
}

export class DebugPhysicsState implements Component {
    public isColliding: boolean;
    public isGrounded: boolean;
    constructor(isColliding: boolean = false, isGrounded: boolean = false) {
        this.isColliding = isColliding;
        this.isGrounded = isGrounded;
    }
}
