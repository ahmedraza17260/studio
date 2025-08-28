import { NextRequest, NextResponse } from 'next/server';
import ytdlp from 'yt-dlp-exec';

// ------------------ HELPERS ------------------

// Extract YouTube video ID (for fallback APIs)
function getYouTubeVideoId(url: string): string | null {
  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?$/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Curated Piped/Invidious instances
const curatedPipedInstances = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.syncpundit.io",
  "https://pipedapi.moomoo.me",
  "https://piped-api.lunar.icu",
  "https://pipedapi.adminforge.de",
];

const invidiousInstances = [
  "https://invidious.snopyta.org",
  "https://vid.puffyan.us",
  "https://inv.nadeko.net",
  "https://invidious.projectsegfau.lt",
  "https://yewtu.be",
];

// ------------------ FORMATTERS ------------------
function formatStreams(title: string, videoStreams: any[], audioStreams: any[], error?: string) {
  return { title: title || "Untitled Video", videoStreams: videoStreams || [], audioStreams: audioStreams || [], error };
}

// Format yt-dlp response
function formatYTDLPResponse(info: any) {
  const videoStreams = (info.formats ?? [])
    .filter((f: any) => f.vcodec !== "none" && f.ext === "mp4")
    .map((f: any) => ({ quality: f.format_note || f.height + "p", url: f.url }));

  const audioStreams = (info.formats ?? [])
    .filter((f: any) => f.acodec !== "none" && f.vcodec === "none")
    .map((f: any) => ({ quality: f.abr + "kbps", url: f.url }));

  return formatStreams(info.title, videoStreams, audioStreams);
}

// Try fetching from instances (Piped/Invidious)
async function tryInstances(instances: string[], urlBuilder: (inst: string, vid: string) => string, formatter: (data: any) => any, videoId: string) {
  const shuffled = shuffleArray(instances);
  for (const inst of shuffled) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(urlBuilder(inst, videoId), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const data = await res.json();
      const formatted = formatter(data);
      if (formatted.videoStreams.length || formatted.audioStreams.length) return formatted;
    } catch (err) {
      continue;
    }
  }
  return null;
}

// ------------------ MAIN HANDLER ------------------
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });

  // Try yt-dlp first
  try {
    const info = await ytdlp(url, { dumpSingleJson: true, noWarnings: true, preferFreeFormats: true, youtubeSkipDashManifest: true });
    const ytResult = formatYTDLPResponse(info);
    if (ytResult.videoStreams.length || ytResult.audioStreams.length) return NextResponse.json(ytResult);
  } catch (err) {
    console.warn("yt-dlp failed, falling back to Piped/Invidious.", err);
  }

  // Fallback to Piped/Invidious
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    // Try Piped
    const pipedResult = await tryInstances(curatedPipedInstances, (inst, vid) => `${inst}/streams/${vid}`, (data) => {
      const videoStreams = (data.videoStreams ?? []).map((s: any) => ({ quality: s.quality, url: s.url }));
      const audioStreams = (data.audioStreams ?? []).map((s: any) => ({ quality: s.quality, url: s.url }));
      return formatStreams(data.title, videoStreams, audioStreams);
    }, videoId);

    if (pipedResult) return NextResponse.json(pipedResult);

    // Try Invidious
    const invidResult = await tryInstances(invidiousInstances, (inst, vid) => `${inst}/api/v1/videos/${vid}`, (data) => {
      const videoStreams = (data.formatStreams ?? []).map((s: any) => ({ quality: s.qualityLabel || "unknown", url: s.url }));
      const audioStreams = (data.adaptiveFormats ?? []).map((s: any) => ({ quality: s.bitrate + "kbps", url: s.url }));
      return formatStreams(data.title, videoStreams, audioStreams);
    }, videoId);

    if (invidResult) return NextResponse.json(invidResult);
  }

  // Fallback to metadata
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(formatStreams(data.title, [], [], "Download links unavailable. You can watch the video on YouTube."));
    }
  } catch {}

  return NextResponse.json({ error: "All download services unavailable." }, { status: 503 });
}
