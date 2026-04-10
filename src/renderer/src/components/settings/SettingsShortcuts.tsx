import { useState, useCallback } from 'react'
import { useShortcutStore } from '@/stores/useShortcutStore'
import {
  DEFAULT_SHORTCUTS,
  shortcutCategoryLabels,
  shortcutCategoryOrder,
  formatBinding,
  type KeyBinding,
  type ModifierKey,
  type ShortcutCategory,
  getShortcutsByCategory
} from '@/lib/keyboard-shortcuts'
import { Button } from '@/components/ui/button'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n'

export function SettingsShortcuts(): React.JSX.Element {
  const { tr } = useI18n()
  const {
    customBindings,
    setCustomBinding,
    removeCustomBinding,
    resetToDefaults,
    getDisplayString
  } = useShortcutStore()
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<string[]>([])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!recordingId) return
      e.preventDefault()
      e.stopPropagation()

      // Ignore modifier-only presses
      if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return

      // Escape cancels recording
      if (e.key === 'Escape') {
        setRecordingId(null)
        setConflicts([])
        return
      }

      const modifiers: ModifierKey[] = []
      if (e.metaKey) modifiers.push('meta')
      if (e.ctrlKey) modifiers.push('ctrl')
      if (e.altKey) modifiers.push('alt')
      if (e.shiftKey) modifiers.push('shift')

      // Require at least one modifier for safety
      if (modifiers.length === 0) {
        toast.error(tr('Shortcuts must include at least one modifier key (Cmd/Ctrl/Alt/Shift)', '快捷键必须至少包含一个修饰键（Cmd/Ctrl/Alt/Shift）'))
        return
      }

      const binding: KeyBinding = {
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
        modifiers
      }

      const result = setCustomBinding(recordingId, binding)
      if (result.success) {
        setRecordingId(null)
        setConflicts([])
        toast.success(
          tr(`Shortcut updated to ${formatBinding(binding)}`, `快捷键已更新为 ${formatBinding(binding)}`)
        )
      } else {
        setConflicts(result.conflicts || [])
      }
    },
    [recordingId, setCustomBinding, tr]
  )

  const handleResetShortcut = (shortcutId: string): void => {
    removeCustomBinding(shortcutId)
    toast.success(tr('Shortcut reset to default', '快捷键已重置为默认值'))
  }

  const handleResetAll = (): void => {
    resetToDefaults()
    toast.success(tr('All shortcuts reset to defaults', '全部快捷键已重置为默认值'))
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium mb-1">{tr('Keyboard Shortcuts', '键盘快捷键')}</h3>
          <p className="text-sm text-muted-foreground">{tr('Customize keyboard shortcuts', '自定义键盘快捷键')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          data-testid="reset-all-shortcuts"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          {tr('Reset All', '全部重置')}
        </Button>
      </div>

      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">{tr('Shortcut conflict', '快捷键冲突')}</p>
            <p className="text-muted-foreground">
              {tr('This binding is already used by:', '该按键组合已被以下操作使用：')}{' '}
              {conflicts
                .map((id) => {
                  const shortcut = DEFAULT_SHORTCUTS.find((s) => s.id === id)
                  return shortcut ? translateShortcutLabel(shortcut.label, tr) : id
                })
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      {shortcutCategoryOrder.map((category) => (
        <ShortcutCategorySection
          key={category}
          category={category}
          recordingId={recordingId}
          customBindings={customBindings}
          getDisplayString={getDisplayString}
          tr={tr}
          onStartRecording={(id) => {
            setRecordingId(id)
            setConflicts([])
          }}
          onResetShortcut={handleResetShortcut}
        />
      ))}
    </div>
  )
}

interface ShortcutCategorySectionProps {
  category: ShortcutCategory
  recordingId: string | null
  customBindings: Record<string, KeyBinding>
  getDisplayString: (id: string) => string
  tr: (english: string, chinese: string) => string
  onStartRecording: (id: string) => void
  onResetShortcut: (id: string) => void
}

function ShortcutCategorySection({
  category,
  recordingId,
  customBindings,
  getDisplayString,
  tr,
  onStartRecording,
  onResetShortcut
}: ShortcutCategorySectionProps): React.JSX.Element {
  const shortcuts = getShortcutsByCategory(category)
  const categoryLabels: Record<ShortcutCategory, string> = {
    session: tr('Sessions', '会话'),
    navigation: tr('Navigation', '导航'),
    git: 'Git',
    sidebar: tr('Sidebars', '侧边栏'),
    focus: tr('Focus', '焦点'),
    settings: tr('Settings', '设置')
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {categoryLabels[category] ?? shortcutCategoryLabels[category]}
      </h4>
      <div className="space-y-1">
        {shortcuts.map((shortcut) => {
          const isRecording = recordingId === shortcut.id
          const isCustomized = shortcut.id in customBindings
          const displayString = getDisplayString(shortcut.id)

          return (
            <div
              key={shortcut.id}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/30"
              data-testid={`shortcut-${shortcut.id}`}
            >
              <div className="flex-1">
                <span className="text-sm">{translateShortcutLabel(shortcut.label, tr)}</span>
                {shortcut.description && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {translateShortcutText(shortcut.description, tr)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isCustomized && (
                  <button
                    onClick={() => onResetShortcut(shortcut.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title={tr('Reset to default', '重置为默认值')}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => onStartRecording(shortcut.id)}
                  className={cn(
                    'min-w-[100px] px-2.5 py-1 rounded border text-xs font-mono text-right transition-colors',
                    isRecording
                      ? 'border-primary bg-primary/10 text-primary animate-pulse'
                      : isCustomized
                        ? 'border-primary/50 bg-primary/5 text-foreground hover:border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                  data-testid={`shortcut-binding-${shortcut.id}`}
                >
                  {isRecording ? tr('Press keys...', '请按下按键...') : displayString}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function translateShortcutText(
  description: string,
  tr: (english: string, chinese: string) => string
): string {
  const translations: Record<string, string> = {
    'Create a new chat session': '创建新的聊天会话',
    'Close the current session tab (noop if none open)': '关闭当前会话标签（如果没有打开则无操作）',
    'Switch between build and plan mode': '在 Build 与 Plan 模式之间切换',
    'Start or stop the project run script': '启动或停止项目运行脚本',
    'Cycle through thinking-level variants (e.g., high/max)': '循环切换思考强度变体（如 high/max）',
    'Open the file search dialog': '打开文件搜索对话框',
    'Open the command palette': '打开命令面板',
    'Open the session history panel': '打开会话历史面板',
    'Create a new worktree for the current project': '为当前项目创建新的工作树',
    'Focus the git commit form': '聚焦到 Git 提交表单',
    'Push commits to the remote repository': '将提交推送到远程仓库',
    'Pull commits from the remote repository': '从远程仓库拉取提交',
    'Focus the project filter input': '聚焦到项目筛选输入框',
    'Show or hide the left sidebar': '显示或隐藏左侧边栏',
    'Show or hide the right sidebar': '显示或隐藏右侧边栏',
    'Move focus to the left sidebar': '将焦点移动到左侧边栏',
    'Move focus to the main chat pane': '将焦点移动到主聊天区域',
    'Open the settings panel': '打开设置面板'
  }

  return tr(description, translations[description] ?? description)
}

function translateShortcutLabel(
  label: string,
  tr: (english: string, chinese: string) => string
): string {
  const labelTranslations: Record<string, string> = {
    'New Session': '新建会话',
    'Close Session': '关闭会话',
    'Toggle Build/Plan Mode': '切换 Build/Plan 模式',
    'Run Project': '运行项目',
    'Cycle Model Variant': '循环切换模型变体',
    'Search Files': '搜索文件',
    'Open Command Palette': '打开命令面板',
    'Open Session History': '打开会话历史',
    'New Worktree': '新建工作树',
    'Focus Commit Form': '聚焦提交表单',
    'Push to Remote': '推送到远程',
    'Pull from Remote': '从远程拉取',
    'Filter Projects': '筛选项目',
    'Toggle Left Sidebar': '切换左侧边栏',
    'Toggle Right Sidebar': '切换右侧边栏',
    'Focus Left Sidebar': '聚焦左侧边栏',
    'Focus Main Pane': '聚焦主区域',
    'Open Settings': '打开设置'
  }

  return tr(label, labelTranslations[label] ?? label)
}
