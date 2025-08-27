
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getVideoInfo } from '@/app/actions';

export function Downloader() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('');
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a YouTube URL first.',
      });
      return;
    }

    setIsSearching(true);
    setAvailableFormats([]);
    setQuality('');

    const result = await getVideoInfo(url);
    setIsSearching(false);

    if (result.success) {
      setAvailableFormats(result.formats!);
      setQuality(result.formats![0]); // Default to the first available format
      toast({
        title: 'Video Found!',
        description: 'Available formats have been loaded.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: result.error,
      });
    }
  };

  const handleDownload = async (type: 'video' | 'audio') => {
     if (!url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a YouTube URL to download.',
      });
      return;
    }
    if (type === 'video' && !quality) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please search for the video and select a quality first.',
        });
        return;
    }
    
    setIsDownloading(true);

    toast({
      title: 'Starting Download...',
      description: `Your ${type} is being prepared. This may take a moment.`,
    });

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality, type }),
      });

      if (response.ok) {
        toast({
          title: 'Download Ready!',
          description: 'Your download will begin shortly.',
        });
        // The browser will handle the file download.
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `download.${type === 'video' ? 'mp4' : 'm4a'}`;
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch && filenameMatch.length > 1) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
        
      } else {
        const data = await response.json();
        throw new Error(data.error || 'An unknown error occurred.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: errorMessage,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const isBusy = isSearching || isDownloading;

  return (
    <>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Youtube className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold tracking-tight">TubeSnag</h1>
        </div>
        <p className="text-muted-foreground">
          Your one-stop solution for downloading YouTube videos and audio.
        </p>
      </div>
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>YouTube Downloader</CardTitle>
          <CardDescription>
            Enter a YouTube URL, find available formats, and start downloading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    setAvailableFormats([]);
                    setQuality('');
                }}
                disabled={isBusy}
              />
              <Button onClick={handleSearch} disabled={isBusy || !url} className="w-full sm:w-auto flex-shrink-0">
                {isSearching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>
          
          {availableFormats.length > 0 && (
            <div className="space-y-2">
                <Label htmlFor="quality">Video Quality</Label>
                <Select
                value={quality}
                onValueChange={setQuality}
                disabled={isBusy}
                >
                <SelectTrigger id="quality" className="w-full">
                    <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                    {availableFormats.map(format => (
                        <SelectItem key={format} value={format}>
                            {format === 'best' ? 'Best available' : format}
                        </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Button
            onClick={() => handleDownload('audio')}
            disabled={isBusy || !url}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isDownloading && <Download className="mr-2 h-4 w-4" />}
            Download Audio Only
          </Button>
          <Button onClick={() => handleDownload('video')} disabled={isBusy || !url || !quality} className="w-full sm:w-auto">
            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isDownloading && <Download className="mr-2 h-4 w-4" />}
            Download Video
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
