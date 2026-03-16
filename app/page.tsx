'use client'
import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { Sidebar } from '@/app/components/sidebar/Sidebar'
import { Topbar } from '@/app/components/sidebar/Topbar'
import { AmbientBackground } from '@/app/components/ui/AmbientBackground'
import { Toast, toast } from '@/app/components/ui'
import { SettingsPanel } from '@/app/components/ui/SettingsPanel'
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts'
import { ChatTool }     from '@/app/components/tools/ChatTool'
import { PdfTool }      from '@/app/components/tools/PdfTool'
import { CodeTool }     from '@/app/components/tools/CodeTool'
import { LeetcodeTool } from '@/app/components/tools/LeetcodeTool'
import { ResearchTool } from '@/app/components/tools/ResearchTool'
import { TerminalTool } from '@/app/components/tools/TerminalTool'

export default function Home() {
  const activeTool = useStore((s) => s.activeTool)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const openSettings = useCallback(() => setSettingsOpen(true), [])

  const exportChat = useCallback(() => {
    const { chatMessages, model } = useStore.getState()
    if (!chatMessages.length) {
      toast('Nothing to export')
      return
    }
    const lines = [
      `# Aurelius Export\n${new Date().toLocaleString()} · ${model}\n\n---\n`,
    ]
    chatMessages.forEach((m) =>
      lines.push(
        `**${m.role === 'user' ? 'You' : 'Aurelius'}**\n\n${m.content}\n\n---\n`
      )
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([lines.join('\n')], { type: 'text/markdown' })
    )
    a.download = `aurelius-${Date.now()}.md`
    a.click()
    toast('Chat exported')
  }, [])

  useKeyboardShortcuts({
    onOpenSettings: openSettings,
    onExport: exportChat,
  })

  return (
    <div className="relative flex h-screen overflow-hidden bg-[var(--bg)]">

      {/* Floating background orbs */}
      <AmbientBackground />

      {/* Sidebar */}
      <div className="relative z-10">
        <Sidebar onOpenSettings={openSettings} />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onOpenSettings={openSettings} />

        {/* Tool panels — only active one renders */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {activeTool === 'chat'     && <ChatTool />}
          {activeTool === 'pdf'      && <PdfTool />}
          {activeTool === 'code'     && <CodeTool />}
          {activeTool === 'leetcode' && <LeetcodeTool />}
          {activeTool === 'research' && <ResearchTool />}
          {activeTool === 'terminal' && <TerminalTool />}
        </div>
      </div>

      {/* Settings slide-over panel */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Global toast notifications */}
      <Toast />

    </div>
  )
}