import { NextRequest, NextResponse } from 'next/server';

// Helper function to extract video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return match[2];
    }
    return null;
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) {
        return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 });
    }

    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL provided.' }, { status: 400 });
    }

    try {
        const pipedApiUrl = `https://pipedapi.kavin.rocks/streams/${videoId}`;
        const apiResponse = await fetch(pipedApiUrl);

        if (!apiResponse.ok) {
            // Try to get a more specific error from the Piped API
            const errorText = await apiResponse.text();
            console.error(`Piped API Error (${apiResponse.status}): ${errorText}`);
            return NextResponse.json({ error: `Failed to fetch from Piped API: ${apiResponse.statusText}` }, { status: apiResponse.status });
        }

        const data = await apiResponse.json();

        // We only want to return MP4 video streams
        const videoStreams = data.videoStreams
            ?.filter((s: any) => s.format === 'MPEG_4')
            .map((s: any) => ({
                quality: s.quality,
                url: s.url,
            }))
            // Sort by quality, descending (e.g., 1080p, 720p, ...)
            .sort((a: any, b: any) => {
                const qualityA = parseInt(a.quality);
                const qualityB = parseInt(b.quality);
                return qualityB - qualityA;
            }) || [];
        
        // Find the best quality M4A audio stream
        const audioStreams = data.audioStreams
            ?.filter((s: any) => s.mimeType === 'audio/mp4')
             .sort((a: any, b: any) => b.bitrate - a.bitrate)
             .slice(0, 1) // Get only the best one
             .map((s: any) => ({
                quality: `${Math.round(s.bitrate / 1000)}kbps`,
                url: s.url
             })) || [];


        const response = {
            title: data.title || 'Untitled Video',
            videoStreams,
            audioStreams,
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching video info:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 });
    }
}
