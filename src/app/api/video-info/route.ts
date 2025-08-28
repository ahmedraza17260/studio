
import { NextRequest, NextResponse } from 'next/server';

// ------------------ HELPERS ------------------

// Extract video ID from various YouTube URLs
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

// Fetch Piped instances dynamically
async function getPipedInstances(): Promise<string[]> {
  try {
    const resp = await fetch(
      "https://raw.githubusercontent.com/wiki/TeamPiped/Piped-Frontend/Instances.md",
      { next: { revalidate: 3600 } } // cache for 1h
    );
    if (!resp.ok) throw new Error("Failed to fetch instances list");

    const body = await resp.text();
    const lines = body.split("\n");
    const instances: string[] = [];
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
        const cols = line.split("|").map((c) => c.trim());
        if (cols[2] && cols[2].startsWith("http")) {
          instances.push(cols[2]);
        }
    }
    
    return instances;
  } catch(err) {
    console.warn("Could not dynamically fetch Piped instances. Using fallbacks.", err);
    return [];
  }
}

// Curated backup Piped instances (stable)
const curatedPipedInstances = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.syncpundit.io",
  "https://pipedapi.moomoo.me",
  "https://piped-api.lunar.icu",
  "https://pipedapi.adminforge.de",
];

// Curated Invidious instances
const invidiousInstances = [
  "https://invidious.snopyta.org",
  "https://vid.puffyan.us",
  "https://inv.nadeko.net",
  "https://invidious.projectsegfau.lt",
  "https://yewtu.be",
];

// ------------------ FORMATTERS ------------------

function formatPipedResponse(data: any) {
  const videoStreams =
    data.videoStreams
      ?.filter((s: any) => s.mimeType === "video/mp4" && !s.videoOnly)
      .map((s: any) => ({
        quality: s.quality,
        url: s.url
      }))
      .sort(
        (a: any, b: any) =>
          parseInt(b.quality) - parseInt(a.quality)
      ) || [];

  const audioStreams =
    data.audioStreams
      ?.filter((s: any) => s.mimeType === "audio/mp4")
      .sort((a: any, b: any) => b.bitrate - a.bitrate)
      .slice(0, 1)
      .map((s: any) => ({
        quality: `${Math.round(s.bitrate / 1000)}kbps`,
        url: s.url
      })) || [];

  return {
    title: data.title || "Untitled Video",
    videoStreams,
    audioStreams
  };
}


function formatInvidiousResponse(data: any) {
    const videoStreams = (data.formatStreams ?? [])
        .filter((s:any) => s.type?.includes("video/mp4"))
        .map((s: any) => ({
            quality: s.qualityLabel || s.resolution || "unknown",
            url: s.url
        }))
        .sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));
    
    const audioStreams = (data.adaptiveFormats ?? [])
        .filter((s: any) => s.type?.includes("audio/mp4"))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
        .slice(0, 1)
        .map((s: any) => ({
            quality: `${Math.round((s.bitrate || 0) / 1000)}kbps`,
            url: s.url
        }));

    return {
        title: data.title || "Untitled Video",
        videoStreams,
        audioStreams
    };
}


// ------------------ MAIN HANDLER ------------------

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "YouTube URL is required." },
      { status: 400 }
    );
  }

  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "Invalid YouTube URL." },
      { status: 400 }
    );
  }
  
  // Combine dynamic and curated lists, shuffle them
  const pipedDynamic = await getPipedInstances();
  const allPiped = [...new Set([...pipedDynamic, ...curatedPipedInstances])].sort(() => Math.random() - 0.5);

  // ------------------ TRY PIPED ------------------
  for (const instance of allPiped) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) {
        console.warn(`Piped instance ${instance} responded with status ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!data.videoStreams && !data.audioStreams) {
        console.warn(`Piped instance ${instance} returned invalid data.`);
        continue;
      }
      return NextResponse.json(formatPipedResponse(data));
    } catch(err) {
      console.warn(`Piped instance ${instance} failed or timed out.`, err);
      continue;
    }
  }

  // ------------------ TRY INVIDIOUS ------------------
  console.warn("All Piped instances failed. Falling back to Invidious.");
  for (const instance of invidiousInstances) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) {
        console.warn(`Invidious instance ${instance} responded with status ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (!data.formatStreams && !data.adaptiveFormats) {
        console.warn(`Invidious instance ${instance} returned invalid data.`);
        continue;
      }
      return NextResponse.json(formatInvidiousResponse(data));
    } catch(err) {
      console.warn(`Invidious instance ${instance} failed or timed out.`, err);
      continue;
    }
  }

  // ------------------ METADATA ONLY FALLBACK ------------------
  console.warn("All Invidious instances failed. Falling back to metadata-only.");
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        title: data.title || "Untitled Video",
        videoStreams: [],
        audioStreams: [],
        error: "Could not load download links, but title is available."
      });
    } else {
        throw new Error(`oEmbed fetch failed with status ${res.status}`);
    }
  } catch(err) {
     console.warn("Metadata fallback (oEmbed) failed.", err);
  }

  return NextResponse.json(
    { error: "All downloader services failed. Please try again later." },
    { status: 503 }
  );
}
