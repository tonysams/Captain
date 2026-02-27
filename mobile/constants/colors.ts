/** Instructor Buddy Design System — Dark mountain-inspired palette */
export const Colors = {
  // Brand
  primary: '#4A9EFF',      // Electric blue — CTAs, active states
  primaryDark: '#2563EB',
  accent: '#7ED4FF',       // Light blue — highlights

  // Semantic overlay colors (match spec)
  overlayRed: '#E53E3E',    // Problem area
  overlayYellow: '#ECC94B', // Observation
  overlayGreen: '#38A169',  // Positive
  overlayBlue: '#3182CE',   // Reference line

  // Background
  bg: '#0A0F1E',            // Deep navy — primary background
  bgCard: '#131929',        // Card surface
  bgInput: '#1E2740',       // Input / secondary surface
  bgOverlay: 'rgba(10,15,30,0.85)',

  // Text
  textPrimary: '#F0F4FF',
  textSecondary: '#8899BB',
  textMuted: '#4A5568',

  // Borders
  border: '#1E2740',
  borderLight: '#2D3A5C',

  // Status
  success: '#38A169',
  warning: '#ECC94B',
  error: '#E53E3E',
  info: '#3182CE',

  // Tab bar
  tabActive: '#4A9EFF',
  tabInactive: '#4A5568',
} as const;

export type ColorKey = keyof typeof Colors;
