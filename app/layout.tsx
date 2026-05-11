import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ArgOS x ARGUS Studio',
  description: 'The AI Development Studio is now live.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
