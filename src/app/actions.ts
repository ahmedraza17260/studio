
'use server';

import { z } from 'zod';

const urlSchema = z.string().url('Please provide a valid YouTube URL.');

export async function getVideoInfo(url: string) {
  const validation = urlSchema.safeParse(url);
  if (!validation.success) {
      return { success: false, error: validation.error.flatten().formErrors[0] };
  }
  
  try {
    // In a real application, you would use yt-dlp to get formats.
    // This is a placeholder to simulate fetching formats.
    console.log(`Simulating format fetching for: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate finding available formats
    const availableFormats = ['1080p', '720p', '480p', '360p', 'best'];
    
    return { success: true, formats: availableFormats };

  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred while fetching video info.' };
  }
}
