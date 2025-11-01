import { Entity, System, World } from "../../types/ecs";
import { LocalPlayerTag } from '../components/LocalPlayerTag';
import { DomMaterial } from "../components/DomMaterial";
import { Mesh2D } from "../components/Mesh2D";
import { Transform } from "../components/Transform";
import { Time } from "../resources";
import { isSome } from "@/types";

export class DomRenderSystem extends System {
    private elements = new Map<number, HTMLDivElement>();
    private container: HTMLElement | null = null;
    private worldElement: HTMLElement | null = null;

    // Camera properties
    private cameraX = 0;
    private cameraY = 0;
    private cameraSmooth = 0.1; // Smoothing factor (0-1)
    
    constructor() {
        super();
        this.container = document.getElementById('world-container');
        this.worldElement = document.getElementById('world');
    }

    update(_world: World): void { }

    private updateCamera(world: World) {
        if (!this.worldElement || !this.container) return;
        const returnComp = [Transform]
        const filterComp = [LocalPlayerTag]
        const query = world.queryWithFilter(returnComp, filterComp);
        if (query.length === 0) return;
        const [transform] = query[0];

        const targetX = -transform.position.x + this.container.clientWidth / 2;
        const targetY = -transform.position.y + this.container.clientHeight / 2;

        // use alpha from time resource for smooth camera movement
        // const time = world.getResource(Time);
        // const alpha = isSome(time) ? time.value.alpha : 1.0;

        // Apply smoothing (for here using cameraSmooth static value)
        this.cameraX = (targetX - this.cameraX) * this.cameraSmooth;
        this.cameraY = (targetY - this.cameraY) * this.cameraSmooth;

        // Apply transform to the world element
        this.worldElement.style.transform = `translate3d(${this.cameraX}px, ${this.cameraY}px, 0)`;
    }

    render(world: World): void {
        if (!this.worldElement) return;

        this.updateCamera(world);

        // Query all renderable entities
        const query = world.queryWithEntity(Transform, Mesh2D, DomMaterial);
        const seen = new Set<number>();

        for (const [entity, transform, mesh, material] of query) {
            seen.add(entity.id);
            let el = this.elements.get(entity.id);
            if (!el) {
                el = document.createElement('div');
                this.worldElement.appendChild(el);
                this.elements.set(entity.id, el);

                // set static material properties
                el.className = material.className;
                Object.assign(el.style, material.styles);
                el.style.zIndex = `${material.zIndex}`;
                el.style.position = 'absolute';
                el.style.boxSizing = 'border-box';
                el.style.width = `${mesh.width}px`;
                el.style.height = `${mesh.height}px`;
                el.style.left = `${-mesh.width / 2}px`;
                el.style.top = `${-mesh.height / 2}px`;
            }

            // Update dynamic properties
            el.style.transform = `translate3d(${transform.position.x}px, ${transform.position.y}px, 0) rotate(${transform.rotation}deg)`;
        }
        
        // Garbage collect elements for entities that were removed
        for (const [id, el] of this.elements.entries()) {
            if (!seen.has(id)) {
                el.remove();
                this.elements.delete(id);
            }
        }
    }

}