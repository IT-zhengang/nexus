import { Hammer, Map, Sparkles } from 'lucide-react'
import { useSessionStore, type SessionMode } from '@/stores/useSessionStore'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/useI18n'

interface ModeToggleProps {
  sessionId: string
}

const MODE_CONFIG: Record<
  SessionMode,
  { label: string; icon: typeof Hammer; description: string }
> = {
  build: {
    label: 'Build',
    icon: Hammer,
    description: 'Execute code changes and implementations'
  },
  plan: {
    label: 'Plan',
    icon: Map,
    description: 'Plan and design before implementing'
  },
  'super-plan': {
    label: 'Super Plan',
    icon: Sparkles,
    description: 'Deep-dive interview to refine the plan'
  }
}

export function ModeToggle({ sessionId }: ModeToggleProps): React.JSX.Element {
  const { tr } = useI18n()
  const rawMode = useSessionStore((state) => state.modeBySession.get(sessionId))
  const mode: SessionMode = rawMode === 'plan' ? 'plan' : rawMode === 'super-plan' ? 'super-plan' : 'build'
  const toggleSessionMode = useSessionStore((state) => state.toggleSessionMode)

  const config = MODE_CONFIG[mode === 'super-plan' ? 'plan' : mode] ?? MODE_CONFIG.build
  const Icon = config.icon
  const currentLabel =
    mode === 'build'
      ? tr('Build', '构建')
      : mode === 'plan'
        ? tr('Plan', '计划')
        : tr('Super Plan', '超级计划')
  const nextLabel = mode === 'build' ? tr('Plan', '计划') : tr('Build', '构建')
  const titleText =
    mode === 'build'
      ? tr('Execute code changes and implementations (Tab to toggle)', '执行代码修改与实现（按 Tab 切换）')
      : mode === 'plan'
        ? tr('Plan and design before implementing (Tab to toggle)', '先规划和设计再实施（按 Tab 切换）')
        : tr('Deep-dive interview to refine the plan (Tab to toggle)', '通过深度引导完善计划（按 Tab 切换）')

  return (
    <button
      onClick={() => toggleSessionMode(sessionId)}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors',
        'border select-none',
        mode === 'build'
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20'
          : 'bg-violet-500/10 border-violet-500/30 text-violet-500 hover:bg-violet-500/20'
      )}
      title={titleText}
      aria-label={tr(`Current mode: ${currentLabel}. Click to switch to ${nextLabel} mode`, `当前模式：${currentLabel}。点击切换到${nextLabel}模式`)}
      data-testid="mode-toggle"
      data-mode={mode}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{currentLabel}</span>
    </button>
  )
}
