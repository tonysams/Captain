import React, { useMemo } from 'react';
import { Circle, Text } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

interface CircleOverlayProps {
  cx: number;
  cy: number;
  color: string;
  label?: string;
  labelX: number;
  labelY: number;
  radius?: number;
}

/**
 * Pulsing highlight ring around a specific joint.
 * Used to draw attention to a particular landmark (e.g. "watch this knee").
 */
export function CircleOverlay({
  cx,
  cy,
  color,
  label,
  labelX,
  labelY,
  radius = 18,
}: CircleOverlayProps) {
  const strokePaint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setStrokeWidth(2.5);
    p.setStyle(1); // stroke
    p.setAntiAlias(true);
    return p;
  }, [color]);

  const fillPaint = useMemo(() => {
    // Parse hex to rgba with low opacity for inner fill
    const p = Skia.Paint();
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    p.setColor(Skia.Color([r, g, b, 0.15]));
    p.setStyle(0); // fill
    p.setAntiAlias(true);
    return p;
  }, [color]);

  return (
    <>
      {/* Filled inner circle */}
      <Circle cx={cx} cy={cy} r={radius} paint={fillPaint} />
      {/* Outer ring */}
      <Circle cx={cx} cy={cy} r={radius} paint={strokePaint} />
      {/* Center dot */}
      <Circle cx={cx} cy={cy} r={3} color={color} />
      {label && (
        <Text x={labelX} y={labelY} text={label} font={null} color={color} />
      )}
    </>
  );
}
