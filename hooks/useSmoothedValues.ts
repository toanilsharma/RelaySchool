import { useState, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/**
 * Custom hook to smoothly interpolate an object of numerical values.
 * Useful for Canvas tweening and creating odometer effects for text.
 *
 * FIX #7: Using JSON.stringify(targetValues) as the dependency key instead of
 * Object.values(targetValues), which created a NEW array reference every render
 * and caused the effect to fire infinitely. JSON.stringify is a stable comparison.
 */
export function useSmoothedValues<T extends Record<string, number>>(targetValues: T): T {
    const [currentValues, setCurrentValues] = useState<T>(targetValues);
    const currentRef = useRef<T>(targetValues);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const controls = animate(currentRef.current, targetValues, {
            type: "spring",
            stiffness: 120,
            damping: 20,
            onUpdate: (latest) => {
                currentRef.current = { ...latest } as T;
                setCurrentValues({ ...latest } as T);
            }
        });
        return () => controls.stop();
        // JSON.stringify gives a stable, value-based comparison for the dep array
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(targetValues)]);

    return currentValues;
}
