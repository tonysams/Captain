import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/** Upload a frame image to Supabase Storage, return public URL */
export async function uploadFrameImage(
  sessionId: string,
  frameIndex: number,
  imageBuffer: Buffer,
): Promise<string> {
  const path = `sessions/${sessionId}/frames/${frameIndex}.jpg`;

  const { error } = await supabase.storage
    .from('instructor-buddy')
    .upload(path, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from('instructor-buddy').getPublicUrl(path);
  return data.publicUrl;
}
