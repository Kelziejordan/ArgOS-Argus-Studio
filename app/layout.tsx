import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// This is a basic setup for your app's metadata (like the browser tab title)
export const metadata: Metadata = {
  title: 'ArgOS x ARGUS Studio',
  description: 'The AI Development Studio is now live.',
}

// This is the main "house" for your application
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* The 'children' here will be your page.tsx */}
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
