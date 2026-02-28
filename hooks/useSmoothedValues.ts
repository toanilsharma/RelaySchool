import { useState, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/**
 * Custom hook to smoothly interpolate an object of numerical values.
 * Useful for Canvas tweening and creating odometer effects for text.
 */
export function useSmoothedValues<T extends Record<string, number>>(targetValues: T): T {
    const [currentValues, setCurrentValues] = useState<T>(targetValues);
    const currentRef = useRef<T>(targetValues);

    useEffect(() => {
        const controls = animate(currentRef.current, targetValues, {
            type: "spring",
            stiffness: 120,
            damping: 20,
            onUpdate: (latest) => {
                // Must clone to trigger React state update
                setCurrentValues({ ...latest });
            }
        });
        return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, Object.values(targetValues));

    return currentValues;
}
