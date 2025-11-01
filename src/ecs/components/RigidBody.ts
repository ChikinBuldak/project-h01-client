import type { Component } from "../../types/ecs";
import Matter from "matter-js";
import { safeCall, type Undefinable, type Nullable } from "../../types/option";


export type RigidBodyType = "static" | "dynamic"

export class RigidBody implements Component {
  body: Matter.Body;

  public constructor(factory: () => Matter.Body) {
    this.body = factory();
  }

  /**
 * Creates a new RigidBody by calling a Matter.js body factory function.
 * 
 * @example
 * const rb = RigidBody.create(() =>
 *   Matter.Bodies.rectangle(0, 0, 50, 50, { isStatic: false })
 * );
 */
  static create(factory: () => Matter.Body): RigidBody {
    return new RigidBody(factory);
  }

  get type(): Nullable<"static" | "dynamic"> {
    return safeCall(() => this.body?.isStatic ? "static" : "dynamic");
  }

  set type(value: "static" | "dynamic") {
    safeCall(() => { if (this.body) Matter.Body.setStatic(this.body, value === "static") });
  }

  get friction(): Undefinable<number> {
    return this.body?.friction;
  }

  set friction(value: number) {
    if (this.body) this.body.friction = value;
  }

  get restitution(): Undefinable<number> {
    return this.body?.restitution;
  }

  set restitution(value: number) {
    if (this.body) this.body.restitution = value;
  }

  get isSensor(): Undefinable<boolean> {
    return this.body?.isSensor;
  }

  set isSensor(value: boolean) {
    if (this.body) this.body.isSensor = value;
  }
}