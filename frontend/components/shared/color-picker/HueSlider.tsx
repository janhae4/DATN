import * as React from 'react';
import { HSL, hslToHex } from '@/lib/color/color-utils';
import { useDraggable } from '@/hooks/use-draggable';

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

export function HueSlider({ hue, onChange }: HueSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { handleDragStart } = useDraggable({
    containerRef,
    onDrag: (pos) => {
      onChange(pos.x * 360); // Convert 0-1 to 0-360 degrees
    }
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-4 rounded-md cursor-pointer relative mt-2"
      style={{
        backgroundImage: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      <div
        className="w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-2"
        style={{
          position: 'absolute',
          left: `${(hue / 360) * 100}%`,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: hslToHex({ h: hue, s: 1, l: 0.5 }),
        }}
      />
    </div>
  );
}
