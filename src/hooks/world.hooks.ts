import { AppStateResource } from "@/ecs/resources/state.resource";
import { useWorldStore } from "../stores/world.store";
import { useEffect, useRef } from "react";
import { isSome, unwrapOpt } from "@/types";
import { Time } from "@/ecs/resources";

let SimulationHz = 60;
export const FIXED_TIMESTEP = 1000 / SimulationHz;

export const useGameLoop = () => {
    const world = useWorldStore((s) => s.world);

    const lastTimeRef = useRef(performance.now());
    const accumulatorRef = useRef(0);
    const rafRef = useRef(0);

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
                const time = world.getResource(Time);
                if (isSome(time)) {
                    unwrapOpt(time).currentTick++;
                }
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