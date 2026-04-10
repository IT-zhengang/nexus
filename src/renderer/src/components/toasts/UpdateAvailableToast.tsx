import { Download } from 'lucide-react'
import { useI18n } from '@/i18n'

interface UpdateAvailableToastProps {
  version: string
  onDownload: () => void
  onLater: () => void
  onSkip: () => void
}

export function UpdateAvailableToast({
  version,
  onDownload,
  onLater,
  onSkip
}: UpdateAvailableToastProps): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <div className="flex w-[360px] flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-xl">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">
          {tr(`Update v${version} available`, `发现可用更新 v${version}`)}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onLater}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {tr('Later', '稍后')}
        </button>
        <button
          onClick={onSkip}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {tr('Skip this version', '跳过此版本')}
        </button>
        <button
          onClick={onDownload}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {tr('Download', '下载')}
        </button>
      </div>
    </div>
  )
}
