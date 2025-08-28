
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const videoInfoSchema = z.object({
  url: z.string().url('Please provide a valid YouTube URL.'),
});

// A simple in-memory cache to avoid re-fetching the same URL within a short time
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = videoInfoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().formErrors[0] }, { status: 400 });
    }
    const { url } = validation.data;

    // Check cache first
    const cachedEntry = cache.get(url);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS) {
        return NextResponse.json(cachedEntry.data);
    }

    // IMPORTANT: For this to work, 'yt-dlp' must be installed on the server/environment.
    const { stdout: titleStdout } = await execAsync(`yt-dlp --get-title "${url}"`);
    const title = titleStdout.trim();
    
    const { stdout: formatsStdout } = await execAsync(`yt-dlp -F "${url}"`);

    const lines = formatsStdout.split('\n');
    const formats = new Set<string>();

    // This regex is designed to be more specific, targeting lines that represent
    // combined video and audio streams or common high-quality video-only streams.
    const resolutionRegex = /(\d{3,4}p)/;

    lines.forEach(line => {
        // Skip header lines
        if (line.startsWith('ID') || line.startsWith('---') || line.trim() === '') {
            return;
        }

        const match = line.match(resolutionRegex);
        if (match && match[1]) {
            const quality = match[1];
             // We only care about standard-ish resolutions up to 4k
            const qualityNum = parseInt(quality, 10);
            if (qualityNum <= 2160) {
                 // Check for 'avc1' or 'mp4' for better compatibility
                if (line.includes('avc1') || line.includes('mp4')) {
                    formats.add(quality);
                }
            }
        }
    });

    // Fallback if no specific formats are found
    if (formats.size === 0) {
        formats.add('720p');
        formats.add('360p');
    }

    const sortedFormats = Array.from(formats).sort((a, b) => {
        const qualityA = parseInt(a.replace('p', ''), 10);
        const qualityB = parseInt(b.replace('p', ''), 10);
        return qualityB - qualityA; // Sort descending
    });

    const responseData = { title, formats: sortedFormats };

    // Store in cache
    cache.set(url, { data: responseData, timestamp: Date.now() });
    
    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error('Error in /api/video-info:', e);
    const errorMessage = e.stderr || e.message || 'An unknown error occurred.';
    let userFriendlyError = 'Failed to fetch video information. Please check the URL and try again.';
    if (errorMessage.includes('Unsupported URL')) {
        userFriendlyError = 'The provided URL is not supported.';
    } else if (errorMessage.includes('not found') || errorMessage.includes('command not found')) {
        userFriendlyError = 'The server is not configured to download videos. yt-dlp might be missing.';
    }
    
    return NextResponse.json({ error: userFriendlyError }, { status: 500 });
  }
}
