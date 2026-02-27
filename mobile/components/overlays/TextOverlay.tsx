import React, { useMemo } from 'react';
import { RoundedRect, Text } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

interface TextOverlayProps {
  x: number;
  y: number;
  text: string;
  color: string;
}

const PADDING = 6;
const FONT_SIZE = 13;

/**
 * Floating text annotation with a dark background pill for readability.
 * Used for general observations not tied to a specific landmark.
 */
export function TextOverlay({ x, y, text, color }: TextOverlayProps) {
  const bgPaint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color('rgba(10,15,30,0.82)'));
    p.setAntiAlias(true);
    return p;
  }, []);

  // Approximate text width (real measurement requires loaded font)
  const approxWidth = text.length * 7.5 + PADDING * 2;
  const height = FONT_SIZE + PADDING * 2;

  return (
    <>
      {/* Background pill */}
      <RoundedRect
        x={x - PADDING}
        y={y - FONT_SIZE}
        width={approxWidth}
        height={height}
        r={4}
        paint={bgPaint}
      />
      <Text
        x={x}
        y={y}
        text={text}
        font={null}
        color={color}
      />
    </>
  );
}
