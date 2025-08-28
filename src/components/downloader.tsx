'use client';

import { useState } from 'react';
import { Download, Loader2, Search, Youtube } from 'lucide-react';

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

interface VideoInfo {
  title: string;
  formats: string[];
}

export function Downloader() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null); // Stores the quality being downloaded
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
      // The backend is not implemented, so we will show a placeholder.
      // In a real application, you would fetch this from your backend.
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVideoInfo({
        title: 'Example Video Title - Implementation Needed',
        formats: ['1080p', '720p', '480p', '360p'],
      });
      
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

  const handleDownload = async (quality: string, type: 'video' | 'audio') => {
    if (!url) return;

    setIsDownloading(quality);
    toast({
      title: 'Starting Download...',
      description: `Backend not implemented. This is a placeholder.`,
      variant: 'destructive'
    });
    
    // Simulate a download process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsDownloading(null);
  };
  
  const isBusy = isSearching || isDownloading !== null;

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  onClick={() => handleDownload('audio', 'audio')}
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
                {videoInfo.formats.map((format) => (
                  <Button
                    key={format}
                    onClick={() => handleDownload(format, 'video')}
                    disabled={isDownloading !== null}
                    size="lg"
                    className="w-full"
                  >
                    {isDownloading === format ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                     <div>
                        <p className="font-semibold">{format}</p>
                        <p className="text-xs text-muted-foreground">Video (.mp4)</p>
                     </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </>
  );
}
