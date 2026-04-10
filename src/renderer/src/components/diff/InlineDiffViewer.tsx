import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Columns2,
  AlignJustify,
  Copy,
  X,
  Loader2,
  ChevronsUpDown
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { DiffViewer, type DiffViewMode } from './DiffViewer'
import { cn } from '@/lib/utils'
import { getPrismLanguage } from '@/lib/language-map'
import { useI18n } from '@/i18n'

interface InlineDiffViewerProps {
  worktreePath: string
  filePath: string
  fileName: string
  staged: boolean
  isUntracked: boolean
  isNewFile?: boolean
  onClose: () => void
}

export function InlineDiffViewer({
  worktreePath,
  filePath,
  fileName,
  staged,
  isUntracked,
  isNewFile,
  onClose
}: InlineDiffViewerProps): React.JSX.Element {
  const { tr } = useI18n()
  const [diff, setDiff] = useState<string>('')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified')
  const [contextLines, setContextLines] = useState(3)
  const [currentHunkIndex, setCurrentHunkIndex] = useState(-1)
  const contentRef = useRef<HTMLDivElement>(null)

  // Fetch file content for new files
  const fetchFileContent = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.gitOps.getFileContent(worktreePath, filePath)
      if (result.success && result.content !== null) {
        setFileContent(result.content)
      } else {
        setError(result.error || tr('Failed to load file content', '加载文件内容失败'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Failed to load file content', '加载文件内容失败'))
    } finally {
      setIsLoading(false)
    }
  }, [worktreePath, filePath, tr])

  // Fetch diff
  const fetchDiff = useCallback(
    async (ctx: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await window.gitOps.getDiff(worktreePath, filePath, staged, isUntracked, ctx)
        if (result.success && result.diff) {
          setDiff(result.diff)
        } else {
          setError(result.error || tr('Failed to load diff', '加载 diff 失败'))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : tr('Failed to load diff', '加载 diff 失败'))
      } finally {
        setIsLoading(false)
      }
    },
    [worktreePath, filePath, staged, isUntracked, tr]
  )

  // Load on mount and when contextLines changes
  useEffect(() => {
    if (isNewFile) {
      fetchFileContent()
    } else {
      fetchDiff(contextLines)
    }
  }, [isNewFile, fetchFileContent, fetchDiff, contextLines])

  // Get hunk elements
  const getHunkElements = useCallback((): Element[] => {
    if (!contentRef.current) return []
    return Array.from(
      contentRef.current.querySelectorAll('.d2h-info, .d2h-code-linenumber.d2h-info')
    )
  }, [])

  // Navigate to next hunk
  const goToNextHunk = useCallback(() => {
    const hunks = getHunkElements()
    if (hunks.length === 0) return
    const nextIndex = currentHunkIndex + 1 < hunks.length ? currentHunkIndex + 1 : 0
    setCurrentHunkIndex(nextIndex)
    hunks[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [getHunkElements, currentHunkIndex])

  // Navigate to previous hunk
  const goToPrevHunk = useCallback(() => {
    const hunks = getHunkElements()
    if (hunks.length === 0) return
    const prevIndex = currentHunkIndex - 1 >= 0 ? currentHunkIndex - 1 : hunks.length - 1
    setCurrentHunkIndex(prevIndex)
    hunks[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [getHunkElements, currentHunkIndex])

  // Expand context
  const handleExpandContext = useCallback(() => {
    setContextLines((prev) => prev + 10)
  }, [])

  // Copy content to clipboard
  const handleCopyDiff = useCallback(async () => {
    const content = isNewFile ? fileContent : diff
    if (content) {
      await window.projectOps.copyToClipboard(content)
      toast.success(
        isNewFile
          ? tr('File content copied to clipboard', '文件内容已复制到剪贴板')
          : tr('Diff copied to clipboard', 'Diff 已复制到剪贴板')
      )
    }
  }, [diff, fileContent, isNewFile, tr])

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'unified' ? 'split' : 'unified'))
  }, [])

  // Keyboard shortcuts for hunk navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault()
        goToNextHunk()
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrevHunk()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextHunk, goToPrevHunk, onClose])

  const statusLabel = isNewFile
    ? tr('New file', '新文件')
    : staged
      ? tr('Staged', '已暂存')
      : isUntracked
        ? tr('New file', '新文件')
        : tr('Unstaged', '未暂存')

  return (
    <div className="flex-1 flex flex-col min-h-0" data-testid="inline-diff-viewer">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate" data-testid="inline-diff-filename">
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
            onClick={goToPrevHunk}
            title={tr('Previous hunk (Alt+Up)', '上一个区块（Alt+上）')}
            data-testid="diff-prev-hunk"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={goToNextHunk}
            title={tr('Next hunk (Alt+Down)', '下一个区块（Alt+下）')}
            data-testid="diff-next-hunk"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Context expansion */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleExpandContext}
            title={tr('Show more context', '显示更多上下文')}
            data-testid="diff-expand-context"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
            {tr('More context', '更多上下文')}
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* View mode toggle */}
          <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleViewMode}
          title={
            viewMode === 'unified'
              ? tr('Switch to split view', '切换为分栏视图')
              : tr('Switch to unified view', '切换为统一视图')
          }
          data-testid="diff-view-toggle"
        >
            {viewMode === 'unified' ? (
              <Columns2 className="h-3.5 w-3.5" />
            ) : (
              <AlignJustify className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Copy */}
          <Button
            variant="ghost"
            size="icon"
          className="h-6 w-6"
          onClick={handleCopyDiff}
          disabled={isNewFile ? !fileContent : !diff}
          title={tr('Copy diff to clipboard', '复制 diff 到剪贴板')}
          data-testid="diff-copy-button"
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
          data-testid="diff-close-button"
        >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Diff content */}
      <div ref={contentRef} className="flex-1 overflow-auto min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center h-full" data-testid="diff-loading">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div
            className="flex items-center justify-center h-full text-destructive"
            data-testid="diff-error"
          >
            {error}
          </div>
        )}

        {!isLoading && !error && isNewFile && fileContent !== null ? (
          <div className="overflow-auto flex-1" data-testid="plain-file-content">
            <SyntaxHighlighter
              language={getPrismLanguage(filePath)}
              style={oneDark}
              showLineNumbers
              wrapLines
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '12px',
                lineHeight: '20px',
                background: 'transparent',
                minHeight: '100%'
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-mono)'
                }
              }}
            >
              {fileContent}
            </SyntaxHighlighter>
          </div>
        ) : (
          !isLoading &&
          !error && (
            <DiffViewer
              diff={diff}
              viewMode={viewMode}
              className={cn(viewMode === 'split' && 'min-w-[800px]')}
            />
          )
        )}
      </div>
    </div>
  )
}
