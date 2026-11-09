import Anthropic from '@anthropic-ai/sdk'

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
}
