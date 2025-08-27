
'use server';

import { suggestTitle } from '@/ai/flows/suggest-title';
import { z } from 'zod';

const urlSchema = z.string().url('Please provide a valid YouTube URL.');

export async function getSuggestedTitle(url: string) {
  const validation = urlSchema.safeParse(url);
  if (!validation.success) {
      return { success: false, error: validation.error.flatten().formErrors[0] };
  }
  
  try {
    const result = await suggestTitle({ videoUrl: validation.data });
    if (result.suggestedTitle) {
      return { success: true, title: result.suggestedTitle };
    } else {
      return { success: false, error: 'Could not generate a title.' };
    }
  } catch (e) {
    console.error(e);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
