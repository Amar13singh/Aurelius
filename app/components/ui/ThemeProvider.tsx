'use client'
import { useEffect } from 'react'
import { useStore } from '@/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
  }, [theme])

  return <>{children}</>
}