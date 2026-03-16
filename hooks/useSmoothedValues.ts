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
        const keys = Object.keys(targetValues);
        const controls: any[] = [];

        keys.forEach(key => {
            const ctrl = animate(currentRef.current[key as keyof T] as any, targetValues[key] as any, {
                type: "spring",
                stiffness: 120,
                damping: 20,
                onUpdate: (latest) => {
                    const updated = { ...currentRef.current, [key]: latest };
                    currentRef.current = updated as T;
                    setCurrentValues(updated as T);
                }
            });
            controls.push(ctrl);
        });

        return () => controls.forEach(c => c.stop());
    }, [JSON.stringify(targetValues)]);

    return currentValues;
}
