import type { Component } from "../../types/ecs";
import type Matter from "matter-js";


export type RigidBodyType = "static" | "dynamic"

export class RigidBody implements Component {
  body: Matter.Body | null = null; // reference to Matter.js body
  type: RigidBodyType;
  friction: number;
  restitution: number;
  isSensor: boolean;

  constructor({
    type = "dynamic",
    friction = 0.1,
    restitution = 0.0,
    isSensor = false,
  }: Partial<RigidBody> = {}) {
    this.type = type;
    this.friction = friction;
    this.restitution = restitution;
    this.isSensor = isSensor;
  }
}