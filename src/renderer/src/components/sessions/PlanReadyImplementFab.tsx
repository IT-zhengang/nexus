import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useI18n } from '@/i18n/useI18n'

function MnemonicLabel({ letter, label }: { letter: string; label: string }): React.JSX.Element {
  const index = label.toLowerCase().indexOf(letter.toLowerCase())
  if (index === -1) return <span>{label}</span>
  return (
    <span>
      {label.slice(0, index)}
      <span className="font-semibold underline underline-offset-2 decoration-2">
        {label[index]}
      </span>
      {label.slice(index + 1)}
    </span>
  )
}

interface PlanReadyImplementFabProps {
  onImplement: () => void
  onHandoff: () => void
  visible: boolean
  onSuperpowers?: () => void
  onSuperpowersLocal?: () => void
  superpowersAvailable?: boolean
  isConnectionSession?: boolean
  onSaveAsTicket?: () => void
}

export function PlanReadyImplementFab({
  onImplement,
  onHandoff,
  visible,
  onSuperpowers,
  onSuperpowersLocal,
  superpowersAvailable,
  isConnectionSession,
  onSaveAsTicket
}: PlanReadyImplementFabProps): React.JSX.Element {
  const { tr } = useI18n()
  const vimModeEnabled = useSettingsStore((s) => s.vimModeEnabled)

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 z-10',
        'flex items-center gap-2',
        'transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
    >
      {onSaveAsTicket && (
        <button
          onClick={onSaveAsTicket}
          className={cn(
            'h-8 rounded-full px-3',
            'text-xs font-medium',
            'bg-muted/80 text-foreground border border-border',
            'shadow-md hover:bg-muted transition-colors duration-200',
            'cursor-pointer',
            visible ? 'opacity-100' : 'opacity-0'
          )}
          aria-label={tr('Save plan as ticket', '将计划保存为工单')}
          data-testid="plan-ready-save-ticket-fab"
        >
          {vimModeEnabled ? (
            <MnemonicLabel letter="s" label={tr('Save as ticket', '保存为工单')} />
          ) : (
            tr('Save as ticket', '保存为工单')
          )}
        </button>
      )}
      <button
        onClick={onHandoff}
        className={cn(
          'h-8 rounded-full px-3',
          'text-xs font-medium',
          'bg-muted/80 text-foreground border border-border',
          'shadow-md hover:bg-muted transition-colors duration-200',
          'cursor-pointer',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        aria-label={tr('Handoff plan', '交接计划')}
        data-testid="plan-ready-handoff-fab"
      >
        {vimModeEnabled ? (
          <MnemonicLabel letter="a" label={tr('Handoff', '交接')} />
        ) : (
          tr('Handoff', '交接')
        )}
      </button>
      {superpowersAvailable && !isConnectionSession && onSuperpowersLocal && (
        <button
          onClick={onSuperpowersLocal}
          className={cn(
            'h-8 rounded-full px-3',
            'text-xs font-medium',
            'border border-violet-600 text-violet-600 bg-background hover:bg-violet-100 dark:hover:bg-violet-950',
            'shadow-md transition-colors duration-200',
            'cursor-pointer',
            visible ? 'opacity-100' : 'opacity-0'
          )}
          aria-label={tr('Supercharge plan locally', '在本地增强执行计划')}
          data-testid="plan-ready-supercharge-local-fab"
        >
          {vimModeEnabled ? (
            <MnemonicLabel letter="o" label={tr('Supercharge locally', '本地增强执行')} />
          ) : (
            tr('Supercharge locally', '本地增强执行')
          )}
        </button>
      )}
      {superpowersAvailable && onSuperpowers && (
        <button
          onClick={onSuperpowers}
          className={cn(
            'h-8 rounded-full px-3',
            'text-xs font-medium',
            'bg-violet-600 text-white',
            'shadow-md hover:bg-violet-700 transition-colors duration-200',
            'cursor-pointer',
            visible ? 'opacity-100' : 'opacity-0'
          )}
          aria-label={tr('Supercharge plan', '增强执行计划')}
          data-testid="plan-ready-supercharge-fab"
        >
          {vimModeEnabled ? (
            <MnemonicLabel letter="u" label={tr('Supercharge', '增强执行')} />
          ) : (
            tr('Supercharge', '增强执行')
          )}
        </button>
      )}
      <button
        onClick={onImplement}
        className={cn(
          'h-8 rounded-full px-3',
          'text-xs font-medium',
          'bg-primary text-primary-foreground',
          'shadow-md hover:bg-primary/90 transition-colors duration-200',
          'cursor-pointer',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-label={tr('Implement plan', '执行计划')}
        data-testid="plan-ready-implement-fab"
      >
        {vimModeEnabled ? (
          <MnemonicLabel letter="m" label={tr('Implement', '执行')} />
        ) : (
          tr('Implement', '执行')
        )}
      </button>
    </div>
  )
}
