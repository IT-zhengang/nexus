import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/i18n'

interface AgentPickerDialogProps {
  onSelect: (sdk: 'opencode' | 'claude-code' | 'codex') => void
  availableSdks: { opencode: boolean; claude: boolean; codex: boolean }
}

export function AgentPickerDialog({
  onSelect,
  availableSdks
}: AgentPickerDialogProps): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bot className="size-5" />
            {tr('Choose Your AI Agent', '选择你的 AI Agent')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tr(
              'Multiple AI agents are installed. Choose which one to use as the default for new sessions. You can change this later in Settings.',
              '已检测到多个 AI Agent。请选择一个作为新会话的默认 Agent。你也可以稍后在设置中修改。'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 pt-2">
          {availableSdks.opencode && (
            <button
              onClick={() => onSelect('opencode')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border-2 border-border',
                'hover:border-primary hover:bg-accent/50 transition-colors',
                'text-center cursor-pointer'
              )}
            >
              <div className="text-sm font-medium">OpenCode</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tr('Open-source AI coding agent', '开源 AI 编码代理')}
              </div>
            </button>
          )}
          {availableSdks.claude && (
            <button
              onClick={() => onSelect('claude-code')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border-2 border-border',
                'hover:border-primary hover:bg-accent/50 transition-colors',
                'text-center cursor-pointer'
              )}
            >
              <div className="text-sm font-medium">Claude Code</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tr("Anthropic's coding assistant", 'Anthropic 的编码助手')}
              </div>
            </button>
          )}
          {availableSdks.codex && (
            <button
              onClick={() => onSelect('codex')}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border-2 border-border',
                'hover:border-primary hover:bg-accent/50 transition-colors',
                'text-center cursor-pointer'
              )}
            >
              <div className="text-sm font-medium">Codex</div>
              <div className="text-xs text-muted-foreground mt-1">
                {tr("OpenAI's coding agent", 'OpenAI 的编码代理')}
              </div>
            </button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
