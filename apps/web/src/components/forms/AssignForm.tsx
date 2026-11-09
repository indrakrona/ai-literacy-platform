'use client'
import { useState } from 'react'
import { Button, inputClass } from '../ui'
import { api, errorText } from './api'

export function AssignForm({ classId, lessons, locale }: { classId: number; lessons: { id: number; label: string }[]; locale: 'id' | 'en' }) {
  const id = locale === 'id'
  const [lesson, setLesson] = useState(lessons[0]?.id ?? 0)
  const [due, setDue] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault()
        const res = await api('/api/assignments', { body: { class: classId, lesson, dueDate: due } })
        if (res.ok) window.location.reload()
        else setMsg(errorText(res.data, id ? 'Gagal menyimpan' : 'Could not save'))
      }}
    >
      <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
        {id ? 'Pelajaran' : 'Lesson'}
        <select className={inputClass} value={lesson} onChange={(e) => setLesson(Number(e.target.value))}>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {id ? 'Tenggat' : 'Due'}
        <input type="date" required className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <Button type="submit" className="sm:w-auto" disabled={!due || !lesson}>{id ? 'Tugaskan' : 'Assign'}</Button>
      {msg && <p className="text-sm text-danger">{msg}</p>}
    </form>
  )
}
