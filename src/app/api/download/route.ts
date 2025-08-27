import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const downloadSchema = z.object({
  url: z.string().url(),
  quality: z.string(),
  type: z.enum(['video', 'audio']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = downloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { url, quality, type } = validation.data;

    // IMPORTANT: For this to work, 'yt-dlp' must be installed on the server/environment.
    // e.g., using 'pip install yt-dlp' or other package managers.
    // Also, ensure your environment can write to the /tmp directory.
    
    const tempDir = '/tmp';
    const videoId = new URL(url).searchParams.get('v') || `video_${Date.now()}`;
    const fileExtension = type === 'video' ? 'mp4' : 'm4a';
    const outputPath = path.join(tempDir, `${videoId}.${fileExtension}`);
    
    let command: string;

    if (type === 'video') {
      const format = quality === 'best' ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]' : `bestvideo[height<=?${quality.replace('p', '')}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]`;
      command = `yt-dlp -f "${format}" -o "${outputPath}" "${url}"`;
    } else { // audio
      command = `yt-dlp -f bestaudio[ext=m4a] -o "${outputPath}" "${url}"`;
    }

    console.log(`Executing: ${command}`);

    // The 'exec' function is asynchronous. We wrap it in a Promise to use await.
    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          console.error(`stderr: ${stderr}`);
          // Provide more specific error to frontend
          if (stderr.includes('Unsupported URL')) {
            return reject(new Error('The provided URL is not supported.'));
          }
          return reject(new Error('Failed to download video. Check server logs for details.'));
        }
        console.log(`stdout: ${stdout}`);
        resolve();
      });
    });

    // Check if file exists before creating a stream
    if (!fs.existsSync(outputPath)) {
        throw new Error('Downloaded file not found.');
    }

    // At this point, the file is downloaded to the server's /tmp directory.
    // Now, we need to send it to the client.
    const fileStream = fs.createReadStream(outputPath);
    const stats = fs.statSync(outputPath);
    
    // Clean up the file after streaming.
    fileStream.on('close', () => {
        fs.unlink(outputPath, (err) => {
            if (err) console.error(`Failed to delete temp file: ${err}`);
        });
    });

    const contentType = type === 'video' ? 'video/mp4' : 'audio/mp4';
    const contentDisposition = `attachment; filename="${videoId}.${fileExtension}"`;

    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Disposition': contentDisposition,
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start download process.';
    console.error('Download error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
