/** Build a practice question: options as [text, isCorrect] pairs. */
export const q = (prompt: string, options: [string, boolean][], explanation: string) => ({
  prompt,
  options: options.map(([text, correct]) => ({ text, correct })),
  explanation,
})
