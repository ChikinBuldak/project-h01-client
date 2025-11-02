import { Entity, type System, World } from "../../types/ecs";
import { LocalPlayerTag } from '../components/LocalPlayerTag';
import { DomMaterial } from "../components/DomMaterial";
import { Mesh2D } from "../components/Mesh2D";
import { Transform } from "../components/Transform";
import { AssetServer, Time } from "../resources";
import { isNone, isSome, unwrapOpt } from "@/types";
import { AnimationController, PlayerState, Sprite } from "../components";
import { DomResource } from "../resources/DomResource";

export class DomRenderSystem implements System {

    // Add a guard to ensure init only runs once
    private isInitialized = false;

    // Camera properties
    private cameraX = 0;
    private cameraY = 0;
    private cameraSmooth = 0.1; // Smoothing factor (0-1)

    update(world: World): void {
        if (!this.isInitialized) {
            this.init(world);
        }
    }

    /**
     * Helper to initialize the AssetServer resource.
     */
    private init(world: World) {
        if (this.isInitialized) return; // Already initialized

        const domRes = world.getResource(DomResource);

        if (isSome(domRes)) {
            const dom = domRes.value;
            dom.container = document.getElementById('world-container');
            dom.worldElement = document.getElementById('world');
            if (!dom.container || !dom.worldElement) {
                console.error("DomRenderSystem: Failed to find #world or #world-container. Retrying next frame.");
                return;
            }

            const res = world.getResource(AssetServer);
            if (isNone(res)) {
                console.warn("DomRenderSystem: AssetServer resource not found. Retrying next frame.");
                return;
            }
            // If we got here, all dependencies are loaded
            console.log("DomRenderSystem Initialized Successfully.");
            this.isInitialized = true;
        }
    }

    private updateCamera(world: World, dom: DomResource) {
        const { worldElement, container } = dom;
        if (!worldElement || !container) return;
        const returnComp = [Transform]
        const filterComp = [LocalPlayerTag]
        const query = world.queryWithFilter(returnComp, filterComp);
        if (query.length === 0) return;
        const [transform] = query[0];

        const targetX = -transform.position.x + container.clientWidth / 2;
        const targetY = -transform.position.y + container.clientHeight / 2;

        // use alpha from time resource for smooth camera movement
        // const time = world.getResource(Time);
        // const alpha = isSome(time) ? time.value.alpha : 1.0;

        // Apply smoothing (for here using cameraSmooth static value)
        this.cameraX = (targetX - this.cameraX) * this.cameraSmooth;
        this.cameraY = (targetY - this.cameraY) * this.cameraSmooth;

        // Apply transform to the world element
        worldElement.style.transform = `translate3d(${this.cameraX}px, ${this.cameraY}px, 0)`;
    }

    render(world: World): void {
        if (!this.isInitialized) return;

        const domRes = world.getResource(DomResource);
        const assetRes = world.getResource(AssetServer);

        if (isNone(domRes)) return;
        const dom = domRes.value;
        const assetServer = isSome(assetRes) ? assetRes.value : null;

        this.updateCamera(world, dom);
        const elements = dom.elements;

        // Query all renderable entities
        const query = world.queryWithEntity(Transform, Mesh2D);
        // console.log(query);

        for (const [entity, transform, mesh] of query) {
            let el = elements.get(entity.id);

            const spriteOpt = entity.getComponent(Sprite);
            const animOpt = entity.getComponent(AnimationController);
            const stateOpt = entity.getComponent(PlayerState);
            const materialOpt = entity.getComponent(DomMaterial);
            if (!el) {
                el = document.createElement('div');
                dom.worldElement!.appendChild(el);
                elements.set(entity.id, el);

                // set static material properties
                el.style.position = 'absolute';
                el.style.boxSizing = 'border-box';
                el.style.width = `${mesh.width}px`;
                el.style.height = `${mesh.height}px`;

                // Center the origin
                el.style.left = `${-mesh.width / 2}px`;
                el.style.top = `${-mesh.height / 2}px`;

                // --- 2a. Apply Sprite material (if it exists) ---
                if (isSome(spriteOpt) && assetServer) {
                    const image = assetServer.get(spriteOpt.value.assetHandle);
                    if (image) {
                        el.style.backgroundImage = `url(${image.src})`;
                        el.style.backgroundRepeat = 'no-repeat';
                        el.style.imageRendering = 'pixelated';
                    }
                    // --- 2b. Apply DomMaterial (if no sprite) ---
                } else if (isSome(materialOpt)) {
                    const material = unwrapOpt(materialOpt);
                    el.className = material.className;
                    Object.assign(el.style, material.styles);
                    el.style.zIndex = `${material.zIndex}`;
                }
            }

            // Handle animation
            let scaleX = "1";
            let backgroundPosX = "0px";
            let backgroundPosY = "0px";

            // Check for animation data
            if (isSome(spriteOpt) && isSome(animOpt) && isSome(stateOpt)) {
                const anim = unwrapOpt(animOpt);
                const state = unwrapOpt(stateOpt);

                const clip = anim.states.get(anim.currentState);
                if (clip) {
                    backgroundPosX = `-${anim.currentFrame * mesh.width}px`;
                    backgroundPosY = `-${clip.row * mesh.height}px`;
                }

                if (state.faceDirection === -1) {
                    scaleX = "-1";
                }
            }

            el.style.backgroundPosition = `${backgroundPosX}, ${backgroundPosY}`;

            // Update dynamic properties
            el.style.transform = `translate3d(${transform.position.x}px, ${transform.position.y}px, 0) rotate(${transform.rotation}deg) scaleX(${scaleX})`;
        }
    }

}