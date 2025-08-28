
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

// Fetches a list of Piped instances from Github
async function getDynamicPipedInstances(): Promise<string[]> {
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
            if (line.includes('API')) { // skip header
                inTable = true;
                continue;
            }
             if (!inTable || !line.trim().startsWith('|')) {
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
        return fetchedInstances;

    } catch (error) {
        console.warn("Failed to fetch or parse Piped instances, will use fallbacks only:", error);
        return [];
    }
}

/** Curated stable fallback Piped instances */
const curatedPipedInstances = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.syncpundit.io",
    "https://pipedapi.adminforge.de",
    "https://api-piped.mha.fi",
    "https://piped-api.lunar.icu",
];

/** Invidious instances as a secondary fallback */
const invidiousInstances = [
    "https://inv.nadeko.net",
    "https://invidious.projectsegfau.lt",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be",
];

/** Tries fetching stream info from a list of Piped instances. */
async function tryPiped(videoId: string, instances: string[]) {
    if (!instances.length) return null;

    for (const base of instances) {
        try {
            const res = await fetch(`${base}/streams/${videoId}`, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) continue;

            const data = await res.json();
            if (!data.videoStreams || !data.audioStreams) continue; // Skip if response is invalid

            // Success, return mapped data
            return {
                title: data.title || "Untitled Video",
                videoStreams: (data.videoStreams ?? [])
                    .filter((s: any) => s.format === "MPEG_4" && s.videoOnly === false)
                     .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality))
                    .map((s: any) => ({ quality: s.quality, url: s.url })),
                audioStreams: (data.audioStreams ?? [])
                    .filter((s: any) => s.mimeType === "audio/mp4")
                    .sort((a: any, b: any) => b.bitrate - a.bitrate)
                    .slice(0, 1)
                    .map((s: any) => ({ quality: `${Math.round(s.bitrate / 1000)}kbps`, url: s.url })),
            };
        } catch (err) {
            console.warn(`Piped instance ${base} failed or timed out.`, err);
        }
    }
    return null;
}

/** Tries fetching stream info from the Invidious API as a fallback. */
async function tryInvidious(videoId: string) {
    for (const base of invidiousInstances) {
        try {
            const res = await fetch(`${base}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) continue;

            const data = await res.json();
            if (!data.formatStreams && !data.adaptiveFormats) continue;

            return {
                title: data.title || "Untitled Video",
                videoStreams: (data.formatStreams ?? [])
                    .map((s: any) => ({
                        quality: s.qualityLabel || s.resolution || "unknown",
                        url: s.url
                    }))
                    .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)),
                audioStreams: (data.adaptiveFormats ?? [])
                    .filter((s: any) => s.type?.includes("audio/mp4"))
                    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
                    .slice(0, 1)
                    .map((s: any) => ({
                        quality: `${Math.round((s.bitrate || 0) / 1000)}kbps`,
                        url: s.url
                    }))
            };
        } catch (err) {
            console.warn(`Invidious instance ${base} failed or timed out.`, err);
        }
    }
    return null;
}

/** Final fallback: gets basic video metadata from YouTube's oEmbed endpoint. */
async function tryMetadata(videoId: string) {
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!res.ok) throw new Error("oEmbed fetch failed");

        const data = await res.json();
        return {
            title: data.title || "Untitled Video",
            videoStreams: [], // No video streams available from this endpoint
            audioStreams: [], // No audio streams available from this endpoint
        };
    } catch {
        return null; // Failed to get even basic metadata
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

    // 1. Get all available Piped instances (dynamic + curated)
    const dynamicInstances = await getDynamicPipedInstances();
    const allPipedInstances = [...new Set([...dynamicInstances, ...curatedPipedInstances])];
    const shuffledPipedInstances = allPipedInstances.sort(() => Math.random() - 0.5);

    // 2. Try Piped services
    const pipedData = await tryPiped(videoId, shuffledPipedInstances.slice(0, 5)); // Try up to 5 random instances
    if (pipedData && pipedData.videoStreams.length > 0) {
        return NextResponse.json(pipedData);
    }
    
    // 3. Fallback to Invidious
    console.warn("Piped failed, falling back to Invidious...");
    const invidiousData = await tryInvidious(videoId);
    if (invidiousData && invidiousData.videoStreams.length > 0) {
        return NextResponse.json(invidiousData);
    }

    // 4. Final fallback to basic metadata
    console.warn("Invidious failed, falling back to basic metadata...");
    const metaData = await tryMetadata(videoId);
    if (metaData) {
        // Return metadata with a note that streams couldn't be loaded
        return NextResponse.json({ ...metaData, error: "Could not load download links, but title is available." });
    }
    
    // 5. If all services fail
    return NextResponse.json({ error: 'All available downloader services are currently busy or unavailable. Please try again later.' }, { status: 503 });
}
