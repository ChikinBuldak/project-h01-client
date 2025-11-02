import { isSome, type System, type World } from "@/types";
import { PhysicsResource } from "../resources/PhysicsResource";
import { DomResource } from "../resources/DomResource";
import { NetworkResource } from "../resources";
import { Despawn } from "../components/Despawn";
import { RigidBody } from "../components";

export class GarbageCollectorSystem implements System {
    update(world: World): void {
        const physicsRes = world.getResource(PhysicsResource);
        const domRes = world.getResource(DomResource);
        const netRes = world.getResource(NetworkResource);

        // Find all entities marked for deletion
        const query = world.queryWithEntity(Despawn);

        for (const [entity, _despawn] of query) {

            // 1. Clean up Physics Body
            if (isSome(physicsRes)) {
                const rb = entity.getComponent(RigidBody);
                if (isSome(rb)) {
                    physicsRes.value.removeBody(rb.value.body);
                }
            }

            // 2. Clean up DOM Element
            if (isSome(domRes)) {
                const el = domRes.value.elements.get(entity.id);
                if (el) {
                    el.remove();
                    domRes.value.elements.delete(entity.id);
                }
            }

            // 3. Clean up Network ID mapping
            if (isSome(netRes)) {
                netRes.value.removeMappingByEntityId(entity.id);
            }

            // 4. Finally, remove the entity from the world
            world.removeEntity(entity.id);
        }
    }
}