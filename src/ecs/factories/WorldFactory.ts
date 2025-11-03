import Matter from "matter-js";
import { Entity } from "@/types/ecs";
import { DomMaterial, Mesh2D, RigidBody, StaticMapObjectTag, Transform } from "@/ecs/components";
import { Pit } from "../components/tag";
import { Ground } from "../components/tag/Ground";

interface CreateGroundProps {
    x: number,
    y: number,
    width: number,
    height: number
}

interface CreatePitProps {
    x: number,
    y: number,
    width: number,
    height: number
}
export class WorldFactory {
    static createGround(
        props: CreateGroundProps
    ) {
        const { x, y, width, height } = props;
        const entity = new Entity()
            .addComponent(new Transform(x, y, 0))
            .addComponent(RigidBody.createFromFn(() => {
                return Matter.Bodies.rectangle(x, y, width, height, {
                    isStatic: true,
                    friction: 0.5,
                    collisionFilter: {
                        group: 0
                    }
                })
            }))
            .addComponent(new Mesh2D(
                width, height
            ))
            .addComponent(new DomMaterial(
                {
                    className: 'ground',
                    styles: {
                        backgroundColor: 'green'
                    },
                    zIndex: 1
                }
            ))
            .addComponent(new StaticMapObjectTag())
            .addComponent(new Ground());
        return entity;
    }
    static createPit(props: CreatePitProps) {
        const { x, y, width, height } = props;
        const entity = new Entity()
            .addComponent(new Transform(x, y, 0))
            .addComponent(RigidBody.createFromFn(() => {
                return Matter.Bodies.rectangle(x, y, width, height, {
                    isStatic: true,
                    friction: 0.0,
                    collisionFilter: {
                        group: 0
                    }
                })
            }))
            .addComponent(new Mesh2D(
                width, height
            ))
            .addComponent(new DomMaterial(
                {
                    className: 'ground',
                    styles: {
                        backgroundColor: 'transparent'
                    },
                    zIndex: 1
                }
            ))
            .addComponent(new StaticMapObjectTag())
            .addComponent(new Pit());
        return entity;
    }
}