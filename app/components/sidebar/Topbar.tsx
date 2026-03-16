'use client'
import { Menu, Settings } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const TOOL_LABELS: Record<string, string> = {
  chat:     'Chat',
  pdf:      'PDF Reader',
  code:     'Code Analyzer',
  leetcode: 'LeetCode',
  research: 'Research',
  terminal: 'Terminal',
}

interface TopbarProps {
  onOpenSettings: () => void
}

export function Topbar({ onOpenSettings }: TopbarProps) {
  const { thinking, activeTool, setSidebarOpen } = useStore()

  return (
    <header className="h-[50px] flex items-center px-4 gap-3 border-b border-[var(--bdr)] bg-[var(--surf)] backdrop-blur-2xl flex-shrink-0">

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--surf2)] border border-transparent hover:border-[var(--bdr)] transition-all lg:hidden"
      >
        <Menu size={16} />
      </button>

      {/* Status pill — center */}
      <div className="flex-1 flex justify-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] border transition-all',
            thinking
              ? 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.25)] text-[var(--acc)]'
              : 'bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt2)]'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              thinking
                ? 'bg-[var(--acc)] animate-pulse-dot'
                : 'bg-emerald-400'
            )}
          />
          {thinking ? 'Thinking…' : 'Ready'}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10.5px] text-[var(--acc)] tracking-wide hidden sm:inline opacity-80">
          {TOOL_LABELS[activeTool]}
        </span>
        <button
          onClick={onOpenSettings}
          title="Settings (Ctrl+,)"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--txt3)] hover:text-[var(--acc)] hover:bg-[var(--acc-g)] border border-transparent hover:border-[rgba(201,168,108,0.2)] transition-all"
        >
          <Settings size={14} />
        </button>
      </div>

    </header>
  )
}