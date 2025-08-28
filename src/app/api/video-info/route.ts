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

// Fetches a list of Piped instances from Github and combines them with a hardcoded fallback list.
async function getPipedInstances(): Promise<string[]> {
    const fallbackInstances = [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.syncpundit.io",
        "https://api-piped.mha.fi",
        "https://piped-api.lunar.icu",
    ];

    try {
        const resp = await fetch("https://raw.githubusercontent.com/wiki/TeamPiped/Piped-Frontend/Instances.md", { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (!resp.ok) {
            throw new Error(`Failed to fetch instances list, status: ${resp.status}`);
        }
        const body = await resp.text();
        const lines = body.split("\n");
        const fetchedInstances: string[] = [];
        
        // This flag is to ensure we are parsing lines within the markdown table
        let inTable = false;
        for (const line of lines) {
            // A table row in markdown starts and ends with a `|`
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                if (line.includes('API')) { // skip header
                    continue;
                }
                 if (line.includes('---')) { // skip separator
                    continue;
                }
                const columns = line.split('|').map(col => col.trim());
                const apiUrl = columns[2];
                
                // Basic validation for a valid URL
                if (apiUrl && apiUrl.startsWith('http')) {
                    fetchedInstances.push(apiUrl);
                }
            }
        }
        
        // Combine fetched list with fallback list and remove duplicates
        const allInstances = [...new Set([...fetchedInstances, ...fallbackInstances])];

        if (allInstances.length === 0) {
            console.warn("Parsing Piped instances from Github returned no results. Using fallback list.");
            return fallbackInstances.sort(() => Math.random() - 0.5);
        }

        // Shuffle instances to distribute load
        return allInstances.sort(() => Math.random() - 0.5);

    } catch (error) {
        console.error("Failed to fetch or parse Piped instances, falling back to default list:", error);
        // Return a shuffled list of fallbacks if fetching fails
        return fallbackInstances.sort(() => Math.random() - 0.5);
    }
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

    const instances = await getPipedInstances();
    
    // Let's try up to 5 random instances to avoid long delays
    const instancesToTry = instances.slice(0, 5); 
    if(instancesToTry.length === 0) {
       return NextResponse.json({ error: 'Could not find any downloader service instances.' }, { status: 503 });
    }

    for (const instanceUrl of instancesToTry) {
        try {
            const pipedApiUrl = `${instanceUrl}/streams/${videoId}`;
            const apiResponse = await fetch(pipedApiUrl, {
                signal: AbortSignal.timeout(5000) // 5-second timeout for each API call
            });

            if (!apiResponse.ok) {
                // Don't throw, just log and try the next instance
                console.warn(`Instance ${instanceUrl} failed with status ${apiResponse.status}. Trying next...`);
                continue;
            }
            
            let data;
            try {
               data = await apiResponse.json();
            } catch (e) {
                console.warn(`Instance ${instanceUrl} returned invalid JSON. Trying next...`, e);
                continue; // Invalid JSON, try next instance
            }

            // If we get here, the API call was successful
            const videoStreams = data.videoStreams
                ?.filter((s: any) => s.format === 'MPEG_4' && s.videoOnly === false) // Ensure it has audio
                .map((s: any) => ({
                    quality: s.quality,
                    url: s.url,
                }))
                .sort((a: any, b: any) => {
                    const qualityA = parseInt(a.quality);
                    const qualityB = parseInt(b.quality);
                    return qualityB - qualityA;
                }) || [];
            
            const audioStreams = data.audioStreams
                ?.filter((s: any) => s.mimeType === 'audio/mp4')
                 .sort((a: any, b: any) => b.bitrate - a.bitrate)
                 .slice(0, 1) // Get the best quality audio stream
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
            if (error instanceof Error && error.name === 'TimeoutError') {
                 console.warn(`Instance ${instanceUrl} timed out. Trying next...`);
            } else {
                 console.warn(`An error occurred with instance ${instanceUrl}. Trying next...`, error);
            }
            // Continue to the next instance
        }
    }

    // If all instances failed
    return NextResponse.json({ error: 'All available downloader services are currently busy or unavailable. Please try again later.' }, { status: 503 });
}
