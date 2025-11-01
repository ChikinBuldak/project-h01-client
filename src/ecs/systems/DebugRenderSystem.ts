import { Entity, System } from "../../types/ecs";
import { Transform } from "../components/Transform";
import { DebugCollider, DebugPhysicsState } from "../components/DebugCollider";
// Import the new tag
import { StaticMapObjectTag } from "../components";
import { isSome } from "../../types/option";

/**
 * This system draws wireframe colliders and other debug info.
 * It attaches itself to the already-interpolated Transform.
 */
export class DebugRenderSystem extends System {
    private elements = new Map<number, HTMLDivElement>();
    private container: HTMLElement | null = null;

    constructor() {
        super();
        this.container = document.getElementById('world');
    }

    update(_entities: Entity[], _deltaTime: number): void {}

    render(entities: Entity[], _alpha: number): void {
        if (!this.container) return;

        // Query for entities that have both a Transform and a DebugCollider
        const query = this.queryWithEntity(entities, Transform, DebugCollider);
        const seen = new Set<number>();

        for (const [entity, transform, collider] of query) {
            seen.add(entity.id);
            let el = this.elements.get(entity.id);

            // Create debug element if it doesn't exist
            if (!el) {
                el = document.createElement('div');
                el.className = 'debug-collider';
                el.style.position = 'absolute';
                el.style.border = '1px dashed rgba(0, 255, 0, 0.7)';
                el.style.boxSizing = 'border-box'; // Important!
                this.container.appendChild(el);
                this.elements.set(entity.id, el);
            }

            // --- APPLY STATE ---
            
            // 1. Set Position: Use the *smoothly interpolated* transform
            // We adjust position by -width/2 and -height/2 to center the box
            const halfWidth = collider.shape.width / 2;
            const halfHeight = collider.shape.height / 2;
            el.style.transform = `translate3d(${transform.position.x - halfWidth}px, ${transform.position.y - halfHeight}px, 0)`;
            
            // 2. Set Size: Snap to the *authoritative* collider shape
            el.style.width = `${collider.shape.width}px`;
            el.style.height = `${collider.shape.height}px`;

            // 3. Set Color (based on entity type)
            if (entity.hasComponent(StaticMapObjectTag)) {
                // Style for static map objects
                el.style.borderColor = 'rgba(255, 255, 255, 0.8)'; // White
                el.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            } else {
                // Style for dynamic objects (players, etc.)
                const physics = entity.getComponent(DebugPhysicsState);
                if (isSome(physics)) {
                    if (physics.value.isColliding) {
                        el.style.borderColor = 'rgba(255, 0, 0, 0.7)';
                    } else if (physics.value.isGrounded) {
                        el.style.borderColor = 'rgba(0, 255, 0, 0.7)';
                    } else {
                        el.style.borderColor = 'rgba(255, 255, 0, 0.7)';
                    }
                } else {
                    // Default dynamic object color
                     el.style.borderColor = 'rgba(0, 255, 255, 0.7)'; // Cyan
                }
            }
        }

        // Garbage collect elements
        for (const [id, el] of this.elements.entries()) {
            if (!seen.has(id)) {
                el.remove();
                this.elements.delete(id);
            }
        }
    }
}

