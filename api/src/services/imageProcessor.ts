import crypto from 'crypto';
import sharp from 'sharp';
import type { FocusArea, PoseKeypoint, SkillLevel } from '../types/index.js';

const MAX_IMAGE_SIZE_KB = parseInt(process.env.MAX_IMAGE_SIZE_KB ?? '200', 10);

/**
 * Compress a base64 JPEG to under MAX_IMAGE_SIZE_KB.
 * Returns a new base64 string suitable for sending to Claude.
 */
export async function compressImageBase64(base64Input: string): Promise<string> {
  const inputBuffer = Buffer.from(base64Input, 'base64');
  const targetBytes = MAX_IMAGE_SIZE_KB * 1024;

  if (inputBuffer.byteLength <= targetBytes) {
    return base64Input;
  }

  // Progressive quality reduction
  let quality = 85;
  let outputBuffer: Buffer;

  do {
    outputBuffer = await sharp(inputBuffer)
      .jpeg({ quality, progressive: false })
      .toBuffer();
    quality -= 10;
  } while (outputBuffer.byteLength > targetBytes && quality > 20);

  return outputBuffer.toString('base64');
}

/**
 * Create a deterministic hash of pose keypoints + context for cache keying.
 * Rounds coordinates to 2 decimal places to tolerate minor jitter.
 */
export function createPoseHash(
  keypoints: PoseKeypoint[],
  skillLevel: SkillLevel,
  focusArea: FocusArea,
): string {
  const normalized = keypoints
    .filter((kp) => kp.visibility > 0.5)
    .sort((a, b) => a.id - b.id)
    .map((kp) => ({
      id: kp.id,
      x: Math.round(kp.x * 100) / 100,
      y: Math.round(kp.y * 100) / 100,
    }));

  const payload = JSON.stringify({ normalized, skillLevel, focusArea });
  return crypto.createHash('sha256').update(payload).digest('hex');
}
