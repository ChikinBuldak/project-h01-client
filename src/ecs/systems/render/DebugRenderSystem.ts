import { Entity, type System, World } from "../../../types/ecs";
import { Hitbox, Mesh2D, Transform} from "../../components";
import { isNone, isSome, unwrapOpt } from "../../../types/option";
import { DomResource } from "../../resources";

/**
 * This system draws wireframe colliders and other debug info.
 * It attaches itself to the already-interpolated Transform.
 */
export class DebugRenderSystem implements System {
    private activeHitboxes = new Set<number>();


    update(_world: World): void { }

    render(world: World): void {
        const domRes = world.getResource(DomResource);
        if (isNone(domRes)) return;

        const dom = unwrapOpt(domRes);
        const elements = dom.elements;

        const nextActiveHitboxes = new Set<number>();
        const query = world.queryWithEntity(Hitbox, Transform, Mesh2D);

        for (const [entity, _hitbox, transform, mesh] of query) {
            nextActiveHitboxes.add(entity.id);
            const el = elements.get(entity.id);
            if (!el) continue;

            el.style.border = "2px solid red";
            el.style.boxSizing = "border-box";
            el.style.zIndex = "100";

            el.style.width = `${mesh.width}px`;
            el.style.height = `${mesh.height}px`;

            el.style.transform = `translate3d(${transform.position.x}px, ${transform.position.y}px, 0) rotate(${transform.rotation}deg) scaleX(1)`;
        }

        for (const id of this.activeHitboxes) {
            if (!nextActiveHitboxes.has(id)) {
                const el = elements.get(id);
                if (el) {
                    el.style.border = "none";
                    el.style.zIndex = "auto";
                }
            }
        }

        // 3. Simpan set aktif untuk frame berikutnya
        this.activeHitboxes = nextActiveHitboxes;

    }
}

