
'use client';

import { useState } from 'react';
import { Download, Loader2, Youtube } from 'lucide-react';

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

export function Downloader() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('720p'); // Default to 720p
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (type: 'video' | 'audio') => {
     if (!url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a YouTube URL to download.',
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

  const isBusy = isDownloading;

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
            Enter a YouTube URL, select your desired quality, and start downloading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isBusy}
            />
          </div>
          
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
                  <SelectItem value="best">Best Available</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="720p">720p</SelectItem>
              </SelectContent>
              </Select>
          </div>
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
          <Button onClick={() => handleDownload('video')} disabled={isBusy || !url} className="w-full sm:w-auto">
            {isDownloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isDownloading && <Download className="mr-2 h-4 w-4" />}
            Download Video
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
