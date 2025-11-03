import Matter from "matter-js";
import { Entity } from "../../types/ecs";
import { AnimationController, DomMaterial, GroundCheckRay, LocalPlayerTag, Mesh2D, NetworkStateBuffer, PlayerState, PredictionHistory, RigidBody, Sprite, Transform } from "../components";
import { Knockbacker } from "../components/character/Knockbacker";
import type { GameConfig } from "@/types/config";
import { Hurtbox } from "../components/character/Hurtbox";


/**
 * Factory class for creating preconfigured character entities.
 *
 * Each factory method constructs a new {@link Entity} and
 * attaches the necessary ECS components to represent a visual character
 * with optional local-player logic and prediction handling.
 *
 * ---
 * ### Commonly added components:
 * - {@link Transform}: defines the 2D position of the entity.
 * - {@link Mesh2D}: defines the visual size and shape in the world.
 * - {@link DomMaterial}: defines CSS-based rendering attributes.
 * - {@link NetworkStateBuffer}: holds network state snapshots for reconciliation.
 * - {@link LocalPlayerTag}: marks the entity as locally controlled (if applicable).
 * - {@link PredictionHistory}: tracks player input history for prediction (if applicable).
 *
 * ---
 * ### Example:
 * ```ts
 * const redPlayer = CharacterFactory.createRed({
 *   xPos: 100,
 *   yPos: 200,
 *   width: 32,
 *   height: 32,
 *   isPlayer: true
 * });
 * ```
 */
export class CharacterFactory {
    /**
     * Creates a red-colored character entity.
     *
     * ---
     * @param props - Configuration for the character’s initial state.
     * @param props.xPos - X coordinate (world position). *(Required)*
     * @param props.yPos - Y coordinate (world position). *(Required)*
     * @param props.width - Width of the entity in pixels. *(Default: `20`)*
     * @param props.height - Height of the entity in pixels. *(Default: `20`)*
     * @param props.isPlayer - Whether this character represents the local player.
     * If `true`, adds {@link LocalPlayerTag} and {@link PredictionHistory} components.
     * *(Default: `false`)*
     *
     * ---
     * @returns A new {@link Entity} configured as a red character.
     *
     * ---
     * ### Visual Defaults:
     * - CSS class: `"entity remote-player"`
     * - Background color: `"red"`
     * - `z-index`: `5`
     */

    private createBase(props: {
        x: number,
        y: number,
        width?: number, height?: number, isPlayer?: boolean,
        styles: Partial<CSSStyleDeclaration>,
    }) {

        const { x: xPos, y: yPos, width = 20, height = 20, styles } = props;
        const body = Matter.Bodies.rectangle(xPos, yPos, width, height, {
            inertia: Infinity,
            friction: 0.1,
            restitution: 0.0,
            collisionFilter: { group: -1 },
            mass: 60
        });
        const entity = new Entity()
            .addComponent(new Transform(xPos, yPos, 0))
            .addComponent(new Mesh2D(width, height))
            .addComponent(new DomMaterial({
                className: 'entity player',
                styles: styles,
            }))
            .addComponent(RigidBody.createFromBody(body))
            .addComponent(new PlayerState())
            .addComponent(new Hurtbox())
            .addComponent(new GroundCheckRay(height / 2 + 2))
            .addComponent(new Knockbacker());

        return entity;
    };

    createRed(props: {
        xPos: number, yPos: number,
        width?: number, height?: number,
        isPlayer?: boolean, config: GameConfig
    }): Entity {
        const { xPos, yPos, width = 20, height = 20, isPlayer = false, config } = props;
        const entity = this.createBase({
            x: xPos, y: yPos, width, height, isPlayer, styles: {
                backgroundColor: 'firebrick',
                zIndex: "6",
            }
        })
        if (isPlayer) {
            entity.addComponent(new LocalPlayerTag())
                .addComponent(new PredictionHistory())
        } else {
            entity.addComponent(new NetworkStateBuffer());
        }
        entity
            .addComponent(new Sprite(config.player.sprite))
            .addComponent(new AnimationController(
                "idle",
                config.player.animations,
                config.player.frameWidth,
                config.player.frameHeight)
            );

        return entity;
    }

    /**
 * Creates a blue-colored character entity.
 *
 * ---
 * @param props - Configuration for the character’s initial state.
 * @param props.xPos - X coordinate (world position). *(Required)*
 * @param props.yPos - Y coordinate (world position). *(Required)*
 * @param props.width - Width of the entity in pixels. *(Default: `20`)*
 * @param props.height - Height of the entity in pixels. *(Default: `20`)*
 * @param props.isPlayer - Whether this character represents the local player.
 * If `true`, adds {@link LocalPlayerTag} and {@link PredictionHistory} components.
 * *(Default: `false`)*
 *
 * ---
 * @returns A new {@link Entity} configured as a blue character.
 *
 * ---
 * ### Visual Defaults:
 * - CSS class: `"entity remote-player"`
 * - Background color: `"blue"`
 * - Border: `"2px solid white"`
 * - `z-index`: `10`
 */
    createBlue(props: {
        xPos: number,
        yPos: number,
        width?: number, height?: number, isPlayer?: boolean,
        config: GameConfig
    }): Entity {
        const { xPos, yPos, width = 20, height = 20, isPlayer = false, config } = props;
        const entity = this.createBase({
            x: xPos, y: yPos, width, height, isPlayer, styles: {
                backgroundColor: 'blue',
                border: '2px solid white',
                zIndex: "5"
            }
        })

        if (isPlayer) {
            entity.addComponent(new LocalPlayerTag())
                .addComponent(new PredictionHistory())
        } else {
            entity.addComponent(new NetworkStateBuffer());
        }

        return entity
    }

}