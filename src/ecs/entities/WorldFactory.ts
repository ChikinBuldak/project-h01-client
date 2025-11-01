import Matter from "matter-js";
import { Entity } from "../../types/ecs";
import { DomMaterial, Mesh2D, RigidBody, Transform } from "../components";
import { Collider } from "../components/Collider";

interface createGroundProps {
    x: number,
    y: number,
    width: number,
    height: number
}
export class WorldFactory {
    static createGround(
        props: createGroundProps
    ) {
        const { x, y, width, height } = props;
        const entity = new Entity()
            .addComponent(new Transform(x, y))
            .addComponent(RigidBody.create(() => {
                return Matter.Bodies.rectangle(x, y, width, height, {
                    isStatic: true,
                    friction: 0.5,
                })
            }))
            .addComponent(new Collider({
                shape: 'rectangle',
                width,
                height,
                isSensor: false
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
            ));
        return entity;
    }
}