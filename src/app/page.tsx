import Downloader from '@/components/downloader';
import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "YouTube Video Downloader - Studio",
  description: "Download YouTube videos in up to 720p or audio-only with our free Studio downloader.",
  keywords: ["YouTube downloader", "720p video", "audio download", "Studio app","Youtube Video downloader","Youtube Audio downloader", "HD video download"],
  openGraph: {
    title: "YouTube Video Downloader || Youtube Audio Downloader - Studio",
    description: "Fast and secure YouTube downloader. Get videos in 720p or audio-only.",
    url: "https://studio-blond-one.vercel.app/",
    siteName: "Studio",
    locale: "en_US",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
      <SpeedInsights />
      <div className="w-full max-w-2xl">
        <Downloader />
      </div>
    </main>
  );
}
