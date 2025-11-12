import { AppStateResource } from "@/ecs/resources/state.resource";
import { useWorldStore } from "../stores/world.store";
import { useEffect, useRef } from "react";
import { isSome, unwrapOpt } from "@/types";
import { ConfigResource } from "@/ecs/resources";
import AudioRequestEvent from "@/ecs/events/AudioRequestEvent";

let SimulationHz = 60;
export const FIXED_TIMESTEP = 1000 / SimulationHz;

export const useGameLoop = () => {
    const world = useWorldStore((s) => s.world);

    const lastTimeRef = useRef(performance.now());
    const accumulatorRef = useRef(0);
    const rafRef = useRef(0);
    const firstFrameRef = useRef(true);

    useEffect(() => {
        const tick = (currentTime: number) => {
            rafRef.current = requestAnimationFrame(tick);
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            accumulatorRef.current += deltaTime;

            const appState = world.getResource(AppStateResource);
            if (isSome(appState)) {
                unwrapOpt(appState).handleTransition(world);
            }

            while (accumulatorRef.current >= FIXED_TIMESTEP) {
                world.update(FIXED_TIMESTEP);
                accumulatorRef.current -= FIXED_TIMESTEP;
            }

            const alpha = accumulatorRef.current / FIXED_TIMESTEP;
            world.render(alpha);
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
        }
    }, [world])
}