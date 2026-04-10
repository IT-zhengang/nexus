import { AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useI18n } from '@/i18n'

export function AgentNotFoundDialog(): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-destructive" />
            {tr('No AI Agent Found', '未找到 AI Agent')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tr(
              'Hive requires OpenCode, Claude Code, or Codex to be installed on your system. Please install one of them and restart Hive.',
              'Hive 需要你的系统中安装 OpenCode、Claude Code 或 Codex。请安装其中之一后重新启动 Hive。'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction variant="destructive" onClick={() => window.systemOps.quitApp()}>
            {tr('Close', '关闭')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
