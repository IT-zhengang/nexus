import { useState, useEffect, useCallback } from 'react'
import { useKanbanStore } from '@/stores/useKanbanStore'
import { useWorktreeStore } from '@/stores/useWorktreeStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, GitMerge, GitCommit, Archive } from 'lucide-react'
import { useI18n } from '@/i18n/useI18n'

type Step = 'loading' | 'commit_base' | 'commit' | 'merge' | 'archive'

interface BranchStats {
  filesChanged: number
  insertions: number
  deletions: number
  commitsAhead: number
}

interface ResolvedState {
  featureWorktreeId: string
  featureWorktreePath: string
  featureBranch: string
  baseWorktreePath: string
  baseBranch: string
  ticketTitle: string
  projectPath: string
  uncommittedStats: { filesChanged: number; insertions: number; deletions: number }
  baseUncommittedStats: { filesChanged: number; insertions: number; deletions: number }
  baseDirty: boolean
  branchStats: BranchStats
}

export function MergeOnDoneDialog() {
  const { tr } = useI18n()
  const pendingDoneMove = useKanbanStore((s) => s.pendingDoneMove)
  const completeDoneMove = useKanbanStore((s) => s.completeDoneMove)

  const [step, setStep] = useState<Step>('loading')
  const [resolved, setResolved] = useState<ResolvedState | null>(null)
  const [commitMessage, setCommitMessage] = useState('')
  const [baseCommitMessage, setBaseCommitMessage] = useState('')
  const [committingBase, setCommittingBase] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [merging, setMerging] = useState(false)
  const [archiving, setArchiving] = useState(false)

  // Initialize when pendingDoneMove changes
  useEffect(() => {
    if (!pendingDoneMove) return

    let cancelled = false
    const pending = pendingDoneMove

    const init = async () => {
      setStep('loading')
      setResolved(null)

      try {
        // Look up ticket from store
        const tickets = useKanbanStore.getState().getTicketsForProject(pending.projectId)
        const ticket = tickets.find((t) => t.id === pending.ticketId)

        if (!ticket || !ticket.worktree_id) {
          await completeDoneMove()
          return
        }

        // Fetch feature worktree
        const featureWorktree = await window.db.worktree.get(ticket.worktree_id)
        if (!featureWorktree || featureWorktree.status !== 'active') {
          await completeDoneMove()
          return
        }

        // Resolve base branch
        const activeWorktrees = await window.db.worktree.getActiveByProject(pending.projectId)
        const defaultWt = activeWorktrees.find((w) => w.is_default)
        const resolvedBaseBranch = featureWorktree.base_branch ?? defaultWt?.branch_name

        if (!resolvedBaseBranch) {
          toast.warning(tr('Cannot merge — no base branch resolved', '无法合并：未解析到基础分支'))
          await completeDoneMove()
          return
        }

        // Find base worktree
        const baseWorktree = activeWorktrees.find(
          (w) => w.branch_name === resolvedBaseBranch && w.status === 'active'
        )

        if (!baseWorktree) {
          toast.warning(
            `${tr('Cannot merge — no worktree for', '无法合并：未找到对应工作树')} ${resolvedBaseBranch}`
          )
          await completeDoneMove()
          return
        }

        // Check both worktrees for dirty state in parallel
        const [baseDirty, hasUncommitted, branchStatResult] = await Promise.all([
          window.gitOps.hasUncommittedChanges(baseWorktree.path),
          window.gitOps.hasUncommittedChanges(featureWorktree.path),
          window.gitOps.branchDiffShortStat(featureWorktree.path, resolvedBaseBranch)
        ])

        if (cancelled) return

        // Get uncommitted diff stats for both worktrees if needed
        const [featureDiffResult, baseDiffResult] = await Promise.all([
          hasUncommitted
            ? window.gitOps.getDiffStat(featureWorktree.path)
            : Promise.resolve(null),
          baseDirty
            ? window.gitOps.getDiffStat(baseWorktree.path)
            : Promise.resolve(null)
        ])

        let uncommittedStats = { filesChanged: 0, insertions: 0, deletions: 0 }
        if (featureDiffResult?.success && featureDiffResult.files) {
          uncommittedStats = {
            filesChanged: featureDiffResult.files.length,
            insertions: featureDiffResult.files.reduce((sum, f) => sum + f.additions, 0),
            deletions: featureDiffResult.files.reduce((sum, f) => sum + f.deletions, 0)
          }
        }

        let baseUncommittedStats = { filesChanged: 0, insertions: 0, deletions: 0 }
        if (baseDiffResult?.success && baseDiffResult.files) {
          baseUncommittedStats = {
            filesChanged: baseDiffResult.files.length,
            insertions: baseDiffResult.files.reduce((sum, f) => sum + f.additions, 0),
            deletions: baseDiffResult.files.reduce((sum, f) => sum + f.deletions, 0)
          }
        }

        if (cancelled) return

        const branchStats: BranchStats = branchStatResult.success
          ? {
              filesChanged: branchStatResult.filesChanged,
              insertions: branchStatResult.insertions,
              deletions: branchStatResult.deletions,
              commitsAhead: branchStatResult.commitsAhead
            }
          : { filesChanged: 0, insertions: 0, deletions: 0, commitsAhead: 0 }

        // If no diffs at all, just move to done
        if (!hasUncommitted && branchStats.commitsAhead === 0) {
          await completeDoneMove()
          return
        }

        // Get project path for archive step
        const project = await window.db.project.get(featureWorktree.project_id)
        if (cancelled) return

        setResolved({
          featureWorktreeId: featureWorktree.id,
          featureWorktreePath: featureWorktree.path,
          featureBranch: featureWorktree.branch_name,
          baseWorktreePath: baseWorktree.path,
          baseBranch: resolvedBaseBranch,
          ticketTitle: ticket.title,
          projectPath: project?.path ?? baseWorktree.path,
          uncommittedStats,
          baseUncommittedStats,
          baseDirty,
          branchStats
        })
        setCommitMessage(ticket.title)
        setBaseCommitMessage('')
        setStep(baseDirty ? 'commit_base' : hasUncommitted ? 'commit' : 'merge')
      } catch (err) {
        if (!cancelled) {
          toast.error(
            `${tr('Failed to check branch', '检查分支失败')}: ${err instanceof Error ? err.message : String(err)}`
          )
          await completeDoneMove()
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [pendingDoneMove, completeDoneMove, tr])

  const handleCommit = useCallback(async () => {
    if (!resolved || !commitMessage.trim()) return
    setCommitting(true)
    try {
      const stageResult = await window.gitOps.stageAll(resolved.featureWorktreePath)
      if (!stageResult.success) {
        toast.error(`${tr('Failed to stage', '暂存失败')}: ${stageResult.error}`)
        return
      }

      const commitResult = await window.gitOps.commit(
        resolved.featureWorktreePath,
        commitMessage.trim()
      )
      if (!commitResult.success) {
        toast.error(`${tr('Failed to commit', '提交失败')}: ${commitResult.error}`)
        return
      }

      toast.success(tr('Changes committed', '更改已提交'))

      // Re-check branch divergence after commit
      const statResult = await window.gitOps.branchDiffShortStat(
        resolved.featureWorktreePath,
        resolved.baseBranch
      )

      if (statResult.success && statResult.commitsAhead > 0) {
        setResolved((prev) =>
          prev
            ? {
                ...prev,
                branchStats: {
                  filesChanged: statResult.filesChanged,
                  insertions: statResult.insertions,
                  deletions: statResult.deletions,
                  commitsAhead: statResult.commitsAhead
                }
              }
            : prev
        )
        setStep('merge')
      } else {
        // No divergence after commit — base already has everything
        await completeDoneMove()
      }
    } catch (err) {
      toast.error(`${tr('Commit failed', '提交失败')}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCommitting(false)
    }
  }, [resolved, commitMessage, completeDoneMove, tr])

  const handleCommitBase = useCallback(async () => {
    if (!resolved || !baseCommitMessage.trim()) return
    setCommittingBase(true)
    try {
      const stageResult = await window.gitOps.stageAll(resolved.baseWorktreePath)
      if (!stageResult.success) {
        toast.error(
          `${tr('Failed to stage on', '在以下分支暂存失败')} ${resolved.baseBranch}: ${stageResult.error}`
        )
        return
      }

      const commitResult = await window.gitOps.commit(
        resolved.baseWorktreePath,
        baseCommitMessage.trim()
      )
      if (!commitResult.success) {
        toast.error(
          `${tr('Failed to commit on', '在以下分支提交失败')} ${resolved.baseBranch}: ${commitResult.error}`
        )
        return
      }

      toast.success(`${tr('Changes committed on', '已在以下分支提交更改')} ${resolved.baseBranch}`)

      // Check if feature branch still has uncommitted changes
      const featureHasUncommitted = await window.gitOps.hasUncommittedChanges(
        resolved.featureWorktreePath
      )

      if (featureHasUncommitted) {
        setStep('commit')
      } else {
        // Re-check branch divergence
        const statResult = await window.gitOps.branchDiffShortStat(
          resolved.featureWorktreePath,
          resolved.baseBranch
        )
        if (statResult.success && statResult.commitsAhead > 0) {
          setResolved((prev) =>
            prev
              ? {
                  ...prev,
                  branchStats: {
                    filesChanged: statResult.filesChanged,
                    insertions: statResult.insertions,
                    deletions: statResult.deletions,
                    commitsAhead: statResult.commitsAhead
                  }
                }
              : prev
          )
          setStep('merge')
        } else {
          await completeDoneMove()
        }
      }
    } catch (err) {
      toast.error(`${tr('Commit failed', '提交失败')}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCommittingBase(false)
    }
  }, [resolved, baseCommitMessage, completeDoneMove, tr])

  const handleMerge = useCallback(async () => {
    if (!resolved) return
    setMerging(true)
    try {
      // Pull latest on base branch first (only if remote exists)
      const remoteResult = await window.gitOps.getRemoteUrl(resolved.baseWorktreePath)
      if (remoteResult.url) {
        const pullResult = await window.gitOps.pull(resolved.baseWorktreePath)
        if (!pullResult.success) {
          toast.warning(
            `${tr('Pull failed on', '在以下分支拉取失败')} ${resolved.baseBranch} — ${tr('continuing with local merge', '继续执行本地合并')}`
          )
        }
      }

      // Merge feature into base
      const mergeResult = await window.gitOps.merge(
        resolved.baseWorktreePath,
        resolved.featureBranch
      )

      if (!mergeResult.success) {
        // Conflicts or error — abort and let user handle manually
        if (mergeResult.conflicts && mergeResult.conflicts.length > 0) {
          await window.gitOps.mergeAbort(resolved.baseWorktreePath)
          toast.error(
            `${tr('Merge conflicts in', '以下文件存在合并冲突')} ${mergeResult.conflicts.length} ${tr(
              mergeResult.conflicts.length !== 1 ? 'files' : 'file',
              '个文件'
            )} — ${tr('merge manually', '请手动合并')}`
          )
        } else {
          toast.error(`${tr('Merge failed', '合并失败')}: ${mergeResult.error}`)
        }
        await completeDoneMove()
        return
      }

      toast.success(tr('Branch merged successfully', '分支合并成功'))
      setStep('archive')
    } catch (err) {
      toast.error(`${tr('Merge failed', '合并失败')}: ${err instanceof Error ? err.message : String(err)}`)
      await completeDoneMove()
    } finally {
      setMerging(false)
    }
  }, [resolved, completeDoneMove, tr])

  const handleArchive = useCallback(async () => {
    if (!resolved) return
    setArchiving(true)
    try {
      const result = await useWorktreeStore.getState().archiveWorktree(
        resolved.featureWorktreeId,
        resolved.featureWorktreePath,
        resolved.featureBranch,
        resolved.projectPath
      )

      if (result.success) {
        toast.success(tr('Worktree archived', '工作树已归档'))
      } else {
        toast.error(`${tr('Failed to archive', '归档失败')}: ${result.error}`)
      }
    } catch (err) {
      toast.error(`${tr('Archive failed', '归档失败')}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setArchiving(false)
      await completeDoneMove()
    }
  }, [resolved, completeDoneMove, tr])

  const stepTitle: Record<Step, string> = {
    loading: tr('Moving to Done...', '正在移至已完成...'),
    commit_base: tr('Uncommitted changes on base', '基础分支上有未提交更改'),
    commit: tr('Uncommitted changes', '存在未提交更改'),
    merge: tr('Merge branch', '合并分支'),
    archive: tr('Archive worktree', '归档工作树')
  }

  const stepIcon: Record<Step, React.ReactNode> = {
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    commit_base: <GitCommit className="h-4 w-4" />,
    commit: <GitCommit className="h-4 w-4" />,
    merge: <GitMerge className="h-4 w-4" />,
    archive: <Archive className="h-4 w-4" />
  }

  return (
    <Dialog
      open={!!pendingDoneMove}
      onOpenChange={(open) => {
        if (!open) completeDoneMove()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            {stepIcon[step]}
            {stepTitle[step]}
          </DialogTitle>
        </DialogHeader>

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tr('Checking branch status...', '正在检查分支状态...')}
          </div>
        )}

        {step === 'commit_base' && resolved && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              <code className="bg-muted px-1 rounded">{resolved.baseBranch}</code>{' '}
              {tr('has uncommitted changes', '有未提交更改')}:{' '}
              {resolved.baseUncommittedStats.filesChanged} {tr('files changed', '个文件已更改')},{' '}
              <span className="text-green-500">+{resolved.baseUncommittedStats.insertions}</span>{' '}
              <span className="text-red-500">-{resolved.baseUncommittedStats.deletions}</span>
            </p>
            <Input
              value={baseCommitMessage}
              onChange={(e) => setBaseCommitMessage(e.target.value)}
              placeholder={tr('Commit message for base branch', '基础分支的提交信息')}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => completeDoneMove()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {tr('Skip, just move to Done', '跳过，直接移至已完成')}
              </button>
              <Button
                size="sm"
                onClick={handleCommitBase}
                disabled={!baseCommitMessage.trim() || committingBase}
              >
                {committingBase ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <GitCommit className="h-3 w-3 mr-1" />
                )}
                {tr('Commit', '提交')}
              </Button>
            </div>
          </div>
        )}

        {step === 'commit' && resolved && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              {resolved.uncommittedStats.filesChanged} {tr('files changed', '个文件已更改')},{' '}
              <span className="text-green-500">+{resolved.uncommittedStats.insertions}</span>{' '}
              <span className="text-red-500">-{resolved.uncommittedStats.deletions}</span>
            </p>
            <Input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder={tr('Commit message', '提交信息')}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => completeDoneMove()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {tr('Skip, just move to Done', '跳过，直接移至已完成')}
              </button>
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={!commitMessage.trim() || committing}
              >
                {committing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <GitCommit className="h-3 w-3 mr-1" />
                )}
                {tr('Commit', '提交')}
              </Button>
            </div>
          </div>
        )}

        {step === 'merge' && resolved && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              {tr('Merge', '合并')} <code className="bg-muted px-1 rounded">{resolved.featureBranch}</code> {tr('into', '到')}{' '}
              <code className="bg-muted px-1 rounded">{resolved.baseBranch}</code>
            </p>
            <p className="text-xs text-muted-foreground">
              {resolved.branchStats.filesChanged} {tr('files changed', '个文件已更改')}，
              <span className="text-green-500"> +{resolved.branchStats.insertions}</span>
              <span className="text-red-500"> -{resolved.branchStats.deletions}</span>，
              {resolved.branchStats.commitsAhead} {tr('commits ahead', '个提交领先')}
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => completeDoneMove()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {tr('Skip, just move to Done', '跳过，直接移至已完成')}
              </button>
              <Button size="sm" onClick={handleMerge} disabled={merging}>
                {merging ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <GitMerge className="h-3 w-3 mr-1" />
                )}
                {tr('Merge', '合并')}
              </Button>
            </div>
          </div>
        )}

        {step === 'archive' && resolved && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-muted-foreground">
              {tr('Merge successful! Archive the', '合并成功！是否归档')}{' '}
              <code className="bg-muted px-1 rounded">{resolved.featureBranch}</code> {tr('worktree?', '工作树？')}
            </p>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => completeDoneMove()}>
                {tr('Keep', '保留')}
              </Button>
              <Button size="sm" onClick={handleArchive} disabled={archiving}>
                {archiving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Archive className="h-3 w-3 mr-1" />
                )}
                {tr('Archive', '归档')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
