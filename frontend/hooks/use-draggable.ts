import * as React from 'react';

interface UseDraggableOptions {
  onDrag: (pos: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * A custom hook that makes an element draggable within a container
 * @param options Configuration options including onDrag callback and container ref
 * @returns An object with event handlers for drag operations
 */
export function useDraggable({ onDrag, containerRef }: UseDraggableOptions) {
  const isDragging = React.useRef(false);

  const getRelativePosition = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Calculate position relative to container (0-1)
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;

    // Clamp values between 0 and 1
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    
    return { x, y };
  }, [containerRef]);

  const handleDrag = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    onDrag(getRelativePosition(e));
  }, [getRelativePosition, onDrag]);

  const handleDragEnd = React.useCallback(() => {
    isDragging.current = false;
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('touchmove', handleDrag);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchend', handleDragEnd);
  }, [handleDrag]);

  const handleDragStart = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    onDrag(getRelativePosition(e.nativeEvent));
    
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
  }, [getRelativePosition, handleDrag, handleDragEnd, onDrag]);

  // Cleanup event listeners on unmount
  React.useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDrag, handleDragEnd]);

  return { handleDragStart };
}
