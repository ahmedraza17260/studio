"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Loader2, AlertCircle, Search } from "lucide-react";

type Stream = {
  quality: string;
  itag: number;
  url: string;
};

type VideoInfo = {
  title: string;
  audioStreams: Stream[];
  videoStreams: Stream[];
  error?: string;
};

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";


  // ------------------- FETCH VIDEO INFO -------------------
  const handleSearch = async () => {
    if (!url) return;
    setIsSearching(true);
    setVideoInfo(null);

    try {
      const res = await fetch(`${BACKEND_URL}/info?url=${encodeURIComponent(url)}`);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      setVideoInfo({
        title: data.title || "Unknown",
        audioStreams: data.audioStreams || [],
        videoStreams: data.videoStreams || [],
        error: data.error,
      });
    } catch (err: any) {
      console.error("Error fetching video info:", err);
      setVideoInfo({
        title: "Error",
        audioStreams: [],
        videoStreams: [],
        error: "Failed to fetch video info. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // ------------------- DOWNLOAD VIDEO / AUDIO -------------------
  const handleDownload = (itag: number, label: string) => {
  if (!videoInfo) return;
  setIsDownloading(label);

  window.open(
    `${BACKEND_URL}/download?url=${encodeURIComponent(url)}&itag=${itag}`,
    "_blank"
  );

  setTimeout(() => setIsDownloading(null), 2000);
};



  const noStreamsAvailable =
    !videoInfo?.audioStreams?.length && !videoInfo?.videoStreams?.length;

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Downloader</CardTitle>
          <CardDescription>
            Paste a YouTube link to fetch download options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter YouTube URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>

          {videoInfo && !isSearching && (
            <>
              <Separator className="my-4" />
              <CardHeader>
                <CardTitle className="text-lg">{videoInfo.title}</CardTitle>
                <CardDescription>
                  {videoInfo?.videoStreams?.length ||
                    videoInfo?.audioStreams?.length
                    ? "Select a format to download."
                    : "No downloads available."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {noStreamsAvailable ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      {videoInfo.error ||
                        "We could not find any downloadable video or audio streams for this URL. Please try again later."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Audio Button */}
                    {videoInfo && videoInfo.audioStreams.length > 0 && (
                      <Button
                        onClick={() => handleDownload(videoInfo.audioStreams[0].itag, "audio")}
                        disabled={isDownloading !== null}
                        variant="secondary"
                        size="lg"
                        className="w-full justify-start text-left h-auto py-3"
                      >
                        {isDownloading === "audio" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        <div className="flex-grow">
                          <p className="font-semibold">Audio Only</p>
                          <p className="text-xs text-muted-foreground">Best Quality (.m4a)</p>
                        </div>
                      </Button>
                    )}

                    {/* Video Buttons */}
                    {videoInfo &&
                      videoInfo.videoStreams.map((format, index) => (
                        <Button
                          key={`${format.itag}-${index}`}
                          onClick={() => handleDownload(format.itag, format.quality)}
                          disabled={isDownloading !== null}
                          size="lg"
                          className="w-full justify-start text-left h-auto py-3"
                        >
                          {isDownloading === format.quality ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          <div className="flex-grow">
                            <p className="font-semibold">{format.quality}</p>
                            <p className="text-xs text-muted-foreground">Video (.mp4)</p>
                          </div>
                        </Button>
                      ))}
                  </div>
                )}
              </CardContent>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


