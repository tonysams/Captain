import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import type { PoseKeypoint } from '../../types/pose';
import type { Overlay, OverlayVisibility } from '../../types/overlay';
import { DEFAULT_OVERLAY_VISIBILITY } from '../../types/overlay';
import { AngleOverlay } from './AngleOverlay';
import { LineOverlay } from './LineOverlay';
import { ArrowOverlay } from './ArrowOverlay';
import { CircleOverlay } from './CircleOverlay';
import { TextOverlay } from './TextOverlay';

interface OverlayCanvasProps {
  overlays: Overlay[];
  keypoints: PoseKeypoint[];
  frameWidth: number;
  frameHeight: number;
  visibility?: OverlayVisibility;
}

/**
 * GPU-accelerated Skia canvas rendered above the video player.
 * Translates normalized overlay coordinates (0–1) to pixel positions.
 */
export function OverlayCanvas({
  overlays,
  keypoints,
  frameWidth,
  frameHeight,
  visibility = DEFAULT_OVERLAY_VISIBILITY,
}: OverlayCanvasProps) {
  /** Build a lookup map: landmark ID → pixel position */
  const keypointMap = useMemo(() => {
    const map = new Map<number, { px: number; py: number; visibility: number }>();
    for (const kp of keypoints) {
      map.set(kp.id, {
        px: kp.x * frameWidth,
        py: kp.y * frameHeight,
        visibility: kp.visibility,
      });
    }
    return map;
  }, [keypoints, frameWidth, frameHeight]);

  const visibleOverlays = overlays.filter((o) => visibility[o.type]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={{ width: frameWidth, height: frameHeight }}>
        {visibleOverlays.map((overlay, i) => {
          const key = `overlay-${i}-${overlay.type}`;
          const labelPx = overlay.x * frameWidth;
          const labelPy = overlay.y * frameHeight;

          switch (overlay.type) {
            case 'angle':
              if ((overlay.points?.length ?? 0) >= 3) {
                const [idA, idVertex, idB] = overlay.points!;
                const a = keypointMap.get(idA);
                const vertex = keypointMap.get(idVertex);
                const b = keypointMap.get(idB);
                if (a && vertex && b) {
                  return (
                    <AngleOverlay
                      key={key}
                      ax={a.px} ay={a.py}
                      vx={vertex.px} vy={vertex.py}
                      bx={b.px} by={b.py}
                      color={overlay.color}
                      label={overlay.label}
                      labelX={labelPx}
                      labelY={labelPy}
                    />
                  );
                }
              }
              return null;

            case 'line':
              if ((overlay.points?.length ?? 0) >= 2) {
                const [idA, idB] = overlay.points!;
                const a = keypointMap.get(idA);
                const b = keypointMap.get(idB);
                if (a && b) {
                  return (
                    <LineOverlay
                      key={key}
                      ax={a.px} ay={a.py}
                      bx={b.px} by={b.py}
                      color={overlay.color}
                      label={overlay.label}
                      labelX={labelPx}
                      labelY={labelPy}
                    />
                  );
                }
              }
              return null;

            case 'arrow':
              return (
                <ArrowOverlay
                  key={key}
                  x={labelPx} y={labelPy}
                  dx={overlay.dx ?? 0} dy={overlay.dy ?? 1}
                  color={overlay.color}
                  label={overlay.label}
                />
              );

            case 'circle':
              if ((overlay.points?.length ?? 0) >= 1) {
                const pt = keypointMap.get(overlay.points![0]);
                if (pt) {
                  return (
                    <CircleOverlay
                      key={key}
                      cx={pt.px} cy={pt.py}
                      color={overlay.color}
                      label={overlay.label}
                      labelX={labelPx}
                      labelY={labelPy}
                    />
                  );
                }
              }
              return null;

            case 'text':
              return (
                <TextOverlay
                  key={key}
                  x={labelPx} y={labelPy}
                  text={overlay.label ?? ''}
                  color={overlay.color}
                />
              );

            default:
              return null;
          }
        })}
      </Canvas>
    </View>
  );
}
