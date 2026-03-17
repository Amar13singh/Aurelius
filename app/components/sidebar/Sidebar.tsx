'use client'
import { useState } from 'react'
import {
  MessageSquare, FileText, Code2, GitBranch,
  Search, Terminal, Sun, Moon, Download, Settings,
  X, ChevronRight,
} from 'lucide-react'
import { useStore } from '@/store'
import { toast } from '@/app/components/ui'
import { cn } from '@/lib/utils'
import type { ToolId } from '@/types'

const TOOLS: {
  id: ToolId
  label: string
  desc: string
  Icon: React.FC<{ size?: number }>
}[] = [
  { id: 'chat',     label: 'Chat',           desc: 'AI conversation',      Icon: MessageSquare },
  { id: 'pdf',      label: 'PDF Reader',      desc: 'Ask your documents',   Icon: FileText      },
  { id: 'code',     label: 'Code Analyzer',   desc: 'Review & debug code',  Icon: Code2         },
  { id: 'leetcode', label: 'LeetCode',        desc: 'Solve problems',       Icon: GitBranch     },
  { id: 'research', label: 'Research',        desc: 'Summarize papers',     Icon: Search        },
  { id: 'terminal', label: 'AI Terminal',     desc: 'Explain commands',     Icon: Terminal      },
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
    const lines = [`# Aurelius Export\n${new Date().toLocaleString()}\n\n---\n`]
    chatMessages.forEach((m) =>
      lines.push(`**${m.role === 'user' ? 'You' : 'Aurelius'}**\n\n${m.content}\n\n---\n`)
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown' }))
    a.download = `aurelius-${Date.now()}.md`
    a.click()
    toast('Exported')
  }

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-[280px] z-50 flex flex-col',
          'bg-[var(--bg2)] border-r border-[var(--bdr)]',
          'transition-transform duration-300 ease-in-out shadow-2xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--bdr)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--acc2)] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <p className="font-semibold text-[var(--txt)] text-[14px] leading-none">Aurelius</p>
              <p className="text-[11px] text-[var(--txt3)] mt-0.5">AI Suite</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tools */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
            Tools
          </p>
          <div className="space-y-1">
            {TOOLS.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTool(id); setSidebarOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                  activeTool === id
                    ? 'bg-[var(--acc2)] bg-opacity-10 text-[var(--acc2)] border border-[var(--acc2)] border-opacity-20'
                    : 'text-[var(--txt2)] hover:bg-[var(--bg3)] hover:text-[var(--txt)]'
                )}
              >
                <span className="flex-shrink-0">
                    <Icon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-none">{label}</p>
                  <p className="text-[11px] text-[var(--txt3)] mt-0.5">{desc}</p>
                </div>
                {activeTool === id && <ChevronRight size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="px-3 py-3 border-t border-[var(--bdr)]">
          <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest uppercase text-[var(--txt3)]">Model</p>
          <div className="bg-[var(--bg3)] border border-[var(--bdr)] rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--acc3)] animate-pulse-dot flex-shrink-0" />
              <select
                value={model}
                onChange={(e) => { setModel(e.target.value as never); toast(`Model: ${e.target.value.split('-')[1]}`) }}
                className="flex-1 bg-transparent border-none outline-none text-[var(--txt)] text-[12.5px] cursor-pointer"
              >
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="claude-opus-4-5">Claude Opus 4.5</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-3 pb-4 flex items-center justify-between">
          <div className="flex gap-1">
            <button onClick={toggleTheme} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all" title="Toggle theme">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={exportChat} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--bg3)] transition-all" title="Export">
              <Download size={14} />
            </button>
            <button onClick={onOpenSettings} className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--txt3)] hover:text-[var(--acc2)] hover:bg-[var(--bg3)] transition-all" title="Settings">
              <Settings size={14} />
            </button>
          </div>
          <span className="font-mono text-[10px] text-[var(--txt3)]">~{totalTokens.toLocaleString()} tokens</span>
        </div>
      </aside>
    </>
  )
}