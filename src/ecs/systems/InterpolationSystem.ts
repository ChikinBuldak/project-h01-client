import { Entity, System } from "../../types/ecs";
import type { TransformState } from "../../types/network";
import { NetworkStateBuffer } from "../components/NetworkStateBuffer";
import { Transform } from "../components/Transform";
type Snapshot = { tick: number, state: TransformState };

export class InterpolationSystem extends System {
    update(_entities: Entity[], _deltaTime: number): void { }

    render(entities: Entity[], _alpha: number): void {
        const query = this.query(entities, Transform, NetworkStateBuffer);

        for (const [transform, netBuffer] of query) {
            const renderTime = performance.now() - netBuffer.bufferDelay;
            const [prevState, nextState] = this.findSnapshots(netBuffer.buffer, renderTime);
            if (!prevState || !nextState) {
                if (nextState) {
                    transform.position.x = nextState.state.position.x;
                    transform.position.y = nextState.state.position.y;
                }
                continue;
            }

            // Calculate the interpolation factor between these two snapshots
            const timeDiff = nextState.tick - prevState.tick;
            if (timeDiff === 0) {
                transform.position.x = prevState.state.position.x;
                transform.position.y = prevState.state.position.y;
                continue;
            }
            const renderAlpha = (renderTime - prevState.tick) / timeDiff;

            // clamp alpha between 0 and 1
            const clampedAlpha = renderAlpha.clamp(0, 1);
            const interpolated = Transform.lerp(prevState.state, nextState.state, clampedAlpha);
            transform.position.x = interpolated.position.x;
            transform.position.y = interpolated.position.y;
        }
    }

    private findSnapshots(
        buffer: Snapshot[],
        renderTime: number
    ): [Snapshot | null, Snapshot | null] {

        let prevState: Snapshot | null = null;
        let nextState: Snapshot | null = null;

        // Use the new loop logic
        for (const snapshot of buffer) {
            if (snapshot.tick <= renderTime) {
                prevState = snapshot;
            }
            if (snapshot.tick > renderTime && !nextState) {
                nextState = snapshot;
                break; // Found the pair
            }
        }

        return [prevState, nextState];
    }

}