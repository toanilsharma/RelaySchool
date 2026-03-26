import { useState, useCallback } from 'react';

export const useTripFeedback = () => {
    const [isTripping, setIsTripping] = useState(false);

    const triggerTrip = useCallback(() => {
        setIsTripping(true);
        // Play haptic-like vibration if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Timeout to reset visual state
        setTimeout(() => setIsTripping(false), 800);
    }, []);

    return { isTripping, triggerTrip };
};
