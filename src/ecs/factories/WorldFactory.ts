import Matter from "matter-js";
import { Entity } from "../../types/ecs";
import { DomMaterial, Mesh2D, RigidBody, StaticMapObjectTag, Transform } from "../components";
import { Collider } from "../components/Collider";

interface createGroundProps {
    x: number,
    y: number,
    width: number,
    height: number
}
export class WorldFactory {
    createGround(
        props: createGroundProps
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
            .addComponent(new Collider({
                shape: 'rectangle',
                width,
                height,
                isSensor: false,
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
            .addComponent(new StaticMapObjectTag());
        return entity;
    }
}