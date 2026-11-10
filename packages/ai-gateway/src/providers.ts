import Anthropic from '@anthropic-ai/sdk'
import { buildRubricPrompt, parseRubricReply, RUBRIC_SYSTEM_PROMPT, rubricOutputSchema, type RubricSuggestion, type RubricSuggestionRequest } from './rubric'

export type ChatRole = 'user' | 'assistant'
export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Model tier needed by a call; the gateway maps tiers to concrete models. */
export type ModelTier = 'fast' | 'standard' | 'deep'

/** Tier → model (spec: AI model routing). Overridable via settings. */
export const DEFAULT_MODELS: Record<ModelTier, string> = {
  fast: 'claude-haiku-5-5',
  standard: 'claude-sonnet-5-5',
  deep: 'claude-opus-5-5',
}

export interface ProviderRequest {
  model: string
  system: string
  messages: ChatMessage[]
  maxTokens: number
}

export interface ProviderResult {
  text: string
  model: string
  inputTokens: number
  outputTokens: number
  /** True when the model declined for safety reasons (stop_reason "refusal"). */
  refused: boolean
}

export interface AIProvider {
  readonly name: string
  chat(req: ProviderRequest): Promise<ProviderResult>
  /** Suggest a rubric level for a performance-task answer (advice for a human rater). */
  suggestRubricScore?(req: RubricSuggestionRequest, model: string): Promise<RubricSuggestion | null>
}

/**
 * Claude via the official SDK. Uses the server-side refusal fallback ("default" routing) so a
 * declined request is retried on a suitable model inside the same call; if the whole chain
 * declines, `refused` is true and the gateway shows a safe message.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic(apiKey ? { apiKey } : {})
  }

  async chat(req: ProviderRequest): Promise<ProviderResult> {
    const response = await this.client.beta.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: req.messages,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    })
    const refused = response.stop_reason === 'refusal'
    const text = refused
      ? ''
      : response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
    return {
      text,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      refused,
    }
  }
  /** Structured output constrains the reply to {points, rationale}; the result is still validated. */
  async suggestRubricScore(req: RubricSuggestionRequest, model: string): Promise<RubricSuggestion | null> {
    const response = await this.client.beta.messages.create({
      model,
      max_tokens: 16000,
      system: RUBRIC_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildRubricPrompt(req) }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: rubricOutputSchema(req.rubric) } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    })
    const usage = { model: response.model, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
    if (response.stop_reason === 'refusal') return { points: -1, rationale: '', refused: true, ...usage }
    if (response.stop_reason === 'max_tokens') return null
    const text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('')
    const parsed = parseRubricReply(text, req.rubric)
    return parsed ? { ...parsed, refused: false, ...usage } : null
  }
}

/**
 * Deterministic stand-in used in development and tests, and whenever no API key is configured.
 * It answers like a cautious tutor so the AI Lab flow can be tried end to end without cost.
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock'
  async chat(req: ProviderRequest): Promise<ProviderResult> {
    const last = [...req.messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    const text =
      `[Mode uji, tanpa AI sungguhan] Kamu bertanya: "${last.slice(0, 120)}". ` +
      'Di versi lengkap, AI akan menjawab di sini. Ingat: periksa jawaban AI dengan sumber tepercaya.'
    return { text, model: 'mock', inputTokens: Math.ceil((req.system.length + last.length) / 4), outputTokens: Math.ceil(text.length / 4), refused: false }
  }
  /** Test-mode suggestion from answer length only, clearly labelled; never a real judgement. */
  async suggestRubricScore(req: RubricSuggestionRequest): Promise<RubricSuggestion | null> {
    const levels = [...req.rubric].map((r) => r.points).sort((a, b) => a - b)
    const words = req.answer.trim().split(/\s+/).filter(Boolean).length
    const idx = words === 0 ? 0 : Math.min(levels.length - 1, Math.floor(words / 15) + 1)
    const rationale = req.locale === 'id'
      ? '[Mode uji] Saran ini dibuat dari panjang jawaban saja, bukan penilaian AI sungguhan.'
      : '[Test mode] This suggestion is based on answer length only, not a real AI judgement.'
    return { points: levels[idx] ?? 0, rationale, model: 'mock', refused: false, inputTokens: 0, outputTokens: 0 }
  }
}
