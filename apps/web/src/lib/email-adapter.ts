import type { EmailAdapter } from 'payload'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

/** HTML email → readable text that keeps link targets, for development logs. */
export function emailToText(html: string): string {
  return html
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|div|tr|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Development only: print the whole email, links included, so flows can be tried without a mail server. */
const consoleAdapter: EmailAdapter = ({ payload }) => ({
  name: 'console',
  defaultFromAddress: process.env.EMAIL_FROM || 'noreply@ailearning.impact.id',
  defaultFromName: 'AI Literacy · Impact Thinklab',
  sendEmail: async (message) => {
    const body = typeof message.html === 'string' ? emailToText(message.html) : String(message.text ?? '')
    payload.logger.info(`EMAIL (not sent: no mail server)\nTo: ${String(message.to)}\nSubject: ${message.subject}\n${body}`)
    return { accepted: [message.to] }
  },
})

/**
 * Email delivery: SMTP when SMTP_HOST is set (any provider: Google Workspace, Mailgun, SES SMTP…);
 * otherwise the console printer in development. In production without SMTP, Payload's default applies
 * and nothing is sent — schools can then share consent links by WhatsApp from the platform.
 */
export function emailAdapter(): EmailAdapter | Promise<EmailAdapter> | undefined {
  if (process.env.SMTP_HOST) {
    return nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || 'noreply@ailearning.impact.id',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'AI Literacy · Impact Thinklab',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      },
    })
  }
  return process.env.NODE_ENV === 'production' ? undefined : consoleAdapter
}
