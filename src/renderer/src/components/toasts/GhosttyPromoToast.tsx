import ghosttyIcon from '@/assets/ghostty-icon.png'
import { useI18n } from '@/i18n'

interface GhosttyPromoToastProps {
  onActivate: () => void
  onDismiss: () => void
}

export function GhosttyPromoToast({
  onActivate,
  onDismiss
}: GhosttyPromoToastProps): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <div className="flex w-[360px] flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <img src={ghosttyIcon} alt="Ghostty" className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {tr('Ghostty native terminal available', 'Ghostty 原生终端现已可用')}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {tr(
              'Metal-accelerated rendering with your Ghostty config',
              '使用你的 Ghostty 配置进行 Metal 加速渲染'
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onDismiss}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {tr("Don't show again", '不再显示')}
        </button>
        <button
          onClick={onActivate}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {tr('Activate', '启用')}
        </button>
      </div>
    </div>
  )
}
