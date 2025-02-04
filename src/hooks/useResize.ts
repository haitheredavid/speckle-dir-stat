import { useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import useResizeObserver from '@react-hook/resize-observer';

export default function useResize(target: RefObject<HTMLElement>) {
    const [size, setSize] = useState<DOMRectReadOnly>();

    const dimensions = useMemo(() => ({ 
        height: size?.height ?? 0, 
        width: size?.width ?? 0 
    }), [size]);

    useLayoutEffect(() => {
        if (target.current) {
            setSize(target.current.getBoundingClientRect())
        }
    }, [target]);

    useResizeObserver(target, (entry) => setSize(entry.contentRect));

    return dimensions;
}
