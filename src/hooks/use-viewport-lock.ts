import { useEffect, useRef } from 'react';

export function useViewportLock(active: boolean): void {
  const originalStyles = useRef<{ overflow: string; overscrollBehavior: string } | null>(null);

  useEffect(() => {
    if (active) {
      originalStyles.current = {
        overflow: document.body.style.overflow,
        overscrollBehavior: document.body.style.overscrollBehavior,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }

    return () => {
      if (originalStyles.current) {
        document.body.style.overflow = originalStyles.current.overflow;
        document.body.style.overscrollBehavior = originalStyles.current.overscrollBehavior;
        originalStyles.current = null;
      }
    };
  }, [active]);
}
