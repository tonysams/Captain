import React, { useMemo } from 'react';
import { Circle, Line, Path, Skia, Text, useFont } from '@shopify/react-native-skia';

interface AngleOverlayProps {
  ax: number; ay: number; // point A (pixel)
  vx: number; vy: number; // vertex (pixel)
  bx: number; by: number; // point B (pixel)
  color: string;
  label?: string;
  labelX: number;
  labelY: number;
}

const ARC_RADIUS = 24;

/**
 * Draws an arc at the vertex showing the angle between points A–Vertex–B,
 * plus two reference lines from the vertex to each point.
 */
export function AngleOverlay({ ax, ay, vx, vy, bx, by, color, label, labelX, labelY }: AngleOverlayProps) {
  const { angleDeg, arcPath } = useMemo(() => {
    const dx1 = ax - vx;
    const dy1 = ay - vy;
    const dx2 = bx - vx;
    const dy2 = by - vy;
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    const dot = dx1 * dx2 + dy1 * dy2;
    const mag1 = Math.sqrt(dx1 ** 2 + dy1 ** 2);
    const mag2 = Math.sqrt(dx2 ** 2 + dy2 ** 2);
    const cosA = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    const angleDeg = Math.round((Math.acos(cosA) * 180) / Math.PI);

    // Arc path from angle1 to angle2
    const startX = vx + ARC_RADIUS * Math.cos(angle1);
    const startY = vy + ARC_RADIUS * Math.sin(angle1);
    const endX = vx + ARC_RADIUS * Math.cos(angle2);
    const endY = vy + ARC_RADIUS * Math.sin(angle2);

    const sweep = angle2 - angle1;
    const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
    const sweepFlag = sweep > 0 ? 1 : 0;

    const path = Skia.Path.Make();
    path.moveTo(startX, startY);
    path.arcToOval(
      { x: vx - ARC_RADIUS, y: vy - ARC_RADIUS, width: ARC_RADIUS * 2, height: ARC_RADIUS * 2 },
      (angle1 * 180) / Math.PI,
      (sweep * 180) / Math.PI,
      false,
    );

    return { angleDeg, arcPath: path };
  }, [ax, ay, vx, vy, bx, by]);

  const paint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(color));
    p.setStrokeWidth(2.5);
    p.setStyle(1); // stroke
    p.setAntiAlias(true);
    return p;
  }, [color]);

  const displayLabel = label ?? `${angleDeg}°`;

  return (
    <>
      {/* Reference lines */}
      <Line p1={{ x: vx, y: vy }} p2={{ x: ax, y: ay }} paint={paint} />
      <Line p1={{ x: vx, y: vy }} p2={{ x: bx, y: by }} paint={paint} />
      {/* Arc */}
      <Path path={arcPath} paint={paint} />
      {/* Vertex dot */}
      <Circle cx={vx} cy={vy} r={4} color={color} />
      {/* Label */}
      {displayLabel && (
        <LabelText text={displayLabel} x={labelX} y={labelY} color={color} />
      )}
    </>
  );
}

function LabelText({ text, x, y, color }: { text: string; x: number; y: number; color: string }) {
  const bgPaint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color('rgba(10,15,30,0.75)'));
    return p;
  }, []);

  return (
    <>
      {/* Background pill */}
      <Path
        path={Skia.Path.Make()}
        paint={bgPaint}
      />
      {/* We use a simple text element; for production consider custom font */}
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
