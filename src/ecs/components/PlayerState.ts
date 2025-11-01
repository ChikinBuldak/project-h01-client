import type { Component } from "../../types/ecs";

export class PlayerState implements Component {
    public isGrounded: boolean = false;;
    
    constructor(isGrounded: boolean = false) {
        this.isGrounded = isGrounded;
    }
}