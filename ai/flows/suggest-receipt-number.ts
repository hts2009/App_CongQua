
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting receipt numbers based on donation history.
 * THIS FLOW IS CURRENTLY NOT USED as receipt number generation is deterministic.
 *
 * - suggestReceiptNumber - A function that suggests a receipt number based on donation history.
 * - SuggestReceiptNumberInput - The input type for the suggestReceiptNumber function.
 * - SuggestReceiptNumberOutput - The return type for the suggestReceiptNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { format } from 'date-fns';

const SuggestReceiptNumberInputSchema = z.object({
  donationHistory: z
    .string()
    .describe('A string containing recent receipt numbers, comma-separated. Example: "20240728_001,20240728_002"'),
  currentDate: z.string().describe('The current date in yyyyMMdd format.')
});
export type SuggestReceiptNumberInput = z.infer<typeof SuggestReceiptNumberInputSchema>;

const SuggestReceiptNumberOutputSchema = z.object({
  suggestedReceiptNumber: z
    .string()
    .describe('The suggested receipt number in yyyyMMdd_xxx format.'),
});
export type SuggestReceiptNumberOutput = z.infer<typeof SuggestReceiptNumberOutputSchema>;

export async function suggestReceiptNumber(
  input: SuggestReceiptNumberInput
): Promise<SuggestReceiptNumberOutput> {
  // Fallback to deterministic generation if AI is not preferred for this.
  // This function is kept for potential future use with AI but direct generation is likely better for this specific format.
  const prefix = input.currentDate;
  let nextSuffix = 1;
  if (input.donationHistory) {
    const historyNumbers = input.donationHistory.split(',')
      .map(s => s.trim())
      .filter(s => s.startsWith(prefix))
      .map(s => parseInt(s.split('_')[1], 10))
      .filter(n => !isNaN(n));
    if (historyNumbers.length > 0) {
      nextSuffix = Math.max(...historyNumbers) + 1;
    }
  }
  return { suggestedReceiptNumber: `${prefix}_${String(nextSuffix).padStart(3, '0')}` };
}

// Original AI prompt based flow (can be reactivated if needed)
/*
const prompt = ai.definePrompt({
  name: 'suggestReceiptNumberPrompt',
  input: {schema: SuggestReceiptNumberInputSchema},
  output: {schema: SuggestReceiptNumberOutputSchema},
  prompt: `You are an assistant helping a receptionist at a temple.
Based on the current date '{{currentDate}}' (format yyyyMMdd) and the following recent receipt numbers '{{{donationHistory}}}', suggest the next receipt number.
The receipt number must follow the format yyyyMMdd_xxx, where xxx is a 3-digit sequential number for that day (e.g., 001, 002).
If there are no receipts for '{{currentDate}}' in the history, start with '{{currentDate}}_001'.
Otherwise, find the highest 'xxx' for '{{currentDate}}' in the history and suggest the next sequential number.

Just output the suggested receipt number, and nothing else.`,
});

const suggestReceiptNumberFlow = ai.defineFlow(
  {
    name: 'suggestReceiptNumberFlow',
    inputSchema: SuggestReceiptNumberInputSchema,
    outputSchema: SuggestReceiptNumberOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
*/

