import { z } from 'zod'

const email = z.string().trim().toLowerCase().email().max(254)
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')

export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email,
    password: z.string().min(8).max(200),
    dateOfBirth: isoDate,
    accountType: z.enum(['student', 'candidate']).default('student'),
    locale: z.enum(['id', 'en']).default('id'),
    classCode: z.string().trim().toUpperCase().length(6).optional().or(z.literal('').transform(() => undefined)),
    guardianEmail: email.optional().or(z.literal('').transform(() => undefined)),
    guardianPhone: z.string().trim().max(30).optional(),
    guardianName: z.string().trim().max(120).optional(),
  })
  .strict()

export type SignupInput = z.infer<typeof signupSchema>

export const joinClassSchema = z.object({ code: z.string().trim().toUpperCase().length(6) }).strict()

export const consentDecisionSchema = z
  .object({
    token: z.string().min(16).max(100),
    decision: z.enum(['granted', 'declined']),
    guardianName: z.string().trim().min(2).max(120),
  })
  .strict()

export const importSchema = z.object({ classId: z.coerce.number().int().positive(), csv: z.string().min(1).max(500_000) }).strict()

export function zodMessage(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')
}
