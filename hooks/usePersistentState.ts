import { useState, useEffect } from 'react';

export function usePersistentState<T>(key: string, initialState: T): [T, (val: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(`relay_school_${key}`);
            return saved ? JSON.parse(saved) : initialState;
        } catch (e) {
            return initialState;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(`relay_school_${key}`, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }, [key, state]);

    return [state, setState];
}
