'use client'
import { Menu, Settings, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { ToolId } from '@/types'

const TOOLS: { id: ToolId; label: string }[] = [
  { id: 'chat',     label: 'Chat'         },
  { id: 'pdf',      label: 'PDF Reader'   },
  { id: 'code',     label: 'Code Analyzer'},
  { id: 'leetcode', label: 'LeetCode'     },
  { id: 'research', label: 'Research'     },
  { id: 'terminal', label: 'AI Terminal'  },
]

interface TopbarProps {
  onOpenSettings: () => void
}

export function Topbar({ onOpenSettings }: TopbarProps) {
  const { thinking, activeTool, setActiveTool, setSidebarOpen } = useStore()
  const [toolMenuOpen, setToolMenuOpen] = useState(false)
  const currentTool = TOOLS.find(t => t.id === activeTool)

  return (
    <header className="h-[52px] flex items-center px-3 gap-2 border-b border-[var(--bdr)] bg-[var(--bg2)] flex-shrink-0 relative">

      {/* Hamburger — always visible */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt2)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all flex-shrink-0"
      >
        <Menu size={16} />
      </button>

      {/* Tool switcher dropdown */}
      <div className="relative">
        <button
          onClick={() => setToolMenuOpen(!toolMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg3)] border border-[var(--bdr)] text-[var(--txt)] text-[13px] font-medium hover:border-[var(--bdr2)] transition-all"
        >
          {currentTool?.label}
          <ChevronDown size={13} className={cn('text-[var(--txt3)] transition-transform', toolMenuOpen && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {toolMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setToolMenuOpen(false)} />
            <div className="absolute left-0 top-full mt-1 w-48 bg-[var(--bg2)] border border-[var(--bdr)] rounded-lg shadow-xl z-50 overflow-hidden animate-slide-up">
              {TOOLS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTool(id); setToolMenuOpen(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-[13px] transition-all',
                    activeTool === id
                      ? 'bg-[var(--acc2)] bg-opacity-10 text-[var(--acc2)] font-medium'
                      : 'text-[var(--txt2)] hover:bg-[var(--bg3)] hover:text-[var(--txt)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Status */}
      <div className="flex-1 flex justify-center">
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] border',
          thinking
            ? 'border-[var(--acc)] bg-[var(--acc-g)] text-[var(--acc)]'
            : 'border-[var(--bdr)] bg-[var(--bg3)] text-[var(--txt2)]'
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            thinking ? 'bg-[var(--acc)] animate-pulse-dot' : 'bg-[var(--acc3)]'
          )} />
          {thinking ? 'Thinking…' : 'Ready'}
        </div>
      </div>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all flex-shrink-0"
        title="Settings"
      >
        <Settings size={15} />
      </button>
    </header>
  )
}