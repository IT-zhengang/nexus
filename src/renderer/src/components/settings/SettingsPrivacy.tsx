import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export function SettingsPrivacy(): React.JSX.Element {
  const { tr } = useI18n()
  const updateSetting = useSettingsStore((s) => s.updateSetting)
  const [enabled, setEnabled] = useState(true)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.analyticsOps
      .isEnabled()
      .then((val) => {
        setEnabled(val)
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true)
      })
  }, [])

  const handleToggle = () => {
    const newValue = !enabled
    setEnabled(newValue)
    updateSetting('telemetryEnabled', newValue)
    window.analyticsOps.setEnabled(newValue)
  }

  if (!loaded) return <div />

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">{tr('Privacy', '隐私')}</h3>
        <p className="text-sm text-muted-foreground">
          {tr('Control how Hive collects anonymous usage data', '控制 Hive 如何收集匿名使用数据')}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{tr('Send anonymous usage analytics', '发送匿名使用分析')}</label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tr('Help improve Hive by sharing anonymous feature usage data', '通过分享匿名功能使用数据帮助改进 Hive')}
          </p>
        </div>
        <button role="switch" aria-checked={enabled} onClick={handleToggle} className={cn('relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors', enabled ? 'bg-primary' : 'bg-muted')}>
          <span className={cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform', enabled ? 'translate-x-4' : 'translate-x-0')} />
        </button>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{tr('What we collect:', '我们收集的内容：')}</span>{' '}
          {tr('Feature usage counts, app version, platform (macOS/Windows/Linux).', '功能使用次数、应用版本、平台信息（macOS/Windows/Linux）。')}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="font-medium text-foreground">{tr('What we never collect:', '我们绝不会收集：')}</span>{' '}
          {tr('Project names, file contents, prompts, AI responses, git data, or any personal information.', '项目名称、文件内容、提示词、AI 回复、Git 数据或任何个人信息。')}
        </p>
      </div>
    </div>
  )
}
