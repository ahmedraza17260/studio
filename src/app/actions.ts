'use server';

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const urlSchema = z.string().url('Please provide a valid YouTube URL.');

// This function is no longer used by the frontend but is kept here
// as a reference or for potential future use. The logic has been
// consolidated into the /api/download route.
export async function getVideoInfo(url: string) {
  const validation = urlSchema.safeParse(url);
  if (!validation.success) {
      return { success: false, error: validation.error.flatten().formErrors[0] };
  }
  
  try {
    // To make this work, you need to have yt-dlp installed on your server.
    // For local development: pip install yt-dlp
    // For production, your server environment must have yt-dlp in its PATH.
    const { stdout } = await execAsync(`yt-dlp -F "${url}"`);

    // This is a simplified parser. A more robust solution would be better.
    const lines = stdout.split('\n');
    const formats = lines
      .map(line => {
        if (line.includes('1080p') && line.includes('video only')) return '1080p';
        if (line.includes('720p') && line.includes('video only')) return '720p';
        if (line.startsWith('22 ')) return '720p'; // often the 720p mp4 default
        return null;
      })
      .filter((f): f is string => f !== null);
      
    const uniqueFormats = [...new Set(formats)];
    if (!uniqueFormats.includes('720p')) {
        uniqueFormats.unshift('720p');
    }

    return { success: true, formats: ['best', ...uniqueFormats] };

  } catch (e: any) {
    console.error(e);
    // This error can happen if yt-dlp is not installed or if the URL is invalid.
    const errorMessage = e.stderr || e.message || 'Failed to fetch video formats.';
    return { success: false, error: `Failed to fetch video formats. Ensure the URL is correct and yt-dlp is installed on the server. Details: ${errorMessage}` };
  }
}
