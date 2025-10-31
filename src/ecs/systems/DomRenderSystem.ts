import { Entity, System } from "../../types/ecs";
import { isSome } from "../../types/utils/option";
import { LocalPlayerTag } from "../components/LocalPlayerTag";
import { Transform } from "../components/Transform";

export class DomRenderSystem extends System {
    private worldElement: HTMLElement | null = null;
    private entityElementMap = new Map<number, HTMLElement>();

    constructor() {
        super();
        this.worldElement = document.getElementById("world");
    }

    update(_entities: Entity[], _deltaTime: number): void { }

    render(entities: Entity[], _alpha: number): void {
        if (!this.worldElement) {
            this.worldElement = document.getElementById("world");
            if (!this.worldElement) {
                console.error("RenderSystem: #world element not found");
                return;
            }
        }

        const query = this.query(entities, Transform);
        const seenEntities = new Set<number>();

        for (const [transform] of query) {
            const entity = entities.find(e => {
                const compOpt = e.getComponent(Transform);
                if (isSome(compOpt)) {
                    return compOpt.value === transform;
                }
                return false;
            });
            if (!entity) continue;
            seenEntities.add(entity.id);
            let el = this.entityElementMap.get(entity.id);
            if (!el) {
                el = document.createElement("div");
                el.className = "entity";
                this.worldElement.appendChild(el);
                this.entityElementMap.set(entity.id, el);

                // color the local player differently
                if (entity.hasComponent(LocalPlayerTag)) {
                    el.style.backgroundColor = "#007bff";
                } else {
                    el.style.backgroundColor = "#28a745";
                }
            }

            el.style.transform = `translate(${transform.position.x}px, ${transform.position.y}px)`;
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