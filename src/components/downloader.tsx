
'use client';

import { useState } from 'react';
import { Download, Lightbulb, Loader2, Youtube } from 'lucide-react';

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
import { getSuggestedTitle } from '@/app/actions';
import { Separator } from './ui/separator';

export function Downloader() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('1080p');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleSuggestTitle = async () => {
    if (!url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a YouTube URL first.',
      });
      return;
    }

    setIsSuggesting(true);
    setSuggestedTitle('');
    const result = await getSuggestedTitle(url);
    setIsSuggesting(false);

    if (result.success) {
      setSuggestedTitle(result.title!);
      toast({
        title: 'Title suggestion ready!',
        description: 'A new title has been generated for you.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
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
    
    setIsDownloading(true);

    toast({
      title: 'Starting Download...',
      description: `Your ${type} is being prepared.`,
    });

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality, type }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success!',
          description: data.message,
        });
      } else {
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

  const isBusy = isSuggesting || isDownloading;

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
            Enter a YouTube URL, choose your format, and start downloading.
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
                onChange={(e) => setUrl(e.target.value)}
                disabled={isBusy}
              />
              <Button onClick={handleSuggestTitle} disabled={isBusy || !url} className="w-full sm:w-auto flex-shrink-0 bg-accent hover:bg-accent/90">
                {isSuggesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                Suggest Title
              </Button>
            </div>
          </div>
          {suggestedTitle && (
             <div className="space-y-2 rounded-lg border bg-secondary/50 p-4">
                <Label>Suggested Title</Label>
                <p className="text-sm text-foreground">{suggestedTitle}</p>
             </div>
          )}
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
                <SelectItem value="best">Best available</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="360p">360p</SelectItem>
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
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Audio Only
          </Button>
          <Button onClick={() => handleDownload('video')} disabled={isBusy || !url} className="w-full sm:w-auto">
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Video
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
