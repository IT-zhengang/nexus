import { useSettingsStore, resolveModelForSdk } from '@/stores/useSettingsStore'
import { ModelSelector } from '@/components/sessions/ModelSelector'
import { Info } from 'lucide-react'
import { useI18n } from '@/i18n'

export function SettingsModels(): React.JSX.Element {
  const { tr } = useI18n()
  const defaultAgentSdk = useSettingsStore((s) => s.defaultAgentSdk) ?? 'opencode'
  const supportsModes = defaultAgentSdk === 'claude-code' || defaultAgentSdk === 'codex'
  // Show the effective model for the current SDK (what new sessions will actually use)
  const effectiveModel = useSettingsStore((s) =>
    resolveModelForSdk(defaultAgentSdk === 'terminal' ? 'opencode' : defaultAgentSdk, s)
  )
  const defaultModels = useSettingsStore((state) => state.defaultModels)
  const setSelectedModel = useSettingsStore((state) => state.setSelectedModel)
  const setSelectedModelForSdk = useSettingsStore((state) => state.setSelectedModelForSdk)
  const setModeDefaultModel = useSettingsStore((state) => state.setModeDefaultModel)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">{tr('Default Models', '默认模型')}</h3>
        <p className="text-sm text-muted-foreground">
          {tr('Configure which AI models to use for different modes and commands', '配置不同模式和命令使用的 AI 模型')}
        </p>
      </div>

      {/* Info box explaining priority */}
      <div className="flex gap-2 p-3 rounded-md bg-muted/30 border border-border">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>{tr('Model selection priority:', '模型选择优先级：')}</strong>
          </p>
          <ol className="list-decimal list-inside space-y-0.5 ml-2">
            <li>{tr("Worktree's last-used model (if any)", '工作树最近使用的模型（如果有）')}</li>
            {supportsModes && <li>{tr('Mode-specific default (configured below)', '模式专用默认值（在下方配置）')}</li>}
            <li>{tr('Global default model', '全局默认模型')}</li>
            <li>{tr('System fallback (Claude Opus 4.5)', '系统回退模型（Claude Opus 4.5）')}</li>
          </ol>
        </div>
      </div>

      {/* Global default */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Global Default Model', '全局默认模型')}</label>
        <p className="text-xs text-muted-foreground">
          {supportsModes
            ? tr('Fallback model used when no mode-specific default is configured', '未配置模式专用默认值时使用的回退模型')
            : tr('Model used for all new sessions', '所有新会话使用的模型')}
        </p>
        <div className="flex items-center gap-2">
          <ModelSelector
            value={effectiveModel}
            onChange={(model) => {
              // Update both legacy selectedModel and per-SDK entry so
              // resolveModelForSdk returns the new model for new sessions
              const sdk = defaultAgentSdk === 'terminal' ? 'opencode' : defaultAgentSdk
              setSelectedModel(model)
              setSelectedModelForSdk(sdk, model)
            }}
          />
          {effectiveModel && (
            <button
              onClick={() => {
                const sdk = defaultAgentSdk === 'terminal' ? 'opencode' : defaultAgentSdk
                setSelectedModel(null)
                setSelectedModelForSdk(sdk, null)
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {tr('Clear', '清除')}
            </button>
          )}
        </div>
      </div>

      {supportsModes && (
        <>
          <div className="border-t pt-4" />

          {/* Build mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{tr('Build Mode Default', 'Build 模式默认值')}</label>
            <p className="text-xs text-muted-foreground">
              {tr('Model used for new build mode sessions (normal coding)', '新建 Build 模式会话（常规编码）时使用的模型')}
            </p>
            <div className="flex items-center gap-2">
              <ModelSelector
                value={defaultModels?.build || null}
                onChange={(model) => setModeDefaultModel('build', model)}
              />
              {defaultModels?.build && (
                <button
                  onClick={() => setModeDefaultModel('build', null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr('Use global', '使用全局值')}
                </button>
              )}
            </div>
          </div>

          {/* Plan mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{tr('Plan Mode Default', 'Plan 模式默认值')}</label>
            <p className="text-xs text-muted-foreground">
              {tr('Model used for new plan mode sessions (design and planning)', '新建 Plan 模式会话（设计与规划）时使用的模型')}
            </p>
            <div className="flex items-center gap-2">
              <ModelSelector
                value={defaultModels?.plan || null}
                onChange={(model) => setModeDefaultModel('plan', model)}
              />
              {defaultModels?.plan && (
                <button
                  onClick={() => setModeDefaultModel('plan', null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr('Use global', '使用全局值')}
                </button>
              )}
            </div>
          </div>

          {/* Ask command */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{tr('/ask Command Default', '/ask 命令默认值')}</label>
            <p className="text-xs text-muted-foreground">
              {tr('Model used when you run the /ask command for quick questions', '运行 /ask 命令进行快速提问时使用的模型')}
            </p>
            <div className="flex items-center gap-2">
              <ModelSelector
                value={defaultModels?.ask || null}
                onChange={(model) => setModeDefaultModel('ask', model)}
              />
              {defaultModels?.ask && (
                <button
                  onClick={() => setModeDefaultModel('ask', null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {tr('Use global', '使用全局值')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
