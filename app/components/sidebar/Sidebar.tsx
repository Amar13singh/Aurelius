'use client'
import {
  MessageSquare, FileText, Code2, GitBranch,
  Search, Terminal, Sun, Moon, Download, Settings, ChevronLeft,
} from 'lucide-react'
import { useStore } from '@/store'
import { Badge } from '@/app/components/ui'
import { toast } from '@/app/components/ui'
import { cn } from '@/lib/utils'
import type { ToolId } from '@/types'

const TOOLS: {
  id: ToolId
  label: string
  badge: string
  Icon: React.FC<{ size?: number }>
}[] = [
  { id: 'chat',     label: 'Chat',           badge: 'AI',      Icon: MessageSquare },
  { id: 'pdf',      label: 'PDF Reader',      badge: 'Ask',     Icon: FileText      },
  { id: 'code',     label: 'Code Analyzer',   badge: 'Analyze', Icon: Code2         },
  { id: 'leetcode', label: 'LeetCode Solver', badge: 'Solve',   Icon: GitBranch     },
  { id: 'research', label: 'Research Papers', badge: 'Summ.',   Icon: Search        },
  { id: 'terminal', label: 'AI Terminal',     badge: 'CMD',     Icon: Terminal      },
]

interface SidebarProps {
  onOpenSettings: () => void
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const {
    activeTool, setActiveTool,
    model, setModel,
    theme, toggleTheme,
    sidebarOpen, setSidebarOpen,
    totalTokens,
  } = useStore()

  function exportChat() {
    const { chatMessages } = useStore.getState()
    if (!chatMessages.length) { toast('Nothing to export'); return }
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
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
            'flex flex-col h-screen bg-[var(--surf)] backdrop-blur-2xl border-r border-[var(--bdr)] z-50 transition-all duration-300 shadow-2xl',
          'fixed lg:relative',
          sidebarOpen
            ? 'w-[240px] translate-x-0'
            : 'w-0 lg:w-[240px] -translate-x-full lg:translate-x-0'
        )}
      >
        <div className="overflow-hidden w-[240px] flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--bdr)] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--acc)] to-[var(--acc2)] flex items-center justify-center text-white font-display text-lg font-semibold flex-shrink-0">
                A
              </div>
              <div>
                <p className="font-display text-[16px] font-semibold text-[var(--txt)] leading-none">
                  Aurelius
                </p>
                <p className="text-[10px] text-[var(--txt3)] tracking-widest uppercase mt-0.5">
                  AI Suite
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--surf2)] transition-all lg:hidden"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Tool Navigation */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--txt3)]">
              Tools
            </p>
            {TOOLS.map(({ id, label, badge, Icon }, idx) => (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                title={`Ctrl+${idx + 1}`}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] transition-all duration-150 text-left group',
                  activeTool === id
                    ? 'bg-[var(--acc-g)] border border-[rgba(201,168,108,0.25)] text-[var(--acc)]'
                    : 'border border-transparent text-[var(--txt2)] hover:bg-[var(--surf2)] hover:text-[var(--txt)]'
                )}
              >
                <Icon size={14} />
                <span className="flex-1 font-body">{label}</span>
                <Badge
                  className={cn(
                    activeTool === id
                      ? 'bg-[rgba(201,168,108,0.15)] border-[rgba(201,168,108,0.3)] text-[var(--acc)]'
                      : 'bg-[var(--surf2)] border-[var(--bdr)] text-[var(--txt3)] group-hover:border-[var(--bdr2)]'
                  )}
                >
                  {badge}
                </Badge>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-[var(--bdr)] p-3 space-y-2.5 flex-shrink-0">

            {/* Model selector */}
            <div className="flex items-center gap-2 bg-[var(--surf2)] border border-[var(--bdr)] rounded-lg px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-[var(--acc)] flex items-center justify-center flex-shrink-0">
                <div className="w-1 h-1 rounded-full bg-[var(--acc)] animate-pulse-dot" />
              </div>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value as never)
                  toast(`Model: ${e.target.value.split('-')[1]}`)
                }}
                className="flex-1 bg-transparent border-none outline-none text-[var(--txt)] font-body text-[11.5px] cursor-pointer"
              >
                <option value="claude-sonnet-4-5">Sonnet 4.5</option>
                <option value="claude-opus-4-5">Opus 4.5</option>
                <option value="claude-haiku-4-5-20251001">Haiku 4.5</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                title="Toggle theme"
                className="flex-1 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--surf2)] border border-transparent hover:border-[var(--bdr)] transition-all"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button
                onClick={exportChat}
                title="Export chat (Ctrl+E)"
                className="flex-1 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--surf2)] border border-transparent hover:border-[var(--bdr)] transition-all"
              >
                <Download size={13} />
              </button>
              <button
                onClick={onOpenSettings}
                title="Settings (Ctrl+,)"
                className="flex-1 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--acc)] hover:bg-[var(--acc-g)] border border-transparent hover:border-[rgba(201,168,108,0.2)] transition-all"
              >
                <Settings size={13} />
              </button>
            </div>

            {/* Token counter */}
            <div className="text-center">
              <span className="font-mono text-[10px] text-[var(--txt3)]">
                ~{totalTokens.toLocaleString()} tokens used
              </span>
            </div>

          </div>
        </div>
      </aside>
    </>
  )
}