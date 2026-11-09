/** Transactional email texts (Bahasa Indonesia first). Kept plain and short for phone mail apps. */

type Locale = 'id' | 'en'

const wrap = (body: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#16130F;max-width:560px">${body}<p style="color:#6B655D;font-size:13px">Impact Thinklab · AI Literacy</p></div>`

const button = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#16130F;color:#FAF7F2;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${label}</a></p>`

export function consentEmail({ studentName, link, locale }: { studentName: string; link: string; locale: Locale }) {
  const safeName = escapeHtml(studentName)
  if (locale === 'en') {
    return {
      subject: `${studentName} needs your permission to use AI Literacy`,
      html: wrap(
        `<p>Hello,</p><p><b>${safeName}</b> has registered on the Impact Thinklab AI Literacy platform. Because they are under 18, we need a parent or guardian's permission before they can use the AI Lab, projects and tests.</p>${button(link, 'Review and decide')}<p>The page explains what data we collect and why. The link is valid for 14 days.</p>`,
      ),
    }
  }
  return {
    subject: `${studentName} membutuhkan izin Anda untuk menggunakan AI Literacy`,
    html: wrap(
      `<p>Halo,</p><p><b>${safeName}</b> telah mendaftar di platform AI Literacy Impact Thinklab. Karena masih di bawah 18 tahun, kami memerlukan izin orang tua atau wali sebelum ia dapat menggunakan AI Lab, proyek, dan tes.</p>${button(link, 'Tinjau dan putuskan')}<p>Halaman tersebut menjelaskan data apa yang kami kumpulkan dan alasannya. Tautan berlaku selama 14 hari.</p>`,
    ),
  }
}

export function inviteEmail({ name, link, locale }: { name: string; link: string; locale: Locale }) {
  const safeName = escapeHtml(name)
  if (locale === 'en') {
    return {
      subject: 'Your AI Literacy account is ready',
      html: wrap(`<p>Hello ${safeName},</p><p>Your school has created an AI Literacy account for you. Set your password to get started.</p>${button(link, 'Set my password')}`),
    }
  }
  return {
    subject: 'Akun AI Literacy Anda sudah siap',
    html: wrap(`<p>Halo ${safeName},</p><p>Sekolah Anda telah membuatkan akun AI Literacy untuk Anda. Atur kata sandi untuk mulai.</p>${button(link, 'Atur kata sandi')}`),
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
