# **App Name**: TubeSnag

## Core Features:

- URL Input: Input field for YouTube URL.
- Quality Selection: Dropdown to select video quality: 360p, 480p, 720p, 1080p, Best available.
- Video Download Button: Button to download video with selected quality.
- Audio Download Button: Button to download audio only (m4a).
- Download Processing: Backend service (using Next.js API routes) to handle yt-dlp commands.
- Title Suggestion: Use a LLM-powered tool to generate SEO-optimized suggested video titles, prior to user download.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to convey reliability and modernity, reminiscent of online video platforms but uniquely distinct. (HSL: 196, 75, 52)
- Background color: A light, desaturated blue (#F0F8FF) to provide a clean and unobtrusive backdrop, allowing content to stand out. (HSL: 207, 47, 96)
- Accent color: A lively orange (#FFA500) to draw attention to primary calls-to-action, contrasting against the blue tones for visibility and engagement. (HSL: 36, 100, 50)
- Body and headline font: 'Inter' (sans-serif) for a clean, modern, and readable interface, suitable for both headlines and body text.
- Simple and intuitive layout with clear sections for URL input, quality selection, and download buttons.