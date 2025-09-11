# 🎬 Studio - YouTube Downloader

![Node.js](https://img.shields.io/badge/Node.js-18.x-green) 
![Next.js](https://img.shields.io/badge/Next.js-15.x-black) 
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) 
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack **YouTube downloader** application with a **Next.js (TypeScript)** frontend and **Node.js / Express** backend.  
Fetch video info and download YouTube videos (up to 720p) or audio-only streams in a clean and responsive UI.

---

## 🛠 Features

- Fetch YouTube video information (title, audio/video streams)  
- Download **video up to 720p**  
- Download **audio-only** streams (best `.m4a`)  
- Limit backend to **max 2 concurrent downloads**  
- Responsive UI with **Tailwind CSS** and **Radix UI components**  

---

## 📂 Folder Structure

```text
studio/
├─ studio-backend/        # Node.js / Express backend
│  ├─ src/
│  │  ├─ server.js
│  │  └─ ...
│  └─ package.json
├─ studio/                # Next.js frontend
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ api/
│  │  │  │  └─ download/route.ts
│  │  │  └─ downloader.tsx
│  │  └─ ...
│  └─ package.json
└─ README.md
```

## Backend Setup

1. Navigate to the backend folder:

```bash
cd studio-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend:
```bash
npm start
```

The backend will run on http://localhost:4000 by default.

## ⚙ Backend Setup

| Route                       | Method | Description                                             |
| --------------------------- | ------ | ------------------------------------------------------- |
| `/info?url=<VIDEO_URL>`     | GET    | Fetch video info (title, available audio/video streams) |
| `/download?url=<VIDEO_URL>` | GET    | Stream video/audio for download                         |


## ⚡ Frontend Setup

1. Navigate to the frontend folder:
```bash
cd studio
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend (development mode):
```bash
npm run dev
```

Frontend runs on http://localhost:9002 by default.

### Using the App

1. Open the frontend in your browser: http://localhost:9002

2. Paste a YouTube video URL in the input field

3. Click Fetch to retrieve available streams

4. Click a Download button to download video or audio

The frontend now directly calls your local backend on http://localhost:4000.

## 📦Dependencies
### Backend

- **express** – HTTP server

- **dotenv** – Environment variable management

- **yt-dlp** – YouTube video downloader

- **ffmpeg** – Video/audio processing

### Frontend

- **next** – React framework

- **react** / react-dom – UI library

- **typescript** – Type safety

- **tailwindcss** – Styling

- **lucide-react** – Icons

- **@radix-ui/** – UI components

## ⚠ Notes

- **Backend handles max 2 concurrent jobs to prevent overload**

- **Video downloads are limited to 720p**

- **Audio-only downloads use the best .m4a format**

## 🚀 Future Improvements

- Add authentication for personal usage

- Deploy backend on Vercel or Render for public access

- Add multiple language support

- Implement progress bar for downloads

# License

### MIT License


✅ This version uses **numbered steps (1, 2, 3)** for setup and usage so it’s easy to follow.  

