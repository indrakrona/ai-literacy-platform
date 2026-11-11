import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

// Every page reads the signed-in user or CMS content at request time. Rendering on demand also lets the
// Docker image be built without a database or secrets (they only exist on the server).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Literacy · Impact Thinklab',
  description: 'Belajar literasi AI untuk remaja Indonesia.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
