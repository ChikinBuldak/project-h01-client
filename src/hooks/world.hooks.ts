import { useWorldStore } from "../stores/world.stores";
import { useEffect, useRef } from "react";

let SimulationHz = 60;
export const FIXED_TIMESTEP = 1000 / SimulationHz;

export const useGameLoop = () => {
    const updateWorld = useWorldStore((state) => state.update);
    const renderWorld = useWorldStore((state)=>state.render);

    const lastTimeRef = useRef(performance.now());
    const accumulatorRef = useRef(0);

    useEffect(() => {
        let frameId: number;
        const tick = (currentTime: number) => {
            const deltaTime = currentTime - lastTimeRef.current;
            lastTimeRef.current = currentTime;
            accumulatorRef.current += deltaTime;

            while (accumulatorRef.current >= FIXED_TIMESTEP) {
                updateWorld(FIXED_TIMESTEP);
                accumulatorRef.current -= FIXED_TIMESTEP;
            }

            const alpha = accumulatorRef.current / FIXED_TIMESTEP;
            renderWorld(alpha);
            frameId = requestAnimationFrame(tick);
        }

        frameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frameId);
        }
    }, [updateWorld, renderWorld])
}