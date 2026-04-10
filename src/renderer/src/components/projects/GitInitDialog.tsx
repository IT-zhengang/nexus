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
import { useI18n } from '@/i18n'

interface GitInitDialogProps {
  open: boolean
  path: string
  onCancel: () => void
  onConfirm: () => void
}

export function GitInitDialog({ open, path, onCancel, onConfirm }: GitInitDialogProps) {
  const { tr } = useI18n()

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr('Not a Git Repository', '不是 Git 仓库')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>{tr('The selected folder is not a Git repository:', '所选文件夹不是 Git 仓库：')}</p>
              <p className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">{path}</p>
              <p>{tr('Would you like to initialize a new Git repository?', '是否要初始化一个新的 Git 仓库？')}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{tr('Cancel', '取消')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {tr('Initialize Repository', '初始化仓库')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
