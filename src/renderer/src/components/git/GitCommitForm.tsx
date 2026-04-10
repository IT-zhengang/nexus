import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useGitStore } from '@/stores/useGitStore'
import { useWorktreeStore } from '@/stores/useWorktreeStore'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface GitCommitFormProps {
  worktreePath: string | null
  hasConflicts?: boolean
  className?: string
}

const SUMMARY_WARN_LENGTH = 50
const SUMMARY_ERROR_LENGTH = 72

export function GitCommitForm({
  worktreePath,
  hasConflicts,
  className
}: GitCommitFormProps): React.JSX.Element | null {
  const { tr } = useI18n()
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const summaryInputRef = useRef<HTMLInputElement>(null)

  const { commit, isCommitting } = useGitStore()

  // Look up worktree to get session_titles for pre-populating commit message
  const worktreesByProject = useWorktreeStore((state) => state.worktreesByProject)
  const sessionTitles: string[] = useMemo(() => {
    if (!worktreePath) return []
    for (const worktrees of worktreesByProject.values()) {
      const wt = worktrees.find((w) => w.path === worktreePath)
      if (wt?.session_titles) {
        try {
          return JSON.parse(wt.session_titles)
        } catch {
          return []
        }
      }
    }
    return []
  }, [worktreePath, worktreesByProject])

  // Get worktree name as fallback for empty commit messages
  const worktreeName: string = useMemo(() => {
    if (!worktreePath) return ''
    for (const worktrees of worktreesByProject.values()) {
      const wt = worktrees.find((w) => w.path === worktreePath)
      if (wt) return wt.name
    }
    return ''
  }, [worktreePath, worktreesByProject])

  // Pre-populate summary and description from session titles on mount,
  // falling back to worktree name when no session titles exist
  const hasPrePopulated = useRef(false)
  useEffect(() => {
    if (hasPrePopulated.current) return
    if (sessionTitles.length > 0 && !summary) {
      hasPrePopulated.current = true
      setSummary(sessionTitles[0])
      if (sessionTitles.length > 1) {
        setDescription(sessionTitles.map((t) => `- ${t}`).join('\n'))
      }
    } else if (worktreeName && !summary) {
      hasPrePopulated.current = true
      setSummary(worktreeName)
    }
  }, [sessionTitles, worktreeName, summary])

  // Subscribe to store state for staged files count
  const fileStatusesByWorktree = useGitStore((state) => state.fileStatusesByWorktree)

  // Calculate staged files count
  const stagedFilesCount = useMemo(() => {
    if (!worktreePath) return 0
    const files = fileStatusesByWorktree.get(worktreePath) || []
    return files.filter((f) => f.staged).length
  }, [worktreePath, fileStatusesByWorktree])

  const hasStaged = stagedFilesCount > 0
  const hasSummary = summary.trim().length > 0
  const canCommit = hasStaged && hasSummary && !isCommitting && !hasConflicts

  // Character count status for summary
  const summaryLength = summary.length
  const summaryStatus = useMemo(() => {
    if (summaryLength > SUMMARY_ERROR_LENGTH) return 'error'
    if (summaryLength > SUMMARY_WARN_LENGTH) return 'warn'
    return 'ok'
  }, [summaryLength])

  const handleCommit = useCallback(async () => {
    if (!worktreePath || !canCommit) return

    // Build commit message
    const message = description.trim()
      ? `${summary.trim()}\n\n${description.trim()}`
      : summary.trim()

    const result = await commit(worktreePath, message)

    if (result.success) {
      toast.success(tr('Changes committed successfully', '更改提交成功'), {
        description: result.commitHash
          ? tr(`Commit: ${result.commitHash.slice(0, 7)}`, `提交：${result.commitHash.slice(0, 7)}`)
          : undefined
      })
      // Clear form
      setSummary('')
      setDescription('')
    } else {
      toast.error(tr('Failed to commit', '提交失败'), {
        description: result.error
      })
    }
  }, [worktreePath, canCommit, summary, description, commit, tr])

  // Keyboard shortcut: Cmd/Ctrl+Enter to commit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        // Only trigger if form is focused
        if (
          document.activeElement === summaryInputRef.current ||
          document.activeElement?.closest('[data-commit-form]')
        ) {
          e.preventDefault()
          if (canCommit) {
            handleCommit()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canCommit, handleCommit])

  if (!worktreePath) {
    return null
  }

  return (
    <div
      className={cn('flex flex-col gap-2 px-2 py-2', className)}
      data-testid="git-commit-form"
      data-commit-form
    >
      {/* Summary input */}
      <div className="relative">
        <Input
          ref={summaryInputRef}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={tr('Commit summary', '提交摘要')}
          className={cn(
            'text-xs h-7 pr-12',
            summaryStatus === 'error' && 'border-red-500 focus-visible:ring-red-500',
            summaryStatus === 'warn' && 'border-yellow-500 focus-visible:ring-yellow-500'
          )}
          disabled={isCommitting}
          data-testid="commit-summary-input"
        />
        <span
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono',
            summaryStatus === 'error' && 'text-red-500',
            summaryStatus === 'warn' && 'text-yellow-500',
            summaryStatus === 'ok' && 'text-muted-foreground'
          )}
          data-testid="commit-char-count"
        >
          {summaryLength}/{SUMMARY_ERROR_LENGTH}
        </span>
      </div>

      {/* Description textarea (collapsible) */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={tr('Extended description (optional)', '扩展描述（可选）')}
        className="text-xs min-h-[40px] resize-none"
        rows={2}
        disabled={isCommitting}
        data-testid="commit-description-input"
      />

      {/* Commit button */}
      <Button
        onClick={handleCommit}
        disabled={!canCommit}
        size="sm"
        className="w-full h-7 text-xs"
        data-testid="commit-button"
      >
        {isCommitting ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {tr('Committing...', '正在提交...')}
          </>
        ) : (
          <>
            {tr('Commit', '提交')}
            {hasStaged && (
              <span className="ml-1 text-[10px] opacity-75">
                {tr(
                  `(${stagedFilesCount} file${stagedFilesCount !== 1 ? 's' : ''})`,
                  `（${stagedFilesCount} 个文件）`
                )}
              </span>
            )}
          </>
        )}
      </Button>

      {/* Conflict warning */}
      {hasConflicts && (
        <div
          className="text-[10px] text-red-500 text-center font-medium"
          data-testid="commit-conflict-warning"
        >
          {tr('Resolve merge conflicts before committing', '请先解决合并冲突再提交')}
        </div>
      )}

      {/* Help text */}
      <div className="text-[10px] text-muted-foreground text-center">
        {tr(
          `${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to commit`,
          `${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter 提交`
        )}
      </div>
    </div>
  )
}
