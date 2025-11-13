import * as React from 'react';
import { HSL } from '@/lib/color/color-utils';
import { useDraggable } from '@/hooks/use-draggable';
import { hslToHex } from '@/lib/color/color-utils';

interface SaturationProps {
  hsl: HSL;
  onChange: (newVal: { s: number; l: number }) => void;
}

export function Saturation({ hsl, onChange }: SaturationProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pureHueHex = hslToHex({ h: hsl.h, s: 1, l: 0.5 });

  const { handleDragStart } = useDraggable({
    containerRef,
    onDrag: (pos) => {
      onChange({ s: pos.x, l: 1 - pos.y });
    }
  });

  // Position of the pointer (0-1)
  const pointerY = 1 - hsl.l;
  const pointerX = hsl.s;

  return (
    <div
      ref={containerRef}
      className="w-full h-32 rounded-t-md cursor-pointer relative"
      style={{
        backgroundColor: pureHueHex,
        backgroundImage: 'linear-gradient(to right, #fff, rgba(255,255,255,0)), linear-gradient(to top, #000, rgba(0,0,0,0))'
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-2 -translate-y-2"
        style={{
          position: 'absolute',
          left: `${pointerX * 100}%`,
          top: `${pointerY * 100}%`,
          backgroundColor: hslToHex(hsl),
        }}
      />
    </div>
  );
}
