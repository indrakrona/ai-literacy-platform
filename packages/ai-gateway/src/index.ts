/**
 * AI gateway — every AI call on the platform goes through here (spec: Tech stack > AI).
 * Sprint 0 defines the contracts; guardrails, Safety Shield, quotas and logging are
 * implemented in ClickUp task "Build AI gateway and AI Lab (D1–D5)".
 */
export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

/** Which model tier a call needs; the gateway maps tiers to concrete models. */
export type ModelTier = 'fast' | 'standard' | 'deep'

export interface ChatRequest {
  userId: string
  schoolId?: string
  activityId?: string
  tier: ModelTier
  system: string
  messages: ChatMessage[]
  maxTokens?: number
}

export interface ChatResult {
  text: string
  inputTokens: number
  outputTokens: number
  model: string
}

export interface AIProvider {
  readonly name: string
  chat(req: ChatRequest, model: string): Promise<ChatResult>
}

/** Default tier → model mapping (spec: AI model routing). Overridable via settings. */
export const DEFAULT_MODELS: Record<ModelTier, string> = {
  fast: 'claude-haiku-5-5',
  standard: 'claude-sonnet-5-5',
  deep: 'claude-opus-5-5',
}
