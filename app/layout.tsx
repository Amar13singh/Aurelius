import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/app/components/ui/ThemeProvider'

export const metadata: Metadata = {
  title: 'Aurelius — AI Suite',
  description: 'Refined Claude AI: Chat · PDF · Code · LeetCode · Research · Terminal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://js.puter.com/v2/" async />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#080909" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-hidden dark">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}