import { useState, useMemo } from 'react'
import { Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useKanbanStore } from '@/stores/useKanbanStore'
import { toast } from 'sonner'
import { useI18n } from '@/i18n/useI18n'

interface ExportedTicket {
  id: string
  title: string
  description?: string | null
  attachments?: unknown[]
  column?: string
}

interface HiveImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  tickets: ExportedTicket[]
}

export function HiveImportModal({
  open,
  onOpenChange,
  projectId,
  tickets
}: HiveImportModalProps) {
  const { tr } = useI18n()
  const loadTickets = useKanbanStore((s) => s.loadTickets)
  const existingTickets = useKanbanStore((s) => s.tickets)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(tickets.map((t) => t.id))
  )
  const [importing, setImporting] = useState(false)

  // Determine which tickets are new vs updates by checking existing tickets in the store
  const ticketStatuses = useMemo(() => {
    const projectTickets = existingTickets.get(projectId) ?? []
    const existingIdSet = new Set(projectTickets.map((t) => t.id))
    return tickets.map((t) => ({
      ...t,
      isUpdate: existingIdSet.has(t.id)
    }))
  }, [tickets, existingTickets, projectId])

  const newCount = ticketStatuses.filter((t) => !t.isUpdate && selectedIds.has(t.id)).length
  const updateCount = ticketStatuses.filter((t) => t.isUpdate && selectedIds.has(t.id)).length

  const toggleTicket = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.id)))
    }
  }

  const handleImport = async () => {
    const selected = tickets.filter((t) => selectedIds.has(t.id))
    if (selected.length === 0) return

    setImporting(true)
    try {
      const result = await window.kanban.board.importTickets(projectId, selected)
      await loadTickets(projectId)

      const parts: string[] = []
      if (result.created > 0) parts.push(`${result.created} ${tr('created', '已创建')}`)
      if (result.updated > 0) parts.push(`${result.updated} ${tr('updated', '已更新')}`)
      toast.success(`${tr('Import complete', '导入完成')}: ${parts.join(', ')}`)

      onOpenChange(false)
    } catch {
      toast.error(tr('Failed to import tickets', '导入工单失败'))
    } finally {
      setImporting(false)
    }
  }

  const columnLabel = (col?: string) => {
    switch (col) {
      case 'todo':
        return tr('To Do', '待办')
      case 'in_progress':
        return tr('In Progress', '进行中')
      case 'review':
        return tr('Review', '评审中')
      case 'done':
        return tr('Done', '已完成')
      default:
        return tr('To Do', '待办')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {tr('Import from Hive JSON', '从 Hive JSON 导入')}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="text-sm text-muted-foreground px-1">
          {selectedIds.size} / {tickets.length} {tr('tickets selected', '个工单已选择')}
          {(newCount > 0 || updateCount > 0) && (
            <span className="ml-1">
              ({newCount > 0 && <span className="text-green-500">{newCount} {tr('new', '新增')}</span>}
              {newCount > 0 && updateCount > 0 && ', '}
              {updateCount > 0 && (
                <span className="text-yellow-500">
                  {updateCount} {tr(updateCount !== 1 ? 'updates' : 'update', '更新')}
                </span>
              )})
            </span>
          )}
        </div>

        {/* Select all */}
        <div className="flex items-center gap-2 px-1 py-1 border-b">
          <Checkbox
            checked={selectedIds.size === tickets.length}
            onCheckedChange={toggleAll}
          />
          <span className="text-xs text-muted-foreground font-medium">{tr('Select all', '全选')}</span>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {ticketStatuses.map((ticket) => (
            <label
              key={ticket.id}
              className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedIds.has(ticket.id)}
                onCheckedChange={() => toggleTicket(ticket.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{ticket.title}</span>
                  {ticket.isUpdate ? (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-500">
                      {tr('Update', '更新')}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/15 text-green-500">
                      {tr('New', '新增')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {columnLabel(ticket.column)}
                  </span>
                  {ticket.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      — {ticket.description.slice(0, 80)}
                      {ticket.description.length > 80 ? '…' : ''}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            {tr('Cancel', '取消')}
          </Button>
          <Button onClick={handleImport} disabled={importing || selectedIds.size === 0}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {tr('Importing…', '导入中…')}
              </>
            ) : (
              tr(
                `Import ${selectedIds.size} ${selectedIds.size !== 1 ? 'tickets' : 'ticket'}`,
                `导入 ${selectedIds.size} 个工单`
              )
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
