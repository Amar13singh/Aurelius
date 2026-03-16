'use client'
import { useState } from 'react'
import { Settings, X, Zap, Thermometer, Brain, Save, RotateCcw, Info } from 'lucide-react'
import { useStore } from '@/store'
import { toast } from '@/app/components/ui'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    model, setModel,
    temperature, setTemperature,
    streaming, setStreaming,
    systemPrompt, setSystemPrompt,
  } = useStore()

  const [draftSystem, setDraftSystem] = useState(systemPrompt)
  const [draftTemp, setDraftTemp] = useState(temperature)

  function save() {
    setSystemPrompt(draftSystem)
    setTemperature(draftTemp)
    toast('Settings saved')
    onClose()
  }

  function reset() {
    setDraftSystem('')
    setDraftTemp(0.7)
    setModel('claude-sonnet-4-5')
    setStreaming(true)
    setSystemPrompt('')
    setTemperature(0.7)
    toast('Settings reset to defaults')
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-[var(--bg2)] border-l border-[var(--bdr2)] shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bdr)]">
          <div className="flex items-center gap-2.5">
            <Settings size={16} className="text-[var(--acc)]" />
            <h2 className="font-display text-xl font-light text-[var(--txt)]">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--txt3)] hover:text-[var(--txt)] hover:bg-[var(--surf2)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Model */}
          <section>
            <SectionLabel icon={<Brain size={13} />} title="Model" />
            <div className="space-y-2 mt-3">
              {(
                [
                  'claude-sonnet-4-5',
                  'claude-opus-4-5',
                  'claude-haiku-4-5-20251001',
                ] as const
              ).map((m) => {
                const info: Record<
                  string,
                  {
                    label: string
                    desc: string
                    badge: string
                    badgeColor: string
                  }
                > = {
                  'claude-sonnet-4-5': {
                    label: 'Claude Sonnet 4.5',
                    desc: 'Best balance of speed and intelligence',
                    badge: 'Recommended',
                    badgeColor:
                      'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
                  },
                  'claude-opus-4-5': {
                    label: 'Claude Opus 4.5',
                    desc: 'Most capable, slower and more thorough',
                    badge: 'Powerful',
                    badgeColor:
                      'text-[var(--acc)] bg-[var(--acc-g)] border-[rgba(201,168,108,0.3)]',
                  },
                  'claude-haiku-4-5-20251001': {
                    label: 'Claude Haiku 4.5',
                    desc: 'Fastest, great for simple tasks',
                    badge: 'Fast',
                    badgeColor:
                      'text-sky-400 bg-sky-400/10 border-sky-400/20',
                  },
                }
                const { label, desc, badge, badgeColor } = info[m]
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setModel(m)
                      toast(`Model: ${label}`)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                      model === m
                        ? 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.3)]'
                        : 'bg-[var(--surf2)] border-[var(--bdr)] hover:border-[var(--bdr2)]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        model === m
                          ? 'bg-[var(--acc)] animate-pulse-dot'
                          : 'bg-[var(--txt3)]'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-[13px] font-medium',
                          model === m
                            ? 'text-[var(--acc)]'
                            : 'text-[var(--txt)]'
                        )}
                      >
                        {label}
                      </p>
                      <p className="text-[11px] text-[var(--txt3)] mt-0.5">
                        {desc}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-mono flex-shrink-0',
                        badgeColor
                      )}
                    >
                      {badge}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Streaming */}
          <section>
            <SectionLabel icon={<Zap size={13} />} title="Response Streaming" />
            <div className="mt-3 flex items-center justify-between p-4 bg-[var(--surf2)] border border-[var(--bdr)] rounded-xl">
              <div>
                <p className="text-[13px] text-[var(--txt)] font-medium">
                  Stream tokens live
                </p>
                <p className="text-[11px] text-[var(--txt3)] mt-0.5">
                  Watch the response appear in real-time
                </p>
              </div>
              <Toggle
                value={streaming}
                onChange={(v) => {
                  setStreaming(v)
                  toast(`Streaming ${v ? 'on' : 'off'}`)
                }}
              />
            </div>
          </section>

          {/* Temperature */}
          <section>
            <SectionLabel
              icon={<Thermometer size={13} />}
              title="Temperature"
            />
            <div className="mt-3 p-4 bg-[var(--surf2)] border border-[var(--bdr)] rounded-xl space-y-3">
              <div className="flex justify-between text-[11px] text-[var(--txt3)]">
                <span>Precise & deterministic</span>
                <span>Creative & varied</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={draftTemp}
                onChange={(e) => setDraftTemp(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {[0, 0.3, 0.5, 0.7, 1.0].map((v) => (
                    <button
                      key={v}
                      onClick={() => setDraftTemp(v)}
                      className={cn(
                        'px-2 py-1 rounded text-[10px] font-mono border transition-all',
                        Math.abs(draftTemp - v) < 0.01
                          ? 'bg-[var(--acc-g)] border-[rgba(201,168,108,0.3)] text-[var(--acc)]'
                          : 'border-[var(--bdr)] text-[var(--txt3)] hover:border-[var(--bdr2)] hover:text-[var(--txt)]'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="font-display text-2xl font-light text-[var(--acc)]">
                  {draftTemp.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* System Prompt */}
          <section>
            <SectionLabel
              icon={<Settings size={13} />}
              title="Default System Prompt"
            />
            <p className="text-[11.5px] text-[var(--txt3)] mt-1.5 mb-3">
              Applied to all Chat conversations unless overridden per-session.
            </p>
            <textarea
              value={draftSystem}
              onChange={(e) => setDraftSystem(e.target.value)}
              placeholder="You are a helpful assistant…"
              rows={5}
              className="w-full bg-[var(--bg)] border border-[var(--bdr2)] rounded-xl text-[var(--txt)] text-[13px] font-body leading-relaxed px-4 py-3 outline-none resize-y focus:border-[var(--acc)] transition-colors placeholder:text-[var(--txt3)]"
            />
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <SectionLabel
              icon={<Info size={13} />}
              title="Keyboard Shortcuts"
            />
            <div className="mt-3 space-y-1.5">
              {[
                ['Ctrl + 1–6', 'Switch tools'],
                ['Ctrl + K', 'New chat'],
                ['Ctrl + E', 'Export chat'],
                ['Ctrl + ,', 'Open settings'],
                ['Enter', 'Send message'],
                ['Shift + Enter', 'New line'],
                ['↑ / ↓', 'Terminal history'],
                ['Esc', 'Close modals'],
              ].map(([key, desc]) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--surf2)] transition-colors"
                >
                  <span className="text-[12.5px] text-[var(--txt2)]">
                    {desc}
                  </span>
                  <kbd className="font-mono text-[10.5px] px-2 py-0.5 bg-[var(--bg3)] border border-[var(--bdr)] rounded-md text-[var(--txt3)]">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section>
            <SectionLabel icon={<Info size={13} />} title="About" />
            <div className="mt-3 p-4 bg-[var(--surf2)] border border-[var(--bdr)] rounded-xl space-y-2">
              {[
                ['App', 'Aurelius AI Suite'],
                ['Stack', 'Next.js · Tailwind · Zustand'],
                ['AI', 'Claude via Puter.js (free)'],
                ['Deploy', 'Vercel (zero config)'],
                ['Version', '2.0.0'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-[12.5px]">
                  <span className="text-[var(--txt3)]">{label}</span>
                  <span className="text-[var(--txt2)] font-mono text-[11.5px]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--bdr)] flex gap-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] bg-[var(--surf2)] border border-[var(--bdr)] text-[var(--txt2)] hover:text-red-400 hover:border-red-400/40 transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={save}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] bg-gradient-to-br from-[var(--acc)] to-[#e8c97a] text-[#2a1a00] font-medium shadow-[0_4px_14px_rgba(201,168,108,0.25)] hover:opacity-90 transition-all"
          >
            <Save size={12} />
            Save Settings
          </button>
        </div>
      </div>
    </>
  )
}

function SectionLabel({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--acc)]">{icon}</span>
      <h3 className="text-[11px] font-semibold tracking-widest uppercase text-[var(--txt3)]">
        {title}
      </h3>
    </div>
  )
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-11 h-6 rounded-full border transition-all duration-300',
        value
          ? 'bg-[var(--acc)] border-[var(--acc)]'
          : 'bg-[var(--bg3)] border-[var(--bdr2)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300',
          value ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}