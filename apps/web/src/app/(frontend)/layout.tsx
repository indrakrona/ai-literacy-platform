import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

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
