/** Human-readable names for all 33 BlazePose landmarks */
export const LANDMARK_LABELS: Record<number, string> = {
  0: 'Nose',
  1: 'Left Eye (inner)',
  2: 'Left Eye',
  3: 'Left Eye (outer)',
  4: 'Right Eye (inner)',
  5: 'Right Eye',
  6: 'Right Eye (outer)',
  7: 'Left Ear',
  8: 'Right Ear',
  9: 'Mouth (left)',
  10: 'Mouth (right)',
  11: 'Left Shoulder',
  12: 'Right Shoulder',
  13: 'Left Elbow',
  14: 'Right Elbow',
  15: 'Left Wrist',
  16: 'Right Wrist',
  17: 'Left Pinky',
  18: 'Right Pinky',
  19: 'Left Index',
  20: 'Right Index',
  21: 'Left Thumb',
  22: 'Right Thumb',
  23: 'Left Hip',
  24: 'Right Hip',
  25: 'Left Knee',
  26: 'Right Knee',
  27: 'Left Ankle',
  28: 'Right Ankle',
  29: 'Left Heel',
  30: 'Right Heel',
  31: 'Left Foot Index',
  32: 'Right Foot Index',
};

/** Connections for rendering a skeleton (pairs of landmark IDs) */
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32],
];

export const FOCUS_AREA_LABELS: Record<string, string> = {
  carved_turns: 'Carved Turns',
  parallel_turns: 'Parallel Turns',
  moguls: 'Moguls',
  powder: 'Powder',
  athletic_stance: 'Athletic Stance',
  edge_control: 'Edge Control',
  pole_plant: 'Pole Plant',
  general: 'General Technique',
};

export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};
