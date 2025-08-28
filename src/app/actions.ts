'use server';

// This file is no longer used for core functionality,
// but is kept to show a pattern for server actions.
// All download and video info logic has been moved to API routes
// in `/src/app/api/`. This is a better pattern for handling
// long-running tasks and external processes like yt-dlp.

export async function exampleServerAction(text: string) {
  console.log('This is an example server action with text:', text);
  // In a real app, you might do database operations or other server-side logic here.
  return { success: true, message: `You sent: ${text}` };
}
