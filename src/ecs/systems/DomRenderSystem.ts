import { Entity, System } from "../../types/ecs";
import { LocalPlayerTag } from "../components/LocalPlayerTag";
import { DomMaterial2D } from "../components/DomMaterial2D";
import { Mesh2D } from "../components/Mesh2D";
import { Transform } from "../components/Transform";

export class DomRenderSystem extends System {
    private container: HTMLElement | null = null;
    private entityElementMap = new Map<number, HTMLElement>();
    private cameraTarget: Transform | null = null;
    
    constructor() {
        super();
        this.container = document.getElementById("world");
        if (!this.container)
            console.error("DomRenderSystem: 'world' container not found!");
    }

    update(_entities: Entity[], _deltaTime: number): void { }

    render(entities: Entity[], _alpha: number): void {
        if (!this.container) return;

        // Camera handle mechanism
        const playerQuery = this.query(entities, Transform, LocalPlayerTag);
        if (playerQuery.length > 0) {
            this.cameraTarget = playerQuery[0][0];
        }
        if (this.cameraTarget && this.container.parentElement) {
            const screenCenterX = this.container.parentElement.clientWidth / 2;
            const screenCenterY = this.container.parentElement.clientHeight / 2;

            const cameraX = this.cameraTarget.position.x + screenCenterX;
            const cameraY = this.cameraTarget.position.y + screenCenterY;
            this.container.style.transform = `transform3d(${cameraX}, ${cameraY}, 0)`;
        }

        // Render all entities


        const renderableQuery = this.queryWithEntity(entities, Transform, Mesh2D, DomMaterial2D);
        const seenEntities = new Set<number>();

        for (const [entity, transform, mesh, material] of renderableQuery) {
            seenEntities.add(entity.id);
            let el = this.entityElementMap.get(entity.id);
            if (!el) { // If no element exists for this entity, create one
                el = document.createElement("div");
                el.className = material.className;
                el.style.position = 'absolute';
                el.style.zIndex = `${material.zIndex}`;

                // Apply all initial styles from material
                Object.assign(el.style, material.styles);
                this.container.appendChild(el);
                this.entityElementMap.set(entity.id, el);
            }
            el.style.width = `${mesh.width}px`;
            el.style.height = `${mesh.height}px`;
            const halfWidth = mesh.width / 2;
            const halfHeight = mesh.height / 2;
            el.style.transform = `translate3d(${transform.position.x - halfWidth}px, ${transform.position.y - halfHeight}px, 0)`;
        }
        // Clean up elements for entities that no longer exist
        for (const [id, el] of this.entityElementMap.entries()) {
            if (!seenEntities.has(id)) {
                el.remove();
                this.entityElementMap.delete(id);
            }
        }
    }

}