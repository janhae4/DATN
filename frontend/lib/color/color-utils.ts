// Color type definitions
export interface HSL { h: number; s: number; l: number; }
export interface RGB { r: number; g: number; b: number; }

/**
 * Convert HSL to RGB color space
 * @param hsl Color in HSL format (h: 0-360, s: 0-1, l: 0-1)
 * @returns Color in RGB format (r: 0-255, g: 0-255, b: 0-255)
 */
export function hslToRgb({ h, s, l }: HSL): RGB {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }
    return { 
        r: Math.round(r * 255), 
        g: Math.round(g * 255), 
        b: Math.round(b * 255) 
    };
}

/**
 * Convert RGB to HSL color space
 * @param rgb Color in RGB format (r: 0-255, g: 0-255, b: 0-255)
 * @returns Color in HSL format (h: 0-360, s: 0-1, l: 0-1)
 */
export function rgbToHsl({ r, g, b }: RGB): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

/**
 * Convert a single RGB component to 2-digit hex string
 */
function componentToHex(c: number): string {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Convert RGB to HEX color string
 * @param rgb Color in RGB format
 * @returns HEX color string (e.g., "#FF0000")
 */
export function rgbToHex({ r, g, b }: RGB): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Convert HEX color string to RGB
 * @param hex HEX color string (e.g., "#FF0000" or "FF0000")
 * @returns RGB color object or null if invalid
 */
export function hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convert HEX to HSL color space
 * @param hex HEX color string
 * @returns HSL color object or null if invalid
 */
export function hexToHsl(hex: string): HSL | null {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHsl(rgb) : null;
}

/**
 * Convert HSL to HEX color string
 * @param hsl Color in HSL format
 * @returns HEX color string
 */
export function hslToHex(hsl: HSL): string {
    return rgbToHex(hslToRgb(hsl));
}

/**
 * Validate if a string is a valid HEX color
 */
export function isValidHex(hex: string): boolean {
    return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/i.test(hex);
}

/**
 * Format HEX string to always have # prefix and 6 digits
 */
export function normalizeHex(hex: string): string {
    let normalized = hex.startsWith('#') ? hex : `#${hex}`;
    if (normalized.length === 4) { // Handle shorthand like #abc
        normalized = '#' + normalized[1] + normalized[1] + 
                     normalized[2] + normalized[2] + 
                     normalized[3] + normalized[3];
    }
    return normalized.toLowerCase();
}
