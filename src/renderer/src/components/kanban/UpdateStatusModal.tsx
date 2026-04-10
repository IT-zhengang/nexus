import { useCallback, useState, useEffect } from 'react'
import { getProviderSettings } from '@/lib/provider-settings'
import { Loader2, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useI18n } from '@/i18n/useI18n'

interface UpdateStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  externalProvider: string
  externalId: string
  externalUrl: string
  ticketTitle: string
}

export function UpdateStatusModal({
  open,
  onOpenChange,
  externalProvider,
  externalId,
  externalUrl,
  ticketTitle
}: UpdateStatusModalProps) {
  const { tr } = useI18n()
  const [statuses, setStatuses] = useState<Array<{ id: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const getRepoFromUrl = useCallback((): string | null => {
    const match = externalUrl.match(/github\.com\/([^/]+\/[^/]+)/)
    return match ? match[1] : null
  }, [externalUrl])

  useEffect(() => {
    if (!open) return
    const repo = getRepoFromUrl()
    if (!repo) return

    setLoading(true)
    window.ticketImport
      .getAvailableStatuses(externalProvider, repo, externalId, getProviderSettings())
      .then(setStatuses)
      .catch((err) => {
        toast.error(
          `${tr('Failed to fetch statuses', '获取状态失败')}: ${err instanceof Error ? err.message : String(err)}`
        )
        setStatuses([])
      })
      .finally(() => setLoading(false))
  }, [open, externalProvider, externalId, externalUrl, getRepoFromUrl, tr])

  const handleUpdate = async (statusId: string) => {
    const repo = getRepoFromUrl()
    if (!repo) return

    setUpdating(true)
    try {
      const result = await window.ticketImport.updateRemoteStatus(
        externalProvider,
        repo,
        externalId,
        statusId,
        getProviderSettings()
      )
      if (result.success) {
        toast.success(
          `${tr('Updated', '已更新')} #${externalId} ${tr('to', '为')} "${statuses.find((s) => s.id === statusId)?.label}"`
        )
        onOpenChange(false)
      } else {
        toast.error(result.error ?? tr('Failed to update status', '更新状态失败'))
      }
    } catch (err) {
      toast.error(`${tr('Failed', '失败')}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            {tr('Update status on GitHub', '更新 GitHub 状态')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate mt-1">
            #{externalId} — {ticketTitle}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {tr('Loading statuses...', '正在加载状态...')}
            </div>
          ) : (
            statuses.map((status) => (
              <Button
                key={status.id}
                variant="outline"
                size="sm"
                disabled={updating}
                onClick={() => handleUpdate(status.id)}
                className="justify-start"
              >
                {status.label}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
