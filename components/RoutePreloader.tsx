import React, { useEffect } from 'react';
import { ROUTE_GROUPS } from '../routes';

/**
 * RoutePreloader — silently fetches all lazy route chunks in the background
 * after the main app shell is visible and idle.
 *
 * This eliminates the "Failed to fetch dynamically imported module" error
 * users see when navigating to a page whose chunk hasn't loaded yet.
 *
 * Strategy:
 *  1. Wait 2 seconds after mount so the visible page is fully rendered first.
 *  2. Queue all lazy components for background import using requestIdleCallback
 *     (or setTimeout fallback for browsers that don't support it).
 *  3. Each import is wrapped in a try/catch — if a chunk 404s (stale deploy),
 *     the user gets no error, only a silent retry on next navigation.
 */
export const RoutePreloader: React.FC = () => {
    useEffect(() => {
        // Collect all lazy component loaders from routes
        const allComponents = [
            ...ROUTE_GROUPS.flatMap(g => g.items.map(i => i.component)),
        ];

        let timer: ReturnType<typeof setTimeout>;

        const preloadAll = () => {
            allComponents.forEach((component, idx) => {
                const delay = idx * 80; // stagger by 80ms each to avoid bandwidth spike
                const scheduleImport = (fn: () => void) => {
                    if (typeof (window as any).requestIdleCallback === 'function') {
                        (window as any).requestIdleCallback(fn, { timeout: 5000 });
                    } else {
                        setTimeout(fn, delay + 2000);
                    }
                };

                scheduleImport(() => {
                    try {
                        // React.lazy components have a _payload with a _result (the import fn)
                        // We call ._payload._fn() to trigger the dynamic import
                        const lazy = component as any;
                        if (lazy._payload && typeof lazy._payload._fn === 'function') {
                            lazy._payload._fn().catch(() => {
                                // Silently ignore stale chunk errors during prefetch
                            });
                        }
                    } catch {
                        // Silently ignore any prefetch errors
                    }
                });
            });
        };

        // Wait 2.5s after mount before starting prefetch
        timer = setTimeout(preloadAll, 2500);

        return () => clearTimeout(timer);
    }, []);

    return null;
};

export default RoutePreloader;
