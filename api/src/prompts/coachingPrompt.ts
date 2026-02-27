import type { FocusArea, PoseKeypoint, SkillLevel } from '../types/index.js';

/** Key MediaPipe landmark IDs relevant to ski technique */
const LANDMARK_NAMES: Record<number, string> = {
  0: 'nose',
  11: 'left_shoulder',
  12: 'right_shoulder',
  15: 'left_wrist',
  16: 'right_wrist',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
};

const FOCUS_AREA_CONTEXT: Record<FocusArea, string> = {
  carved_turns: 'Focus on edge angle, knee flex, and hip-shoulder separation during carving.',
  parallel_turns: 'Focus on symmetric stance, edge transitions, and fore-aft balance.',
  moguls: 'Focus on absorption, knee flex, and upper body stability through bumps.',
  powder: 'Focus on equal weight distribution, upper body calm, and rhythmic turns.',
  athletic_stance: 'Focus on balanced stance width, knee flex, and forward lean.',
  edge_control: 'Focus on ankle flex, boot cuff contact, and progressive edge engagement.',
  pole_plant: 'Focus on wrist motion, timing relative to turn initiation, and arm position.',
  general: 'Provide broad technique assessment focusing on the most impactful improvement.',
};

const SKILL_LEVEL_CONTEXT: Record<SkillLevel, string> = {
  beginner: 'Use simple, encouraging language. Focus on one fundamental at a time.',
  intermediate:
    'Student has basic parallel turns. Focus on refinement of technique and edge control.',
  advanced:
    'Student skis black runs confidently. Focus on efficiency, timing, and subtle refinements.',
  expert: 'High-performance skier. Focus on race technique, precision, and maximum efficiency.',
};

export function buildSystemPrompt(): string {
  return `You are an expert PSIA Level III certified alpine ski instructor with 20+ years of coaching experience. You analyze ski technique from video frames with pose estimation data.

COACHING PHILOSOPHY:
- Identify 1-2 high-impact observations per frame ONLY — never more
- Frame all feedback as what to move TOWARD, not what to avoid
- Use PSIA Athletic Stance vocabulary: "fore-aft balance", "edge angle", "angulation", "countered", "stacked"
- Be concrete and visual — reference body parts visible on screen
- One clear, actionable cue per frame

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact schema:
{
  "primaryObservation": {
    "text": "Brief observation (max 20 words)",
    "confidence": 0.0-1.0
  },
  "overlays": [
    {
      "type": "angle" | "line" | "arrow" | "circle" | "text",
      "points": [landmarkId1, landmarkId2, landmarkId3],
      "label": "Human-readable label (e.g. 'Knee flex: 145°')",
      "color": "#hexcolor",
      "x": 0.0-1.0,
      "y": 0.0-1.0,
      "dx": optional_number,
      "dy": optional_number
    }
  ],
  "cue": "Single actionable coaching cue (max 12 words)"
}

OVERLAY TYPES:
- "angle": Arc between 3 landmark points showing joint angle. points = [landmarkA, vertex, landmarkB]
- "line": Straight line between 2 landmarks. points = [landmarkA, landmarkB]
- "arrow": Directional movement indicator. Include dx/dy for direction unit vector
- "circle": Highlight ring around 1 landmark. points = [landmarkId]
- "text": Floating label. No points needed

LANDMARK IDs (MediaPipe BlazePose):
${Object.entries(LANDMARK_NAMES)
  .map(([id, name]) => `  ${id}: ${name}`)
  .join('\n')}

COLOR GUIDE:
- Red (#E53E3E): Problem area needing correction
- Yellow (#ECC94B): Observation, moderate concern
- Green (#38A169): Positive reinforcement
- Blue (#3182CE): Reference line / alignment

Return ONLY the JSON object. No markdown, no explanation outside the JSON.`;
}

export function buildUserMessage(params: {
  skillLevel: SkillLevel;
  focusArea: FocusArea;
  previousNote?: string;
  poseKeypoints: PoseKeypoint[];
}): string {
  const { skillLevel, focusArea, previousNote, poseKeypoints } = params;

  const relevantKeypoints = poseKeypoints.filter(
    (kp) => LANDMARK_NAMES[kp.id] !== undefined && kp.visibility > 0.5,
  );

  return `Analyze this ski technique frame.

STUDENT CONTEXT:
- Skill level: ${skillLevel}
- ${SKILL_LEVEL_CONTEXT[skillLevel]}
- Focus area: ${focusArea.replace(/_/g, ' ')}
- ${FOCUS_AREA_CONTEXT[focusArea]}
${previousNote ? `- Previous session note: "${previousNote}"` : ''}

POSE DATA (visible landmarks, confidence > 0.5):
${JSON.stringify(relevantKeypoints, null, 2)}

Provide your coaching analysis as JSON.`;
}
