// This file uses server-side code.
'use server';

/**
 * @fileOverview Provides an AI-generated title suggestion for a given video URL.
 *
 * - suggestTitle - A function that takes a video URL and returns a suggested title.
 * - SuggestTitleInput - The input type for the suggestTitle function, which is the video URL.
 * - SuggestTitleOutput - The return type for the suggestTitle function, which is the suggested title string.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTitleInputSchema = z.object({
  videoUrl: z.string().describe('The URL of the YouTube video.'),
});
export type SuggestTitleInput = z.infer<typeof SuggestTitleInputSchema>;

const SuggestTitleOutputSchema = z.object({
  suggestedTitle: z.string().describe('The AI-generated suggested title for the video.'),
});
export type SuggestTitleOutput = z.infer<typeof SuggestTitleOutputSchema>;

export async function suggestTitle(input: SuggestTitleInput): Promise<SuggestTitleOutput> {
  return suggestTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTitlePrompt',
  input: {schema: SuggestTitleInputSchema},
  output: {schema: SuggestTitleOutputSchema},
  prompt: `You are an expert in creating engaging and SEO-optimized titles for YouTube videos.
  Given the URL of a video, analyze its content and suggest a title that is both attractive to viewers and optimized for search engines.
  The title should be concise, informative, and reflect the video's main topic.
  Prioritize titles that are likely to attract clicks and improve the video's visibility.

  Video URL: {{{videoUrl}}}

  Suggested Title:`, // No Handlebars if/else required.
});

const suggestTitleFlow = ai.defineFlow(
  {
    name: 'suggestTitleFlow',
    inputSchema: SuggestTitleInputSchema,
    outputSchema: SuggestTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
