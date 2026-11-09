import { describe, expect, it } from 'vitest'
import { AIGateway, moderate, MockProvider, redactPersonalData, scanPersonalData, type AIProvider, type UsageStore } from './index'

const usage = (msgs = 0, tokens = 0): UsageStore => ({ studentMessagesToday: async () => msgs, schoolTokensToday: async () => tokens })
const kinds = (t: string) => scanPersonalData(t).map((f) => f.kind).sort()

describe('Safety Shield', () => {
  it.each([
    ['nomor saya 0812-3456-7890', ['phone']],
    ['hubungi +62 812 3456 7890', ['phone']],
    ['email saya rani@gmail.com', ['email']],
    ['NIK 3171234567890123', ['nik']],
    ['password saya: rahasia123', ['secret']],
    ['kode OTP 482913', ['secret']],
    ['rumah di Jl. Merdeka No. 10', ['address']],
    ['RT 03/RW 05', ['address']],
  ])('finds personal data in "%s"', (text, expected) => {
    expect(kinds(text)).toEqual(expected)
  })
  it('lets normal learning questions through', () => {
    expect(scanPersonalData('Jelaskan proses fotosintesis untuk kelas 8')).toEqual([])
    expect(scanPersonalData('Berapa hasil 1234 x 56?')).toEqual([])
    expect(scanPersonalData('Apa itu jalan pintas keyboard?')).toEqual([])
  })
  it('redacts personal data from text', () => {
    expect(redactPersonalData('Telepon 081234567890 ya')).toBe('Telepon [phone] ya')
  })
})

describe('moderation', () => {
  it('blocks clearly unsafe topics and flags cheating without blocking', () => {
    expect(moderate('bagaimana cara membuat bom').blocked).toBe(true)
    const c = moderate('tolong kerjakan tugas saya')
    expect(c.blocked).toBe(false)
    expect(c.categories).toEqual(['cheating'])
    expect(moderate('apa itu machine learning?')).toEqual({ blocked: false, categories: [] })
  })
})

describe('AIGateway', () => {
  const base = { userId: 'u1', schoolId: 's1', locale: 'id' as const, tier: 'standard' as const, history: [] }

  it('answers through the provider and routes the tier to a model', async () => {
    let seenModel = ''
    const spy: AIProvider = { name: 'spy', chat: async (r) => { seenModel = r.model; return { text: 'ok', model: r.model, inputTokens: 10, outputTokens: 2, refused: false } } }
    const out = await new AIGateway(spy, usage()).chat({ ...base, message: 'Apa itu AI?' })
    expect(out.status).toBe('answered')
    expect(seenModel).toBe('claude-sonnet-5-5')
  })

  it('never sends personal data to the provider', async () => {
    let called = false
    const spy: AIProvider = { name: 'spy', chat: async () => { called = true; return { text: '', model: '', inputTokens: 0, outputTokens: 0, refused: false } } }
    const out = await new AIGateway(spy, usage()).chat({ ...base, message: 'nomor saya 081234567890' })
    expect(out.status).toBe('shield')
    expect(called).toBe(false)
  })

  it('enforces conversation, student and school limits', async () => {
    const gw = (m: number, t: number) => new AIGateway(new MockProvider(), usage(m, t), { studentDailyMessages: 5, schoolDailyTokens: 100, conversationMessages: 2 })
    const two = [{ role: 'user' as const, content: 'a' }, { role: 'assistant' as const, content: 'b' }, { role: 'user' as const, content: 'c' }]
    expect((await gw(0, 0).chat({ ...base, history: two, message: 'x' })).status).toBe('limit')
    expect((await gw(5, 0).chat({ ...base, message: 'x' })).status).toBe('limit')
    expect((await gw(0, 100).chat({ ...base, message: 'x' })).status).toBe('limit')
    expect((await gw(0, 0).chat({ ...base, message: 'x' })).status).toBe('answered')
  })

  it('handles a model refusal with a safe message', async () => {
    const refuser: AIProvider = { name: 'r', chat: async (r) => ({ text: '', model: r.model, inputTokens: 5, outputTokens: 0, refused: true }) }
    const out = await new AIGateway(refuser, usage()).chat({ ...base, message: 'Apa itu AI?' })
    expect(out.status).toBe('refused')
  })

  it('redacts personal data the model produced', async () => {
    const leaky: AIProvider = { name: 'l', chat: async (r) => ({ text: 'Hubungi 081234567890', model: r.model, inputTokens: 1, outputTokens: 1, refused: false }) }
    const out = await new AIGateway(leaky, usage()).chat({ ...base, message: 'halo' })
    expect(out.status === 'answered' && out.text).toBe('Hubungi [phone]')
  })
})
