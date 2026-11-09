'use client'
import { useState } from 'react'
import { promptQuality, type PromptPart } from './logic'

const PARTS: Record<PromptPart, { id: string; en: string }> = {
  goal: { id: 'Tujuan: "Jelaskan proses fotosintesis"', en: 'Goal: "Explain photosynthesis"' },
  context: { id: 'Konteks: "untuk siswa kelas 8 yang baru mempelajarinya"', en: 'Context: "for grade 8 students learning it for the first time"' },
  format: { id: 'Bentuk: "dalam lima poin singkat dengan satu contoh sehari-hari"', en: 'Format: "in five short points with one everyday example"' },
}

const OUTPUTS: Record<0 | 1 | 2 | 3, { id: string; en: string }> = {
  0: {
    id: 'Robot: "Instruksi tidak jelas. Apa yang harus saya lakukan?"',
    en: 'Robot: "Unclear instruction. What should I do?"',
  },
  1: {
    id: 'Robot menulis tiga paragraf panjang berisi istilah klorofil, stomata, dan siklus Calvin. Benar, tetapi terlalu sulit dan panjang.',
    en: 'The robot writes three long paragraphs about chlorophyll, stomata and the Calvin cycle. Correct, but too hard and too long.',
  },
  2: {
    id: 'Robot menjelaskan dengan bahasa sederhana untuk siswa kelas 8, tetapi tetap dalam paragraf panjang.',
    en: 'The robot uses simple language for grade 8 students, but still in long paragraphs.',
  },
  3: {
    id: 'Robot memberi lima poin singkat dengan bahasa sederhana dan contoh tanaman di halaman sekolah. Tepat sasaran.',
    en: 'The robot gives five short, simple points with an example of a plant in the school yard. On target.',
  },
}

export function PromptRobotSim({ locale }: { locale: 'id' | 'en' }) {
  const [parts, setParts] = useState<PromptPart[]>([])
  const quality = promptQuality(parts)
  const id = locale === 'id'
  const toggle = (p: PromptPart) => setParts(parts.includes(p) ? parts.filter((x) => x !== p) : [...parts, p])

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5">
      <h2 className="text-xl font-bold">{id ? 'Robot yang Harfiah' : 'The literal robot'}</h2>
      <p className="text-muted">
        {id
          ? 'Robot ini hanya mengikuti apa yang Anda tulis. Pilih bagian instruksi dan lihat hasilnya.'
          : 'This robot only does exactly what you write. Pick parts of the instruction and see the result.'}
      </p>
      <div className="flex flex-col gap-2">
        {(Object.keys(PARTS) as PromptPart[]).map((p) => (
          <label key={p} className="flex items-start gap-3 rounded-xl border border-line p-3">
            <input type="checkbox" className="mt-1 size-4" checked={parts.includes(p)} onChange={() => toggle(p)} />
            <span>{PARTS[p][locale]}</span>
          </label>
        ))}
      </div>
      <div className="rounded-2xl bg-paper p-4" role="status">
        <p className="text-sm font-semibold">
          {id ? 'Kualitas instruksi' : 'Instruction quality'}: {quality} / 3
        </p>
        <p className="mt-2">{OUTPUTS[quality][locale]}</p>
      </div>
    </section>
  )
}
