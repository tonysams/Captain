export type OverlayType = 'angle' | 'line' | 'arrow' | 'circle' | 'text';

export interface Overlay {
  type: OverlayType;
  /** MediaPipe landmark IDs referenced by this overlay */
  points?: number[];
  label?: string;
  color: string;
  /** Normalized position for label or text (0–1 relative to frame) */
  x: number;
  y: number;
  /** Direction unit vector for arrow overlays */
  dx?: number;
  dy?: number;
}

/** Overlay with computed pixel positions (after scaling to screen) */
export interface RenderedOverlay extends Overlay {
  px: number;   // pixel x
  py: number;   // pixel y
  pWidth: number;
  pHeight: number;
}

export type OverlayVisibility = Record<OverlayType, boolean>;

export const DEFAULT_OVERLAY_VISIBILITY: OverlayVisibility = {
  angle: true,
  line: true,
  arrow: true,
  circle: true,
  text: true,
};
