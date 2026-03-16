'use client'
import { useEffect } from 'react'
import { useStore } from '@/store'
import type { ToolId } from '@/types'

const TOOL_KEYS: Record<string, ToolId> = {
  '1': 'chat',
  '2': 'pdf',
  '3': 'code',
  '4': 'leetcode',
  '5': 'research',
  '6': 'terminal',
}

interface UseKeyboardShortcutsProps {
  onOpenSettings: () => void
  onExport: () => void
}

export function useKeyboardShortcuts({
  onOpenSettings,
  onExport,
}: UseKeyboardShortcutsProps) {
  const { setActiveTool, clearChat } = useStore()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey

      // Ctrl/Cmd + 1-6 → switch tools
      if (mod && TOOL_KEYS[e.key]) {
        e.preventDefault()
        setActiveTool(TOOL_KEYS[e.key])
        return
      }

      // Ctrl/Cmd + K → clear chat
      if (mod && e.key === 'k') {
        e.preventDefault()
        clearChat()
        setActiveTool('chat')
        return
      }

      // Ctrl/Cmd + E → export
      if (mod && e.key === 'e') {
        e.preventDefault()
        onExport()
        return
      }

      // Ctrl/Cmd + , → settings
      if (mod && e.key === ',') {
        e.preventDefault()
        onOpenSettings()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveTool, clearChat, onOpenSettings, onExport])
}