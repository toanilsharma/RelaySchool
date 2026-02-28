import React, { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface OdometerProps {
    value: number;
    format?: (val: number) => string;
    className?: string;
}

const Odometer: React.FC<OdometerProps> = ({ 
    value, 
    format = (v) => v.toFixed(0), 
    className = ''
}) => {
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;

        // Parse current value from text content (stripping non-numeric characters except . and -)
        const currentText = node.textContent?.replace(/[^0-9.-]/g, '') || '0';
        const currentVal = parseFloat(currentText) || 0;

        const controls = animate(currentVal, value, {
            duration: 0.3,
            ease: "easeOut",
            onUpdate(val) {
                if (nodeRef.current) {
                    nodeRef.current.textContent = format(val);
                }
            }
        });

        return () => controls.stop();
    }, [value, format]);

    return <span ref={nodeRef} className={className}>{format(value)}</span>;
};

export default Odometer;
