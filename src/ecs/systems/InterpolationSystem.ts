import { Entity, type System, World } from "../../types/ecs";
import type { PlayerPhysicsState, PlayerStateMessage, TransformState } from "../../types/network";
import { LocalPlayerTag } from "../components";
import { NetworkStateBuffer } from "../components/NetworkStateBuffer";
import { intoTransform, Transform } from "../components/Transform";
type Snapshot = { tick: number, state: PlayerPhysicsState };

export class InterpolationSystem implements System {

    public update(world: World): void {
        // Interpolation logic runs in the render loop
    }

    public render(world: World): void {
        // We query for entities that are networked AND have a transform,
        // but are NOT the local player (as the local player is predicted).
        const query = world.queryWithEntity(
            Transform, 
            NetworkStateBuffer
        );

        for (const [entity, transform, netBuffer] of query) {
            // Do not interpolate the local player!
            if (entity.hasComponent(LocalPlayerTag)) {
                continue;
            }

            // Get the target render time
            const renderTime = performance.now() - netBuffer.bufferDelay;
            // Find the two snapshots we need to interpolate between
            const [prevState, nextState] = this.findSnapshots(netBuffer.buffer, renderTime);

            // If we don't have a valid pair, we can't interpolate.
            // We'll just snap to the newest state we have.
            if (!prevState || !nextState) {
                const latestState = nextState || prevState;
                if (latestState) {
                    transform.position.x = latestState.state.transform.position.x;
                    transform.position.y = latestState.state.transform.position.y;
                }
                continue;
            }

            // Calculate the time difference and interpolation factor
            const timeDiff = nextState.tick - prevState.tick;
            
            // Avoid division by zero
            if (timeDiff === 0) {
                transform.position.x = prevState.state.transform.position.x;
                transform.position.y = prevState.state.transform.position.y;
                continue;
            }

            const renderAlpha = (renderTime - prevState.tick) / timeDiff;
            // Clamp alpha between 0 and 1 to prevent over-extrapolating
            const clampedAlpha = Math.max(0, Math.min(1, renderAlpha));

            // Set the entity's current transform to the interpolated position
            const interpolated = Transform.lerp(Transform.from(prevState.state), Transform.from(nextState.state), clampedAlpha);
            transform.position.x = interpolated.position.x;
            transform.position.y = interpolated.position.y;
            // You could interpolate rotation here as well
        }
    }

    /**
     * Finds the two snapshots from the buffer that bracket the target render time.
     * @param buffer The list of received snapshots, sorted by tick.
     * @param renderTime The target time we want to render for.
     * @returns A tuple [prevState, nextState], where one or both may be null.
     */
    private findSnapshots(buffer: Snapshot[], renderTime: number): [Snapshot | null, Snapshot | null] {
        let prevState = null;
        let nextState = null;

        for (const snapshot of buffer) {
            if (snapshot.tick <= renderTime) {
                prevState = snapshot;
            }
            if (snapshot.tick > renderTime) {
                nextState = snapshot;
                break;
            }
        }
        return [prevState, nextState];
    }
}