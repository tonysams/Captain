import React, { useMemo } from 'react';
import { Circle, Line, Text } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

interface LineOverlayProps {
  ax: number; ay: number;
  bx: number; by: number;
  color: string;
  label?: string;
  labelX: number;
  labelY: number;
}

/**
 * Draws a dashed alignment line between two pose landmarks.
 * Used for shoulder-hip-ankle plumb lines and alignment checks.
 */
export function LineOverlay({ ax, ay, bx, by, color, label, labelX, labelY }: LineOverlayProps) {
  const paint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setStrokeWidth(2);
    p.setStyle(1); // stroke
    p.setAntiAlias(true);
    // Dashed effect via path effect
    const dashEffect = Skia.PathEffect.MakeDash([8, 4], 0);
    if (dashEffect) p.setPathEffect(dashEffect);
    return p;
  }, [color]);

  return (
    <>
      <Line p1={{ x: ax, y: ay }} p2={{ x: bx, y: by }} paint={paint} />
      <Circle cx={ax} cy={ay} r={3} color={color} />
      <Circle cx={bx} cy={by} r={3} color={color} />
      {label && (
        <Text x={labelX} y={labelY} text={label} font={null} color={color} />
      )}
    </>
  );
}
