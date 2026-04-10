import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/i18n/useI18n'

interface CodexFastToggleProps {
  enabled: boolean
  accepted: boolean
  onToggle: () => void
  onAccept: () => void
}

export function CodexFastToggle({
  enabled,
  accepted,
  onToggle,
  onAccept
}: CodexFastToggleProps): React.JSX.Element {
  const { tr } = useI18n()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClick = (): void => {
    if (enabled || accepted) {
      onToggle()
    } else {
      setShowConfirm(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={enabled}
        aria-label={`Fast mode ${enabled ? 'enabled' : 'disabled'}`}
        data-testid="codex-fast-toggle"
        className={cn(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
          'border select-none',
          enabled
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {tr('Fast', '极速')}
      </button>

      <AlertDialog open={showConfirm} onOpenChange={(open) => !open && setShowConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Fast Mode', '极速模式')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr('Fast mode consumes 2X the usage from your plan.', '极速模式会消耗你套餐 2 倍的用量。')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>{tr('Cancel', '取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAccept()
                onToggle()
                setShowConfirm(false)
              }}
            >
              {tr('Accept', '接受')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
