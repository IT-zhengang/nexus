import { useState, useEffect } from 'react'
import { useIsWebMode } from '@/hooks/useIsWebMode'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { useI18n } from '@/i18n'

export function SettingsUpdates(): React.JSX.Element {
  const { tr } = useI18n()
  const isWebMode = useIsWebMode()
  const { updateChannel, updateSetting } = useSettingsStore()
  const [version, setVersion] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    window.updaterOps?.getVersion().then(setVersion).catch(() => {})
  }, [])

  const handleCheckForUpdates = async (): Promise<void> => {
    setChecking(true)
    try {
      await window.updaterOps?.checkForUpdate({ manual: true })
    } catch {
      // ignore
    }
    setTimeout(() => setChecking(false), 2000)
  }

  if (isWebMode) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-medium mb-1">{tr('Updates', '更新')}</h3>
          <p className="text-sm text-muted-foreground">{tr('Updates are managed by your server administrator', '更新由你的服务器管理员统一管理')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium mb-1">{tr('Updates', '更新')}</h3>
        <p className="text-sm text-muted-foreground">{tr('Manage how Hive updates itself', '管理 Hive 的更新方式')}</p>
      </div>

      {version && (
        <div className="text-sm text-muted-foreground">
          {tr('Current version:', '当前版本：')} <span className="font-mono text-foreground">{version}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">{tr('Update Channel', '更新通道')}</label>
        <p className="text-xs text-muted-foreground">{tr('Choose which release channel to receive updates from', '选择接收更新的发布通道')}</p>
        <div className="flex gap-2">
          <button onClick={() => updateSetting('updateChannel', 'stable')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', updateChannel === 'stable' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="update-channel-stable">{tr('Stable', '稳定版')}</button>
          <button onClick={() => updateSetting('updateChannel', 'canary')} className={cn('px-3 py-1.5 rounded-md text-sm border transition-colors', updateChannel === 'canary' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent/50')} data-testid="update-channel-canary">Canary</button>
        </div>
        <p className="text-xs text-muted-foreground">
          {updateChannel === 'canary'
            ? tr('You will receive early builds with the latest features. These may contain bugs.', '你将收到包含最新功能的抢先版本，这些版本可能存在缺陷。')
            : tr('You will receive stable, tested releases.', '你将收到稳定且经过测试的正式版本。')}
        </p>
      </div>

      <div className="pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleCheckForUpdates} disabled={checking} data-testid="check-for-updates">
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', checking && 'animate-spin')} />
          {checking ? tr('Checking...', '检查中...') : tr('Check for Updates', '检查更新')}
        </Button>
      </div>
    </div>
  )
}
