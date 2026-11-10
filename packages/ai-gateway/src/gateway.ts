import { blockedReply, moderate, type ModerationCategory } from './moderation'
import { DEFAULT_MODELS, type AIProvider, type ChatMessage, type ModelTier } from './providers'
import { redactPersonalData, scanPersonalData, SHIELD_MESSAGES, type ShieldKind } from './shield'
import type { RubricSuggestion, RubricSuggestionRequest } from './rubric'

/** Safety rules every AI Lab conversation starts with; activity instructions come after. */
export const BASE_SYSTEM_PROMPT = `You are a learning assistant in a school AI literacy program in Indonesia. The students are teenagers (12–18).
- Reply in the language the student writes in (usually Bahasa Indonesia), in clear, friendly, age-appropriate language.
- Help students understand and think; do not do graded work for them. When asked to write an essay or answer a test, explain how to approach it instead.
- Never ask for personal information (name, address, phone, school, photos, passwords). If a student shares some, remind them not to.
- If a question needs a doctor, counsellor, lawyer or other professional, say so and suggest talking to a trusted adult.
- If you are not sure a fact is right, say so and suggest checking a trusted source.
- Keep answers short: at most about 200 words unless the activity says otherwise.`

export interface Limits {
  /** Messages a student may send per day. */
  studentDailyMessages: number
  /** Tokens a school may use per day (input + output). */
  schoolDailyTokens: number
  /** Messages allowed in one conversation (activity setting). */
  conversationMessages: number
}

export const DEFAULT_LIMITS: Limits = { studentDailyMessages: 60, schoolDailyTokens: 400_000, conversationMessages: 20 }

export interface UsageStore {
  studentMessagesToday(userId: string): Promise<number>
  schoolTokensToday(schoolId: string): Promise<number>
}

export interface GatewayRequest {
  userId: string
  schoolId?: string
  locale: 'id' | 'en'
  tier: ModelTier
  activityInstructions?: string
  history: ChatMessage[]
  message: string
  maxTokens?: number
}

export type GatewayOutcome =
  | { status: 'answered'; text: string; model: string; inputTokens: number; outputTokens: number; flags: ModerationCategory[]; redacted: boolean }
  | { status: 'shield'; text: string; kinds: ShieldKind[] }
  | { status: 'blocked'; text: string; flags: ModerationCategory[] }
  | { status: 'limit'; text: string; limit: 'student_daily' | 'school_daily' | 'conversation' }
  | { status: 'refused'; text: string; model: string }

export class AIGateway {
  constructor(
    private provider: AIProvider,
    private usage: UsageStore,
    private limits: Limits = DEFAULT_LIMITS,
    private models: Record<ModelTier, string> = DEFAULT_MODELS,
  ) {}

  /** Advice for an AILIS rater; null when the provider cannot suggest or the reply did not fit the rubric. */
  async suggestRubricScore(req: RubricSuggestionRequest): Promise<RubricSuggestion | null> {
    if (!this.provider.suggestRubricScore) return null
    return this.provider.suggestRubricScore(req, this.models.deep)
  }

  get providerName() {
    return this.provider.name
  }

  async chat(req: GatewayRequest): Promise<GatewayOutcome> {
    const id = req.locale === 'id'

    // 1. Quotas
    const userTurns = req.history.filter((m) => m.role === 'user').length
    if (userTurns >= this.limits.conversationMessages) {
      return { status: 'limit', limit: 'conversation', text: id ? 'Batas pesan untuk kegiatan ini sudah tercapai.' : 'You have reached the message limit for this activity.' }
    }
    if ((await this.usage.studentMessagesToday(req.userId)) >= this.limits.studentDailyMessages) {
      return { status: 'limit', limit: 'student_daily', text: id ? 'Batas pesan harian kamu sudah tercapai. Coba lagi besok.' : 'You have reached your daily message limit. Try again tomorrow.' }
    }
    if (req.schoolId && (await this.usage.schoolTokensToday(req.schoolId)) >= this.limits.schoolDailyTokens) {
      return { status: 'limit', limit: 'school_daily', text: id ? 'Kuota AI sekolah untuk hari ini sudah habis.' : "Your school's AI quota for today has been used up." }
    }

    // 2. Safety Shield: personal data never leaves the platform
    const findings = scanPersonalData(req.message)
    if (findings.length) {
      const kinds = [...new Set(findings.map((f) => f.kind))]
      const list = kinds.map((k) => SHIELD_MESSAGES[k][req.locale]).join(', ')
      return {
        status: 'shield',
        kinds,
        text: id
          ? `Perisai Data menahan pesanmu karena berisi ${list}. Hapus data pribadi itu, lalu kirim ulang.`
          : `The Data Shield held your message because it contains ${list}. Remove the personal data and send it again.`,
      }
    }

    // 3. Content check
    const mod = moderate(req.message)
    if (mod.blocked) return { status: 'blocked', flags: mod.categories, text: blockedReply(mod.categories, req.locale) }

    // 4. Model
    const system = req.activityInstructions ? `${BASE_SYSTEM_PROMPT}\n\nActivity instructions:\n${req.activityInstructions}` : BASE_SYSTEM_PROMPT
    const result = await this.provider.chat({
      model: this.models[req.tier],
      system,
      messages: [...req.history, { role: 'user', content: req.message }],
      maxTokens: req.maxTokens ?? 1024,
    })
    if (result.refused) {
      return {
        status: 'refused',
        model: result.model,
        text: id ? 'AI tidak dapat membantu permintaan ini. Coba ajukan pertanyaan lain atau tanyakan kepada guru.' : 'The AI cannot help with this request. Try another question or ask your teacher.',
      }
    }

    // 5. Output check: redact any personal data the model produced
    const redacted = redactPersonalData(result.text)
    return {
      status: 'answered',
      text: redacted,
      redacted: redacted !== result.text,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      flags: mod.categories,
    }
  }
}
