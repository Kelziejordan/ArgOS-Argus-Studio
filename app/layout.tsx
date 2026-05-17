import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArgOS x ARGUS Studio',
  description: 'Dual-agent AI development platform. ArgOS orchestrates. ARGUS builds.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 antialiased overflow-hidden">
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
