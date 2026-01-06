"use client";

import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HSL, hexToHsl, hslToHex, rgbToHex, hexToRgb, rgbToHsl, hslToRgb, isValidHex, normalizeHex } from '@/lib/color/color-utils';
import { Saturation } from './Saturation';
import { HueSlider } from './HueSlider';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [hsl, setHsl] = React.useState<HSL>({ h: 0, s: 1, l: 0.5 });
  
  const [hexInput, setHexInput] = React.useState(color);
  
  // Update state when the color prop changes
  React.useEffect(() => {
    const newHsl = hexToHsl(color);
    if (newHsl) {
      setHsl(newHsl);
      setHexInput(normalizeHex(color));
    }
  }, [color]);

  // Update HSL and notify parent of color change
  const updateHsl = (newHsl: Partial<HSL>) => {
    const updatedHsl = { ...hsl, ...newHsl };
    setHsl(updatedHsl);
    const newHex = hslToHex(updatedHsl);
    setHexInput(newHex);
    onChange(newHex);
  };

  // Handle HEX input changes
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    
    // Only update if it's a valid hex color
    if (isValidHex(value)) {
      const normalizedHex = normalizeHex(value);
      const newHsl = hexToHsl(normalizedHex);
      if (newHsl) {
        setHsl(newHsl);
        onChange(normalizedHex);
      }
    }
  };

  // Handle blur on HEX input - reset to last valid color if invalid
  const handleHexBlur = () => {
    if (!isValidHex(hexInput)) {
      setHexInput(normalizeHex(color));
    }
  };

  return (
    <div className={cn("grid gap-3 w-full", className)}>
      <Saturation
        hsl={hsl}
        onChange={({ s, l }) => updateHsl({ s, l })}
      />
      
      <HueSlider
        hue={hsl.h}
        onChange={(h) => updateHsl({ h })}
      />
      
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 rounded-md border" 
          style={{ backgroundColor: hslToHex(hsl) }} 
          aria-label="Selected color preview"
        />
        <div className="grid gap-1.5 flex-1">
          <Label htmlFor="hex-color" className="text-xs">Hex</Label>
          <Input
            id="hex-color"
            value={hexInput}
            onChange={handleHexChange}
            onBlur={handleHexBlur}
            className="h-8 font-mono text-sm"
            placeholder="#RRGGBB"
          />
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
