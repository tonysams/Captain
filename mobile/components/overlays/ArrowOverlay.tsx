import React, { useMemo } from 'react';
import { Path, Text } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

interface ArrowOverlayProps {
  x: number;  // arrow origin
  y: number;
  dx: number; // direction unit vector
  dy: number;
  color: string;
  label?: string;
  length?: number;
}

/**
 * Directional arrow showing desired movement direction.
 * Arrow head is drawn at the tip.
 */
export function ArrowOverlay({ x, y, dx, dy, color, label, length = 60 }: ArrowOverlayProps) {
  const { arrowPath } = useMemo(() => {
    const mag = Math.sqrt(dx ** 2 + dy ** 2) || 1;
    const nx = dx / mag;
    const ny = dy / mag;
    const tipX = x + nx * length;
    const tipY = y + ny * length;

    // Arrowhead: two lines at ±30° from tip
    const headLen = 14;
    const headAngle = Math.PI / 6; // 30°
    const angle = Math.atan2(ny, nx);
    const h1x = tipX - headLen * Math.cos(angle - headAngle);
    const h1y = tipY - headLen * Math.sin(angle - headAngle);
    const h2x = tipX - headLen * Math.cos(angle + headAngle);
    const h2y = tipY - headLen * Math.sin(angle + headAngle);

    const path = Skia.Path.Make();
    // Shaft
    path.moveTo(x, y);
    path.lineTo(tipX, tipY);
    // Head
    path.moveTo(h1x, h1y);
    path.lineTo(tipX, tipY);
    path.lineTo(h2x, h2y);

    return { arrowPath: path, tipX, tipY };
  }, [x, y, dx, dy, length]);

  const paint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setStrokeWidth(3);
    p.setStyle(1); // stroke
    p.setStrokeCap(1); // round
    p.setAntiAlias(true);
    return p;
  }, [color]);

  return (
    <>
      <Path path={arrowPath} paint={paint} />
      {label && (
        <Text
          x={x + (dx / (Math.sqrt(dx ** 2 + dy ** 2) || 1)) * (length / 2) + 8}
          y={y + (dy / (Math.sqrt(dx ** 2 + dy ** 2) || 1)) * (length / 2)}
          text={label}
          font={null}
          color={color}
        />
      )}
    </>
  );
}
