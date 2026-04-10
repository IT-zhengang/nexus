import { useCallback } from 'react'
import { ChevronUp, ChevronDown, Columns2, AlignJustify, Copy, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

interface MonacoDiffToolbarProps {
  fileName: string
  staged: boolean
  isUntracked: boolean
  compareBranch?: string
  sideBySide: boolean
  onToggleSideBySide: () => void
  onPrevHunk: () => void
  onNextHunk: () => void
  onCopy: () => void
  onClose: () => void
}

export function MonacoDiffToolbar({
  fileName,
  staged,
  isUntracked,
  compareBranch,
  sideBySide,
  onToggleSideBySide,
  onPrevHunk,
  onNextHunk,
  onCopy,
  onClose
}: MonacoDiffToolbarProps): React.JSX.Element {
  const { tr } = useI18n()
  const statusLabel = compareBranch
    ? tr(`vs ${compareBranch}`, `对比 ${compareBranch}`)
    : staged
      ? tr('Staged', '已暂存')
      : isUntracked
        ? tr('New file', '新文件')
        : tr('Unstaged', '未暂存')

  const handleCopy = useCallback(async () => {
    onCopy()
    toast.success(tr('Diff content copied to clipboard', 'Diff 内容已复制到剪贴板'))
  }, [onCopy, tr])

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate" data-testid="monaco-diff-filename">
          {fileName}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{statusLabel}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* Hunk navigation */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onPrevHunk}
          title={tr('Previous change (Alt+Up)', '上一个变更（Alt+上）')}
          data-testid="monaco-diff-prev-hunk"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNextHunk}
          title={tr('Next change (Alt+Down)', '下一个变更（Alt+下）')}
          data-testid="monaco-diff-next-hunk"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* View mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggleSideBySide}
          title={
            sideBySide
              ? tr('Switch to inline view', '切换为内联视图')
              : tr('Switch to side-by-side view', '切换为并排视图')
          }
          data-testid="monaco-diff-view-toggle"
        >
          {sideBySide ? (
            <AlignJustify className="h-3.5 w-3.5" />
          ) : (
            <Columns2 className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Copy */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title={tr('Copy diff to clipboard', '复制 diff 到剪贴板')}
          data-testid="monaco-diff-copy-button"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
          title={tr('Close diff (Esc)', '关闭 diff（Esc）')}
          data-testid="monaco-diff-close-button"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
