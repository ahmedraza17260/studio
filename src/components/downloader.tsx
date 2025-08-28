'use client';

import { useState } from 'react';
import { Download, Loader2, Search, Youtube, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Stream {
  quality: string;
  url: string;
}

interface VideoInfo {
  title: string;
  videoStreams: Stream[];
  audioStreams: Stream[];
}

export function Downloader() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a YouTube URL.',
      });
      return;
    }

    setIsSearching(true);
    setVideoInfo(null);
    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video information.');
      }
      const data: VideoInfo = await response.json();
      setVideoInfo(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: errorMessage,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = (downloadUrl: string, quality: string) => {
    // The Piped API gives us a direct URL to the video content.
    // Opening this URL in a new tab will trigger the browser's download functionality.
    setIsDownloading(quality);
    window.open(downloadUrl, '_blank');
    
    // We can't know for sure when the download starts or finishes from the client-side
    // when using window.open. We'll reset the downloading state after a short delay
    // to allow the user to perform another download.
    setTimeout(() => {
        setIsDownloading(null);
    }, 2000);
  };
  
  const isBusy = isSearching || isDownloading !== null;
  const noStreamsAvailable = videoInfo && videoInfo.videoStreams.length === 0 && videoInfo.audioStreams.length === 0;

  return (
    <>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Youtube className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">TubeSnag</h1>
        </div>
        <p className="text-muted-foreground">
          Enter a YouTube URL to see available download options.
        </p>
      </div>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>YouTube Downloader</CardTitle>
          <CardDescription>
            Enter a YouTube URL and click Search to begin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex w-full items-end space-x-2">
            <div className="flex-grow space-y-2">
              <Label htmlFor="url">YouTube URL</Label>
              <Input
                id="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setVideoInfo(null); // Reset on new URL
                }}
                disabled={isBusy}
              />
            </div>
            <Button onClick={handleSearch} disabled={isBusy || !url}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>

        {videoInfo && (
          <>
            <Separator />
            <CardHeader>
                <CardTitle className="text-lg">{videoInfo.title}</CardTitle>
                <CardDescription>Select a format to download.</CardDescription>
            </CardHeader>
            <CardContent>
              {noStreamsAvailable ? (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Downloads Found</AlertTitle>
                    <AlertDescription>
                        We could not find any downloadable video or audio streams for this URL. This might be a temporary issue, please try again later.
                    </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {videoInfo.audioStreams.length > 0 && (
                        <Button
                            onClick={() => handleDownload(videoInfo.audioStreams[0].url, 'audio')}
                            disabled={isDownloading !== null}
                            variant="secondary"
                            size="lg"
                            className="w-full"
                        >
                            {isDownloading === 'audio' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                            <Download className="mr-2 h-4 w-4" />
                            )}
                            <div>
                            <p className="font-semibold">Audio Only</p>
                            <p className="text-xs text-muted-foreground">Best Quality (.m4a)</p>
                            </div>
                        </Button>
                    )}
                    {videoInfo.videoStreams.map((format) => (
                    <Button
                        key={format.quality}
                        onClick={() => handleDownload(format.url, format.quality)}
                        disabled={isDownloading !== null}
                        size="lg"
                        className="w-full"
                    >
                        {isDownloading === format.quality ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Download className="mr-2 h-4 w-4" />
                        )}
                        <div>
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
      </Card>
    </>
  );
}
