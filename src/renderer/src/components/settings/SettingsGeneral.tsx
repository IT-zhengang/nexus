import { useThemeStore } from '@/stores/useThemeStore'
import { DEFAULT_THEME_ID } from '@/lib/themes'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useShortcutStore } from '@/stores/useShortcutStore'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n'
import type { UsageProvider } from '@shared/types/usage'
import claudeIcon from '@/assets/model-icons/claude.svg'
import openaiIcon from '@/assets/model-icons/openai.svg'

export function SettingsGeneral(): React.JSX.Element {
  const { setTheme } = useThemeStore()
  const { tr } = useI18n()
  const {
    language,
    autoStartSession,
    autoPullBeforeWorktree,
    boardMode,
    vimModeEnabled,
    mergeConflictMode,
    tipsEnabled,
    breedType,
    showModelIcons,
    showModelProvider,
    usageIndicatorMode,
    usageIndicatorProviders,
    defaultAgentSdk,
    stripAtMentions,
    updateSetting,
    resetToDefaults
  } = useSettingsStore()
  const { resetToDefaults: resetShortcuts } = useShortcutStore()

  const handleResetAll = (): void => {
    resetToDefaults()
    resetShortcuts()
    setTheme(DEFAULT_THEME_ID)
    toast.success(tr('All settings reset to defaults', '已重置所有设置为默认值'))
  }

  const toggleProvider = (provider: UsageProvider): void => {
    const current = usageIndicatorProviders
    const updated = current.includes(provider)
      ? current.filter((p) => p !== provider)
      : [...current, provider]
    updateSetting('usageIndicatorProviders', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">{tr('General', '通用')}</h3>
        <p className="text-sm text-muted-foreground">
          {tr('Basic application settings', '基础应用设置')}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Language', '语言')}</label>
        <p className="text-xs text-muted-foreground">
          {tr('Choose the application display language.', '选择应用界面显示语言。')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateSetting('language', 'en')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              language === 'en'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="language-en"
          >
            English
          </button>
          <button
            onClick={() => updateSetting('language', 'zh-CN')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              language === 'zh-CN'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="language-zh-CN"
          >
            简体中文
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{tr('Auto-start session', '自动启动会话')}</label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Automatically create a session when selecting a worktree with none',
              '选中尚无会话的工作树时自动创建会话'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={autoStartSession}
          onClick={() => updateSetting('autoStartSession', !autoStartSession)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            autoStartSession ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="auto-start-session-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              autoStartSession ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">
            {tr('Auto-pull before worktree creation', '创建工作树前自动拉取')}
          </label>
          <p className="text-xs text-muted-foreground">
            {tr(
              "Automatically pull from origin before creating worktrees to ensure they're up-to-date",
              '在创建工作树前自动从 origin 拉取，确保分支保持最新'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={autoPullBeforeWorktree}
          onClick={() => updateSetting('autoPullBeforeWorktree', !autoPullBeforeWorktree)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            autoPullBeforeWorktree ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="auto-pull-before-worktree-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              autoPullBeforeWorktree ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Board Mode', '看板模式')}</label>
        <p className="text-xs text-muted-foreground">
          {tr('Choose how the Kanban board is accessed.', '选择访问 Kanban 看板的方式。')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateSetting('boardMode', 'toggle')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              boardMode === 'toggle'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="board-mode-toggle"
          >
            {tr('Toggle', '切换按钮')}
          </button>
          <button
            onClick={() => updateSetting('boardMode', 'sticky-tab')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              boardMode === 'sticky-tab'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="board-mode-sticky-tab"
          >
            {tr('Sticky Tab', '固定标签页')}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{tr('Vim mode', 'Vim 模式')}</label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Enable vim-style keyboard navigation with hints, hjkl scrolling, and mode switching',
              '启用 Vim 风格键盘导航，包括提示、hjkl 滚动和模式切换'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={vimModeEnabled}
          onClick={() => updateSetting('vimModeEnabled', !vimModeEnabled)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            vimModeEnabled ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="vim-mode-enabled-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              vimModeEnabled ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {tr('Merge conflict mode', '合并冲突处理模式')}
        </label>
        <p className="text-xs text-muted-foreground">
          {tr('Choose which mode to use when fixing merge conflicts with AI', '选择 AI 处理合并冲突时使用的模式')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateSetting('mergeConflictMode', 'build')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              mergeConflictMode === 'build'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="merge-conflict-mode-build"
          >
            {tr('Build', '构建')}
          </button>
          <button
            onClick={() => updateSetting('mergeConflictMode', 'plan')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              mergeConflictMode === 'plan'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="merge-conflict-mode-plan"
          >
            {tr('Plan', '规划')}
          </button>
          <button
            onClick={() => updateSetting('mergeConflictMode', 'always-ask')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              mergeConflictMode === 'always-ask'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="merge-conflict-mode-always-ask"
          >
            {tr('Always Ask', '始终询问')}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{tr('Show tips', '显示提示')}</label>
          <p className="text-xs text-muted-foreground">
            {tr('Show helpful tips when discovering new features', '在发现新功能时显示有帮助的提示')}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={tipsEnabled}
          onClick={() => updateSetting('tipsEnabled', !tipsEnabled)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            tipsEnabled ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="tips-enabled-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              tipsEnabled ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{tr('Model icons', '模型图标')}</label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Show the model icon (Claude, OpenAI) next to the worktree status',
              '在工作树状态旁显示模型图标（Claude、OpenAI）'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={showModelIcons}
          onClick={() => updateSetting('showModelIcons', !showModelIcons)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            showModelIcons ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="show-model-icons-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              showModelIcons ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">
            {tr('Show model provider', '显示模型提供方')}
          </label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Display the provider name (e.g. ANTHROPIC) next to the model in the selector pill',
              '在模型选择器中显示提供方名称（例如 ANTHROPIC）'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={showModelProvider}
          onClick={() => updateSetting('showModelProvider', !showModelProvider)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            showModelProvider ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="show-model-provider-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              showModelProvider ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Usage indicator', '用量指示器')}</label>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Choose how usage is displayed. Current agent auto-detects from the active session. Specific providers lets you pin which usage bars always show.',
            '选择用量显示方式。当前代理会根据活动会话自动识别；指定提供方则可固定显示特定用量条。'
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateSetting('usageIndicatorMode', 'current-agent')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              usageIndicatorMode === 'current-agent'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="usage-indicator-mode-current-agent"
          >
            {tr('Current agent', '当前代理')}
          </button>
          <button
            onClick={() => updateSetting('usageIndicatorMode', 'specific-providers')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              usageIndicatorMode === 'specific-providers'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="usage-indicator-mode-specific-providers"
          >
            {tr('Specific providers', '指定提供方')}
          </button>
        </div>
        {usageIndicatorMode === 'specific-providers' && (
          <div className="ml-2 mt-2 space-y-2">
            <button
              role="checkbox"
              aria-checked={usageIndicatorProviders.includes('anthropic')}
              onClick={() => toggleProvider('anthropic')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors w-full',
                usageIndicatorProviders.includes('anthropic')
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
              )}
              data-testid="usage-provider-anthropic"
            >
              <img src={claudeIcon} alt="Claude" className="h-3.5 w-3.5" />
              Claude
            </button>
            <button
              role="checkbox"
              aria-checked={usageIndicatorProviders.includes('openai')}
              onClick={() => toggleProvider('openai')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors w-full',
                usageIndicatorProviders.includes('openai')
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
              )}
              data-testid="usage-provider-openai"
            >
              <img src={openaiIcon} alt="OpenAI" className="h-3.5 w-3.5" />
              OpenAI
            </button>
            {usageIndicatorProviders.length === 0 && (
              <p className="text-xs text-muted-foreground/70 italic">
                {tr(
                  'Select at least one provider, or switch to Current agent mode.',
                  '请至少选择一个提供方，或切换为“当前代理”模式。'
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('AI Provider', 'AI 提供方')}</label>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Choose which AI coding agent to use for new sessions. Existing sessions keep their original provider.',
            '选择新会话默认使用的 AI 编码代理。已有会话会保留原始提供方。'
          )}
        </p>
        <div className="flex gap-2">
          <button onClick={() => updateSetting('defaultAgentSdk', 'opencode')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', defaultAgentSdk === 'opencode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="agent-sdk-opencode">OpenCode</button>
          <button onClick={() => updateSetting('defaultAgentSdk', 'claude-code')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', defaultAgentSdk === 'claude-code' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="agent-sdk-claude-code">Claude Code</button>
          <button onClick={() => updateSetting('defaultAgentSdk', 'codex')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', defaultAgentSdk === 'codex' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="agent-sdk-codex">Codex</button>
          <button onClick={() => updateSetting('defaultAgentSdk', 'terminal')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', defaultAgentSdk === 'terminal' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="agent-sdk-terminal">{tr('Terminal', '终端')}</button>
        </div>
        {defaultAgentSdk === 'terminal' && (
          <p className="text-xs text-muted-foreground/70 italic">
            {tr(
              'Opens a terminal window. Run any AI tool manually (claude, aider, cursor, etc.)',
              '打开终端窗口，你可以手动运行任意 AI 工具（claude、aider、cursor 等）。'
            )}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">
            {tr('Strip @ from file mentions', '移除文件引用中的 @')}
          </label>
          <p className="text-xs text-muted-foreground">
            {tr(
              'Remove the @ symbol from file references inserted via the file picker before sending',
              '在发送前，移除通过文件选择器插入的文件引用中的 @ 符号'
            )}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={stripAtMentions}
          onClick={() => updateSetting('stripAtMentions', !stripAtMentions)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
            stripAtMentions ? 'bg-primary' : 'bg-muted'
          )}
          data-testid="strip-at-mentions-toggle"
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              stripAtMentions ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Branch Naming', '分支命名')}</label>
        <p className="text-xs text-muted-foreground">
          {tr('Choose the naming theme for auto-generated worktree branches', '选择自动生成工作树分支的命名主题')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => updateSetting('breedType', 'dogs')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              breedType === 'dogs'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="breed-type-dogs"
          >
            {tr('Dogs', '狗狗')}
          </button>
          <button
            onClick={() => updateSetting('breedType', 'cats')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm border transition-colors',
              breedType === 'cats'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50'
            )}
            data-testid="breed-type-cats"
          >
            {tr('Cats', '猫猫')}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="text-destructive hover:text-destructive"
          data-testid="reset-all-settings"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          {tr('Reset All to Defaults', '全部恢复默认')}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          {tr(
            'This will reset all settings, theme, and keyboard shortcuts to their defaults.',
            '这将把所有设置、主题和键盘快捷键恢复为默认值。'
          )}
        </p>
      </div>
    </div>
  )
}
