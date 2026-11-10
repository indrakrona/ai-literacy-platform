/** Proctor incident types and their labels (shared by the server page and the client form). */
export const INCIDENT_LABELS = {
  id: { device_issue: 'Masalah perangkat', connection: 'Koneksi terputus', left_room: 'Meninggalkan ruangan', suspected_cheating: 'Dugaan kecurangan', identity_check: 'Pemeriksaan identitas', other: 'Lainnya' },
  en: { device_issue: 'Device problem', connection: 'Connection lost', left_room: 'Left the room', suspected_cheating: 'Suspected cheating', identity_check: 'Identity check', other: 'Other' },
} as const

export const incidentLabel = (type: string, locale: 'id' | 'en') => (INCIDENT_LABELS[locale] as Record<string, string>)[type] ?? type
