import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    if (!ytdl.validateURL(videoUrl)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Get video info
    const info = await ytdl.getInfo(videoUrl);

    // Extract audio formats
    const audioStreams = info.formats
      .filter(
        (f) => f.hasAudio && !f.hasVideo && f.mimeType?.includes("audio/mp4")
      )
      .map((f) => ({
        itag: f.itag,
        quality: `${f.audioBitrate} kbps`,
        url: f.url,
      }));

    // Extract progressive video formats (video+audio combined)
    const videoStreams = info.formats
      .filter(f => f.hasVideo && f.container === "mp4" && f.qualityLabel)
      .map((f, index) => ({
        itag: f.itag,
        quality: f.qualityLabel + (f.hasAudio ? " (AV)" : " (Video only)"),
        url: f.url,
        hasAudio: f.hasAudio,
      }));


    return NextResponse.json({
      title: info.videoDetails.title,
      audioStreams,
      videoStreams,
    });
  } catch (err: any) {
    console.error("ytdl-core error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch video info." },
      { status: 500 }
    );
  }
}
