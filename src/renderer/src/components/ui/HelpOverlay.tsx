import { useMemo } from 'react'
import { useVimModeStore } from '@/stores/useVimModeStore'
import { useHintStore } from '@/stores/useHintStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useWorktreeStore } from '@/stores/useWorktreeStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { DEFAULT_SHORTCUTS, formatBinding, shortcutCategoryOrder } from '@/lib/keyboard-shortcuts'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/useI18n'

// ---------------------------------------------------------------------------
// Mnemonic highlighting helper
// ---------------------------------------------------------------------------

function MnemonicLabel({ letter, label }: { letter: string; label: string }): React.JSX.Element {
  const index = label.toLowerCase().indexOf(letter.toLowerCase())
  if (index === -1) return <span>{label}</span>
  return (
    <span>
      {label.slice(0, index)}
      <span className="text-primary font-bold bg-primary/15 px-0.5 rounded-sm underline underline-offset-2 decoration-primary decoration-2">
        {label[index]}
      </span>
      {label.slice(index + 1)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Key badge — renders a single keyboard key visually
// ---------------------------------------------------------------------------

function KeyBadge({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 font-mono text-[11px] font-medium rounded border border-border/60 bg-muted/40 text-foreground">
      {children}
    </kbd>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </h3>
  )
}

// ---------------------------------------------------------------------------
// Shortcut row — key + label
// ---------------------------------------------------------------------------

function ShortcutRow({
  keyContent,
  label
}: {
  keyContent: React.ReactNode
  label: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="shrink-0">{keyContent}</span>
      <span className="text-[12px] text-muted-foreground truncate">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HelpOverlay(): React.JSX.Element | null {
  const { tr } = useI18n()
  const vimModeEnabled = useSettingsStore((s) => s.vimModeEnabled)
  const helpOverlayOpen = useVimModeStore((s) => s.helpOverlayOpen)
  const mode = useVimModeStore((s) => s.mode)
  const hintMap = useHintStore((s) => s.hintMap)
  const hintTargetMap = useHintStore((s) => s.hintTargetMap)
  const sessionHintMap = useHintStore((s) => s.sessionHintMap)
  const worktreesByProject = useWorktreeStore((s) => s.worktreesByProject)
  const sessionsByWorktree = useSessionStore((s) => s.sessionsByWorktree)
  const projects = useProjectStore((s) => s.projects)
  const connections = useConnectionStore((s) => s.connections)

  // Build flat lookup maps for resolving names
  const worktreeNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const worktrees of worktreesByProject.values()) {
      for (const wt of worktrees) {
        map.set(wt.id, wt.name)
      }
    }
    return map
  }, [worktreesByProject])

  const sessionNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const sessions of sessionsByWorktree.values()) {
      for (const session of sessions) {
        map.set(session.id, session.name ?? session.id)
      }
    }
    return map
  }, [sessionsByWorktree])

  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const project of projects) {
      map.set(project.id, project.name)
    }
    return map
  }, [projects])

  const connectionNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const conn of connections) {
      const projectNames = [...new Set(conn.members?.map((m) => m.project_name) || [])].join(' + ')
      const name = conn.custom_name || projectNames || conn.name || tr('Connection', '连接')
      map.set(conn.id, name)
    }
    return map
  }, [connections, tr])

  // Build sidebar hint entries for display
  const sidebarHintEntries = useMemo(() => {
    const entries: Array<{ code: string; label: string }> = []
    for (const [key, code] of hintMap.entries()) {
      const target = hintTargetMap.get(key)
      if (!target) continue

      if (target.kind === 'worktree' && target.worktreeId) {
        const name = worktreeNameMap.get(target.worktreeId) ?? target.worktreeId
        entries.push({ code, label: name })
      } else if (target.kind === 'project') {
        const name = projectNameMap.get(target.projectId) ?? target.projectId
        entries.push({ code, label: name })
      } else if (target.kind === 'pinned-worktree' && target.worktreeId) {
        const name = worktreeNameMap.get(target.worktreeId) ?? target.worktreeId
        entries.push({ code, label: `[${tr('pin', '固定')}] ${name}` })
      } else if (target.kind === 'pinned-connection' && target.connectionId) {
        const name = connectionNameMap.get(target.connectionId) ?? target.connectionId
        entries.push({ code, label: `[${tr('pin', '固定')}] ${name}` })
      } else if (target.kind === 'connection' && target.connectionId) {
        const name = connectionNameMap.get(target.connectionId) ?? target.connectionId
        entries.push({ code, label: name })
      }
    }
    return entries.sort((a, b) => a.code.localeCompare(b.code))
  }, [hintMap, hintTargetMap, worktreeNameMap, projectNameMap, connectionNameMap, tr])

  // Build session hint entries for display
  const sessionHintEntries = useMemo(() => {
    const entries: Array<{ code: string; label: string }> = []
    for (const [sessionId, code] of sessionHintMap.entries()) {
      const name = sessionNameMap.get(sessionId) ?? sessionId
      entries.push({ code, label: name })
    }
    return entries.sort((a, b) => a.code.localeCompare(b.code))
  }, [sessionHintMap, sessionNameMap])

  // Group system shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const translateShortcutLabel = (label: string) => {
      switch (label) {
        case 'New Session':
          return tr('New Session', '新建会话')
        case 'Close Session':
          return tr('Close Session', '关闭会话')
        case 'Toggle Build/Plan Mode':
          return tr('Toggle Build/Plan Mode', '切换构建/计划模式')
        case 'Run Project':
          return tr('Run Project', '运行项目')
        case 'Cycle Model Variant':
          return tr('Cycle Model Variant', '切换模型变体')
        case 'Search Files':
          return tr('Search Files', '搜索文件')
        case 'Open Command Palette':
          return tr('Open Command Palette', '打开命令面板')
        case 'Open Session History':
          return tr('Open Session History', '打开会话历史')
        case 'New Worktree':
          return tr('New Worktree', '新建工作树')
        case 'Focus Commit Form':
          return tr('Focus Commit Form', '聚焦提交表单')
        case 'Push to Remote':
          return tr('Push to Remote', '推送到远程')
        case 'Pull from Remote':
          return tr('Pull from Remote', '从远程拉取')
        case 'Filter Projects':
          return tr('Filter Projects', '筛选项目')
        case 'Toggle Left Sidebar':
          return tr('Toggle Left Sidebar', '切换左侧边栏')
        case 'Toggle Right Sidebar':
          return tr('Toggle Right Sidebar', '切换右侧边栏')
        case 'Focus Left Sidebar':
          return tr('Focus Left Sidebar', '聚焦左侧边栏')
        case 'Focus Main Pane':
          return tr('Focus Main Pane', '聚焦主面板')
        case 'Open Settings':
          return tr('Open Settings', '打开设置')
        default:
          return label
      }
    }

    const groups = new Map<string, Array<{ label: string; binding: string }>>()
    for (const shortcut of DEFAULT_SHORTCUTS) {
      const binding = formatBinding(shortcut.defaultBinding)
      const group = groups.get(shortcut.category) ?? []
      group.push({ label: translateShortcutLabel(shortcut.label), binding })
      groups.set(shortcut.category, group)
    }
    return groups
  }, [tr])

  if (!vimModeEnabled || !helpOverlayOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="help-overlay-backdrop"
        className="fixed inset-0 z-50 bg-black/60"
        onClick={() => useVimModeStore.getState().setHelpOverlayOpen(false)}
      />

      {/* Overlay card */}
      <div
        data-testid="help-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div className="pointer-events-auto w-[640px] max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-background shadow-2xl p-5">
          {/* Header with mode pill */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              {tr('Keyboard Shortcuts', '键盘快捷键')}
            </h2>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded border select-none',
                mode === 'normal'
                  ? 'text-muted-foreground bg-muted/50 border-border/50'
                  : 'text-primary bg-primary/10 border-primary/30'
              )}
            >
              {mode === 'normal' ? tr('NORMAL', '普通') : tr('INSERT', '插入')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* ---- Vim Navigation ---- */}
            <div>
              <SectionTitle>{tr('Vim Navigation', 'Vim 导航')}</SectionTitle>
              <ShortcutRow
                keyContent={
                  <span className="flex gap-1">
                    <KeyBadge>j</KeyBadge>
                    <KeyBadge>k</KeyBadge>
                  </span>
                }
                label={tr('Navigate worktrees', '切换工作树')}
              />
              <ShortcutRow
                keyContent={
                  <span className="flex gap-1">
                    <KeyBadge>h</KeyBadge>
                    <KeyBadge>l</KeyBadge>
                  </span>
                }
                label={tr('Navigate session tabs', '切换会话标签')}
              />
              <ShortcutRow
                keyContent={<KeyBadge>I</KeyBadge>}
                label={tr('Filter projects (insert mode)', '筛选项目（插入模式）')}
              />
              <ShortcutRow
                keyContent={<KeyBadge>Esc</KeyBadge>}
                label={tr('Return to normal mode', '返回普通模式')}
              />
              <ShortcutRow
                keyContent={<KeyBadge>?</KeyBadge>}
                label={tr('Toggle this help', '切换此帮助')}
              />
            </div>

            {/* ---- Panel Shortcuts ---- */}
            <div>
              <SectionTitle>{tr('Panel Shortcuts', '面板快捷键')}</SectionTitle>

              {/* Right sidebar tabs */}
              <ShortcutRow
                keyContent={<KeyBadge>c</KeyBadge>}
                label={<MnemonicLabel letter="c" label={tr('Changes', '更改')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>f</KeyBadge>}
                label={<MnemonicLabel letter="f" label={tr('Files', '文件')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>d</KeyBadge>}
                label={<MnemonicLabel letter="d" label={tr('Diffs', '差异')} />}
              />

              {/* Bottom panel tabs */}
              <ShortcutRow
                keyContent={<KeyBadge>s</KeyBadge>}
                label={<MnemonicLabel letter="s" label={tr('Setup', '设置')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>u</KeyBadge>}
                label={<MnemonicLabel letter="u" label={tr('Run', '运行')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>t</KeyBadge>}
                label={<MnemonicLabel letter="t" label={tr('Terminal', '终端')} />}
              />

              {/* File tab cycling */}
              <ShortcutRow
                keyContent={
                  <span className="flex gap-1">
                    <KeyBadge>[</KeyBadge>
                    <KeyBadge>]</KeyBadge>
                  </span>
                }
                label={tr('Prev / Next file tab', '上一个 / 下一个文件标签')}
              />
            </div>

            {/* ---- Action Shortcuts ---- */}
            <div>
              <SectionTitle>{tr('Action Shortcuts', '操作快捷键')}</SectionTitle>
              <ShortcutRow
                keyContent={<KeyBadge>r</KeyBadge>}
                label={<MnemonicLabel letter="r" label={tr('Review', '评审')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>p</KeyBadge>}
                label={<MnemonicLabel letter="p" label="PR" />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>m</KeyBadge>}
                label={<MnemonicLabel letter="m" label={tr('Merge PR', '合并 PR')} />}
              />
              <ShortcutRow
                keyContent={<KeyBadge>a</KeyBadge>}
                label={<MnemonicLabel letter="a" label={tr('Archive', '归档')} />}
              />
            </div>

            {/* ---- Dynamic Sidebar Hints ---- */}
            {sidebarHintEntries.length > 0 && (
              <div>
                <SectionTitle>{tr('Sidebar Hints', '侧边栏提示')}</SectionTitle>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {sidebarHintEntries.map(({ code, label }) => (
                    <ShortcutRow
                      key={code}
                      keyContent={<KeyBadge>{code}</KeyBadge>}
                      label={label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Dynamic Session Hints ---- */}
            {sessionHintEntries.length > 0 && (
              <div>
                <SectionTitle>{tr('Session Hints', '会话提示')}</SectionTitle>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {sessionHintEntries.map(({ code, label }) => (
                    <ShortcutRow
                      key={code}
                      keyContent={<KeyBadge>{code}</KeyBadge>}
                      label={label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- System Shortcuts ---- */}
            <div className="col-span-2 border-t border-border/50 pt-3 mt-1">
              <SectionTitle>{tr('System Shortcuts', '系统快捷键')}</SectionTitle>
              <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                {shortcutCategoryOrder.map((category) => {
                  const shortcuts = groupedShortcuts.get(category)
                  if (!shortcuts?.length) return null
                  return shortcuts.map(({ label, binding }) => (
                    <ShortcutRow
                      key={label}
                      keyContent={<KeyBadge>{binding}</KeyBadge>}
                      label={label}
                    />
                  ))
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
