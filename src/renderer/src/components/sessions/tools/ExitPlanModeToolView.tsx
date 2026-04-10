import type { ToolViewProps } from './types'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { useI18n } from '@/i18n/useI18n'

export function ExitPlanModeToolView({ input }: ToolViewProps) {
  const { tr } = useI18n()
  const plan = (input.plan || '') as string

  if (!plan) {
    return (
      <div data-testid="exit-plan-mode-tool-view">
        <p className="text-xs text-muted-foreground italic">
          {tr('No plan content available.', '没有可用的计划内容。')}
        </p>
      </div>
    )
  }

  return (
    <div data-testid="exit-plan-mode-tool-view">
      <div className="text-sm text-foreground leading-relaxed">
        <MarkdownRenderer content={plan} />
      </div>
    </div>
  )
}
