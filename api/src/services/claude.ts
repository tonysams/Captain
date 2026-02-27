import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserMessage } from '../prompts/coachingPrompt.js';
import type { CoachingResponse, FocusArea, PoseKeypoint, SkillLevel } from '../types/index.js';
import { createPoseHash } from './imageProcessor.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

/** In-memory cache: pose hash → coaching response. Cleared on server restart. */
const responseCache = new Map<string, CoachingResponse>();

export interface AnalyzeFrameParams {
  imageBase64: string; // JPEG base64, max 200KB
  poseKeypoints: PoseKeypoint[];
  skillLevel: SkillLevel;
  focusArea: FocusArea;
  previousNote?: string;
}

export async function analyzeFrame(params: AnalyzeFrameParams): Promise<CoachingResponse> {
  const { imageBase64, poseKeypoints, skillLevel, focusArea, previousNote } = params;

  // Cache check: skip re-analysis for identical pose signatures
  const cacheKey = createPoseHash(poseKeypoints, skillLevel, focusArea);
  const cached = responseCache.get(cacheKey);
  if (cached) {
    console.log(`[Claude] Cache hit for pose hash ${cacheKey.slice(0, 8)}`);
    return cached;
  }

  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage({ skillLevel, focusArea, previousNote, poseKeypoints });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Claude returned no text content');
  }

  let coaching: CoachingResponse;
  try {
    coaching = JSON.parse(textContent.text) as CoachingResponse;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${textContent.text.slice(0, 200)}`);
  }

  // Validate required fields
  if (!coaching.primaryObservation?.text || !coaching.cue || !Array.isArray(coaching.overlays)) {
    throw new Error('Claude response missing required fields');
  }

  responseCache.set(cacheKey, coaching);
  return coaching;
}

/** Estimate cost of a session based on frame count (rough approximation) */
export function estimateSessionCost(frameCount: number): number {
  // claude-sonnet-4-6: ~$3/M input tokens, ~$15/M output tokens
  // Average: ~2000 input tokens + image (~1200 tokens) + 200 output tokens per frame
  const inputTokensPerFrame = 3200;
  const outputTokensPerFrame = 200;
  const inputCostPer1M = 3.0;
  const outputCostPer1M = 15.0;

  const totalInput = (frameCount * inputTokensPerFrame) / 1_000_000;
  const totalOutput = (frameCount * outputTokensPerFrame) / 1_000_000;
  return totalInput * inputCostPer1M + totalOutput * outputCostPer1M;
}
