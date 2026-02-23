import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useViewportLock } from '@/hooks/use-viewport-lock';

describe('useViewportLock', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  });

  it('applies overflow hidden and overscroll-behavior none when active', () => {
    renderHook(() => useViewportLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');
  });

  it('does not modify body styles when inactive', () => {
    renderHook(() => useViewportLock(false));
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.overscrollBehavior).toBe('');
  });

  it('restores original styles when deactivated', () => {
    document.body.style.overflow = 'auto';
    document.body.style.overscrollBehavior = 'auto';

    const { rerender } = renderHook(
      ({ active }) => useViewportLock(active),
      { initialProps: { active: true } },
    );

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');

    rerender({ active: false });

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.overscrollBehavior).toBe('auto');
  });

  it('restores original styles on unmount', () => {
    document.body.style.overflow = 'scroll';
    document.body.style.overscrollBehavior = 'contain';

    const { unmount } = renderHook(() => useViewportLock(true));

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.body.style.overscrollBehavior).toBe('none');

    unmount();

    expect(document.body.style.overflow).toBe('scroll');
    expect(document.body.style.overscrollBehavior).toBe('contain');
  });
});
