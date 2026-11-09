/**
 * First-line content check for a teen audience (spec D2). Deliberately simple and conservative:
 * it blocks clearly unsafe requests before they reach the model and flags them for the teacher.
 * The model's own safety training and the system prompt are the second line.
 */
export type ModerationCategory = 'self_harm' | 'sexual' | 'violence' | 'drugs' | 'cheating'

const RULES: { category: ModerationCategory; block: boolean; re: RegExp }[] = [
  { category: 'self_harm', block: true, re: /\b(bunuh diri|mengakhiri hidup|melukai diri|self[- ]?harm|suicide|kill myself)\b/i },
  { category: 'sexual', block: true, re: /\b(porn\w*|bokep|telanjang|nude|seks bebas|sex video)\b/i },
  { category: 'violence', block: true, re: /\b(cara membuat bom|merakit senjata|how to make a bomb|build a gun)\b/i },
  { category: 'drugs', block: true, re: /\b(cara membuat narkoba|beli sabu|how to make meth|buy drugs)\b/i },
  // Not blocked: flagged so the teacher can talk about integrity.
  { category: 'cheating', block: false, re: /\b(kerjakan (ujian|pr|tugas) saya|jawaban ujian|do my (homework|exam))\b/i },
]

export interface ModerationResult {
  blocked: boolean
  categories: ModerationCategory[]
}

export function moderate(text: string): ModerationResult {
  const hits = RULES.filter((r) => r.re.test(text))
  return { blocked: hits.some((h) => h.block), categories: hits.map((h) => h.category) }
}

/** Shown when a message is blocked; self-harm gets support information instead of a refusal only. */
export function blockedReply(categories: ModerationCategory[], locale: 'id' | 'en'): string {
  if (categories.includes('self_harm')) {
    return locale === 'id'
      ? 'Sepertinya kamu sedang mengalami masa yang berat. Kamu tidak sendiri. Bicaralah dengan guru, orang tua, atau orang dewasa yang kamu percaya. Kamu juga dapat menghubungi layanan Kementerian Kesehatan di nomor 119 ekstensi 8.'
      : 'It sounds like you are going through something hard. You are not alone. Please talk to a teacher, parent or another adult you trust. In Indonesia you can also call the Ministry of Health line 119, extension 8.'
  }
  return locale === 'id'
    ? 'Topik ini tidak dapat dibahas di AI Lab. Jika ada yang ingin kamu tanyakan, bicarakan dengan gurumu.'
    : 'This topic cannot be discussed in the AI Lab. If you have questions about it, please talk to your teacher.'
}
