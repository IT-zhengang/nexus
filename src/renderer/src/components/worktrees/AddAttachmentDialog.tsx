import { useState, useCallback } from 'react'
import { Figma, Ticket, AlertCircle, Plus, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseAttachmentUrl } from '@/lib/attachment-utils'
import type { AttachmentInfo } from '@/lib/attachment-utils'
import { toast } from '@/lib/toast'
import { useI18n } from '@/i18n'

interface AddAttachmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worktreeId: string
  onAttachmentAdded: () => void
}

export function AddAttachmentDialog({
  open,
  onOpenChange,
  worktreeId,
  onAttachmentAdded
}: AddAttachmentDialogProps): React.JSX.Element {
  const { tr } = useI18n()
  const [url, setUrl] = useState('')
  const [detected, setDetected] = useState<AttachmentInfo | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleUrlChange = useCallback((value: string): void => {
    setUrl(value)
    if (value.trim()) {
      setDetected(parseAttachmentUrl(value.trim()))
    } else {
      setDetected(null)
    }
  }, [])

  const handleAdd = useCallback(async (): Promise<void> => {
    if (!detected) return
    setIsAdding(true)
    try {
      const result = await window.db.worktree.addAttachment(worktreeId, {
        type: detected.type,
        url: url.trim(),
        label: detected.label
      })
      if (result.success) {
        toast.success(
          tr(
            `Attached ${detected.type === 'jira' ? 'Jira ticket' : 'Figma file'}: ${detected.label}`,
            `已附加${detected.type === 'jira' ? ' Jira 工单' : ' Figma 文件'}：${detected.label}`
          )
        )
        onAttachmentAdded()
        onOpenChange(false)
        setUrl('')
        setDetected(null)
      } else {
        toast.error(result.error || tr('Failed to add attachment', '添加附件失败'))
      }
    } finally {
      setIsAdding(false)
    }
  }, [detected, url, worktreeId, onAttachmentAdded, onOpenChange, tr])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter' && detected && !isAdding) {
        handleAdd()
      }
    },
    [detected, isAdding, handleAdd]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr('Add Attachment', '添加附件')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder={tr('Paste a Jira or Figma URL', '粘贴 Jira 或 Figma 链接')}
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {url.trim() && (
            <div className="flex items-center gap-2 text-sm">
              {detected ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  {detected.type === 'jira' ? (
                    <Ticket className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Figma className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-muted-foreground">
                    {detected.type === 'jira'
                      ? tr('Jira ticket', 'Jira 工单')
                      : tr('Figma file', 'Figma 文件')}
                    :{' '}
                    <span className="text-foreground font-medium">{detected.label}</span>
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">{tr('Unsupported URL', '不支持的链接')}</span>
                </>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" disabled={!detected || isAdding} onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              {tr('Add', '添加')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
