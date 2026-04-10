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

interface UnsavedChangesDialogProps {
  open: boolean
  fileName: string
  onSave: () => void
  onDontSave: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  open,
  fileName,
  onSave,
  onDontSave,
  onCancel
}: UnsavedChangesDialogProps): React.JSX.Element {
  const { tr } = useI18n()
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tr('Unsaved Changes', '未保存的更改')}</AlertDialogTitle>
          <AlertDialogDescription>
            {tr('Do you want to save changes to', '是否要保存对以下文件的更改：')} {fileName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction variant="destructive" onClick={onDontSave}>
            {tr("Don't Save", '不保存')}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onCancel}>{tr('Cancel', '取消')}</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>{tr('Save', '保存')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
