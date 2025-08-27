
'use server';

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const urlSchema = z.string().url('Please provide a valid YouTube URL.');

export async function getVideoInfo(url: string) {
  const validation = urlSchema.safeParse(url);
  if (!validation.success) {
      return { success: false, error: validation.error.flatten().formErrors[0] };
  }
  
  try {
    // To make this work, you need to have yt-dlp installed on your server.
    // You can install it with: pip install yt-dlp
    const { stdout } = await execAsync(`yt-dlp -F "${url}"`);

    // This is a simplified parser. A more robust solution would be better.
    const lines = stdout.split('\n');
    const formats = lines
      .filter(line => line.startsWith('22 ') || (line.includes('video only') && (line.includes('1080p') || line.includes('720p'))))
      .map(line => {
        if(line.startsWith('22 ')) return '720p';
        if(line.includes('1080p')) return '1080p';
        return 'other';
      })
      .filter(f => f !== 'other');
      
    const uniqueFormats = [...new Set(formats)];
    if (!uniqueFormats.includes('720p')) {
        uniqueFormats.unshift('720p'); // a common default
    }

    return { success: true, formats: ['best', ...uniqueFormats] };

  } catch (e) {
    console.error(e);
    // This error can happen if yt-dlp is not installed or if the URL is invalid.
    return { success: false, error: 'Failed to fetch video formats. Ensure the URL is correct and yt-dlp is installed on the server.' };
  }
}
