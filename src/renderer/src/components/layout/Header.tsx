import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { isMac } from '@/lib/platform'
import { useIsWebMode } from '@/hooks/useIsWebMode'
import { getWebAuth } from '@/transport/graphql/auth'
import {
  PanelRightClose,
  PanelRightOpen,
  History,
  Settings,
  AlertTriangle,
  Loader2,
  GitPullRequest,
  GitMerge,
  Archive,
  ChevronDown,
  FileSearch,
  X,
  ExternalLink,
  Copy,
  Hammer,
  Map
} from 'lucide-react'
import { KanbanIcon } from '@/components/kanban/KanbanIcon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { useLayoutStore } from '@/stores/useLayoutStore'
import { useI18n } from '@/i18n/useI18n'
import { useSessionHistoryStore } from '@/stores/useSessionHistoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useWorktreeStore } from '@/stores/useWorktreeStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useGitStore } from '@/stores/useGitStore'
import { useWorktreeStatusStore } from '@/stores/useWorktreeStatusStore'
import { useVimModeStore } from '@/stores/useVimModeStore'
import { useKanbanStore } from '@/stores/useKanbanStore'
import { useTipStore } from '@/stores/useTipStore'
import { Tip } from '@/components/ui/Tip'
import { useFileViewerStore } from '@/stores/useFileViewerStore'
import { QuickActions } from './QuickActions'
import { useLifecycleActions } from '@/hooks/useLifecycleActions'
import { usePinAndActivateSession } from '@/hooks/usePinAndActivateSession'
import hiveLogo from '@/assets/icon.png'

type ConflictFixFlow =
  | {
      phase: 'starting'
      worktreePath: string
    }
  | {
      phase: 'running'
      worktreePath: string
      sessionId: string
      seenBusy: boolean
    }
  | {
      phase: 'refreshing'
      worktreePath: string
    }

function isConflictFixActiveStatus(status: string | null): boolean {
  return (
    status === 'working' ||
    status === 'planning' ||
    status === 'answering' ||
    status === 'permission'
  )
}

export function Header(): React.JSX.Element {
  const { tr } = useI18n()
  const isWebMode = useIsWebMode()
  const webServerUrl = useMemo(() => {
    if (!isWebMode) return null
    const auth = getWebAuth()
    if (!auth) return null
    try {
      return new URL(auth.serverUrl).host
    } catch {
      return auth.serverUrl
    }
  }, [isWebMode])
  const { rightSidebarCollapsed, toggleRightSidebar } = useLayoutStore()
  const { openPanel: openSessionHistory } = useSessionHistoryStore()
  const openSettings = useSettingsStore((s) => s.openSettings)
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId)
  const projects = useProjectStore((s) => s.projects)
  const { selectedWorktreeId, worktreesByProject } = useWorktreeStore()
  const selectedWorktreePath = useMemo(() => {
    if (!selectedWorktreeId) return null
    for (const worktrees of worktreesByProject.values()) {
      const wt = worktrees.find((w) => w.id === selectedWorktreeId)
      if (wt) return wt.path
    }
    return null
  }, [selectedWorktreeId, worktreesByProject])
  const createSession = useSessionStore((s) => s.createSession)
  const updateSessionName = useSessionStore((s) => s.updateSessionName)
  const setPendingMessage = useSessionStore((s) => s.setPendingMessage)
  const setActiveSession = useSessionStore((s) => s.setActiveSession)

  // Lifecycle actions hook — PR/Review/Merge/Archive logic
  const lifecycle = useLifecycleActions(selectedWorktreeId)
  const { pinAndActivate, lifecycleLoading } = usePinAndActivateSession()

  const vimMode = useVimModeStore((s) => s.mode)
  const vimModeEnabled = useSettingsStore((s) => s.vimModeEnabled)
  const mergeConflictMode = useSettingsStore((s) => s.mergeConflictMode)
  const boardMode = useSettingsStore((s) => s.boardMode)
  const showVimHints = vimModeEnabled && vimMode === 'normal'
  const isBoardViewActive = useKanbanStore((s) => s.isBoardViewActive)
  const toggleBoardView = useKanbanStore((s) => s.toggleBoardView)
  const kanbanIconSeen = useTipStore((s) => s.isTipSeen('kanban-icon'))
  const nonDefaultProviderChosen = useTipStore((s) => s.nonDefaultProviderChosen)
  const [conflictFixFlow, setConflictFixFlow] = useState<ConflictFixFlow | null>(null)

  // Track first-time kanban exit for the kanban-reenter tip
  const [justExitedKanban, setJustExitedKanban] = useState(false)
  const prevBoardActive = useRef(isBoardViewActive)
  useEffect(() => {
    if (prevBoardActive.current && !isBoardViewActive) {
      setJustExitedKanban(true)
    }
    prevBoardActive.current = isBoardViewActive
  }, [isBoardViewActive])

  const hasProjects = projects.length > 0

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const selectedWorktree = (() => {
    if (!selectedWorktreeId) return null
    for (const worktrees of worktreesByProject.values()) {
      const wt = worktrees.find((w) => w.id === selectedWorktreeId)
      if (wt) return wt
    }
    return null
  })()

  // Connection mode detection
  const selectedConnectionId = useConnectionStore((s) => s.selectedConnectionId)
  const selectedConnection = useConnectionStore((s) =>
    s.selectedConnectionId ? s.connections.find((c) => c.id === s.selectedConnectionId) : null
  )
  const isConnectionMode = !!selectedConnectionId && !selectedWorktreeId

  const hasConflicts = useGitStore(
    (state) =>
      (selectedWorktree?.path ? state.conflictsByWorktree[selectedWorktree.path] : false) ?? false
  )

  // Keep isOperating in Header (used for button disable state)
  const isOperating = useGitStore((state) => state.isPushing || state.isPulling)

  // Destructure lifecycle state for template use
  const {
    attachedPR, hasAttachedPR, prLiveState, isGitHub,
    isMergingPR, isArchiving: isArchivingWorktree, branchInfo, remoteBranches,
    prTargetBranch, reviewTargetBranch, isCleanTree, loadPRList, loadPRState
  } = lifecycle

  const conflictFixSessionStatus = useWorktreeStatusStore((state) =>
    conflictFixFlow?.phase === 'running'
      ? (state.sessionStatuses[conflictFixFlow.sessionId]?.status ?? null)
      : null
  )

  // Clear conflict fix flow as soon as conflicts are resolved
  useEffect(() => {
    if (!hasConflicts && conflictFixFlow) {
      setConflictFixFlow(null)
    }
  }, [hasConflicts, conflictFixFlow])

  useEffect(() => {
    if (!conflictFixFlow || conflictFixFlow.phase !== 'running') return

    const isBusy = isConflictFixActiveStatus(conflictFixSessionStatus)

    if (isBusy && !conflictFixFlow.seenBusy) {
      setConflictFixFlow((prev) =>
        prev && prev.phase === 'running' ? { ...prev, seenBusy: true } : prev
      )
      return
    }

    const shouldFinalize =
      (conflictFixFlow.seenBusy && !isBusy) ||
      (!conflictFixFlow.seenBusy && conflictFixSessionStatus === 'completed')

    if (!shouldFinalize) return

    let cancelled = false
    const finishConflictRun = async (): Promise<void> => {
      setConflictFixFlow((prev) =>
        prev && prev.phase === 'running'
          ? { phase: 'refreshing', worktreePath: prev.worktreePath }
          : prev
      )

      try {
        await useGitStore.getState().refreshStatuses(conflictFixFlow.worktreePath)
      } finally {
        if (!cancelled) {
          setConflictFixFlow((prev) =>
            prev?.worktreePath === conflictFixFlow.worktreePath ? null : prev
          )
        }
      }
    }

    void finishConflictRun()

    return () => {
      cancelled = true
    }
  }, [conflictFixFlow, conflictFixSessionStatus])

  // PR picker popover state (UI-specific to Header)
  const [prPickerOpen, setPrPickerOpen] = useState(false)
  const [prList, setPrList] = useState<
    Array<{ number: number; title: string; author: string; headRefName: string }>
  >([])
  const [prListLoading, setPrListLoading] = useState(false)

  // Fetch PR list + live state when picker opens
  useEffect(() => {
    if (!prPickerOpen) return
    setPrListLoading(true)

    const fetchPRs = loadPRList().then((list) => {
      setPrList(list)
    })

    const fetchState = hasAttachedPR ? loadPRState() : Promise.resolve()

    Promise.all([fetchPRs, fetchState]).finally(() => setPrListLoading(false))
  }, [prPickerOpen, hasAttachedPR, loadPRList, loadPRState])

  // Thin wrappers for actions that also manage UI-local state (prPickerOpen)
  const handleSelectPR = (pr: { number: number }) => {
    lifecycle.attachPR(pr.number)
    setPrPickerOpen(false)
  }

  const handleDetachPR = () => {
    lifecycle.detachPR()
    setPrPickerOpen(false)
  }

  const handleFixConflicts = useCallback(async (modeOverride?: 'build' | 'plan') => {
    if (!selectedWorktreeId || !selectedProjectId || !selectedWorktree?.path) return

    const resolvedMode = modeOverride ?? (mergeConflictMode === 'always-ask' ? 'build' : mergeConflictMode)

    setConflictFixFlow({
      phase: 'starting',
      worktreePath: selectedWorktree.path
    })

    const { success, session } = await createSession(selectedWorktreeId, selectedProjectId, undefined, resolvedMode)
    if (!success || !session) {
      setConflictFixFlow(null)
      return
    }

    const branchName = selectedWorktree?.branch_name || 'unknown'
    await updateSessionName(
      session.id,
      tr(`Merge Conflicts - ${branchName}`, `合并冲突 - ${branchName}`)
    )
    setPendingMessage(session.id, tr('Fix merge conflicts', '修复合并冲突'))
    setActiveSession(session.id)

    setConflictFixFlow({
      phase: 'running',
      worktreePath: selectedWorktree.path,
      sessionId: session.id,
      seenBusy: false
    })
  }, [mergeConflictMode, selectedWorktreeId, selectedProjectId, selectedWorktree, createSession, updateSessionName, setPendingMessage, setActiveSession, tr])

  const isFixConflictsLoading =
    !!selectedWorktree?.path &&
    !!conflictFixFlow &&
    conflictFixFlow.worktreePath === selectedWorktree.path

  const showFixConflictsButton = hasConflicts || isFixConflictsLoading

  return (
    <header
      className="h-12 border-b bg-background flex items-center justify-between px-4 flex-shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      data-testid="header"
    >
      {/* Spacer for macOS traffic lights */}
      {isMac() && <div className="w-16 flex-shrink-0" />}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <img src={hiveLogo} alt="Hive" className="h-5 w-5 shrink-0 rounded" draggable={false} />
        {isConnectionMode && selectedConnection ? (
          <span className="text-sm font-medium truncate" data-testid="header-connection-info">
            {selectedConnection.name}
            <span className="text-primary font-normal">
              {' '}
              ({selectedConnection.members.map((m) => m.project_name).join(' + ')})
            </span>
          </span>
        ) : selectedProject ? (
          <span className="text-sm font-medium truncate" data-testid="header-project-info">
            {selectedProject.name}
            {selectedWorktree?.branch_name && selectedWorktree.name !== '(no-worktree)' && (
              <span className="text-primary font-normal"> ({selectedWorktree.branch_name})</span>
            )}
          </span>
        ) : (
          <span className="text-sm font-medium">Hive</span>
        )}
        {isWebMode && webServerUrl && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border select-none text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
            data-testid="web-connection-indicator"
          >
            {tr('Connected to', '已连接到')} {webServerUrl}
          </span>
        )}
        {vimModeEnabled && (
          <span
            className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded border select-none',
              vimMode === 'normal'
                ? 'text-muted-foreground bg-muted/50 border-border/50'
                : 'text-primary bg-primary/10 border-primary/30'
            )}
            data-testid="vim-mode-pill"
          >
            {vimMode === 'normal' ? tr('NORMAL', '普通') : tr('INSERT', '插入')}
          </span>
        )}
      </div>
      {/* Center: Quick Actions */}
      <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <QuickActions />
      </div>
      {!isConnectionMode && showFixConflictsButton && (
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {mergeConflictMode === 'always-ask' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs font-semibold"
                  disabled={isFixConflictsLoading}
                  data-testid="fix-conflicts-button"
                >
                  {isFixConflictsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isFixConflictsLoading
                    ? tr('Fixing conflicts...', '正在修复冲突...')
                    : tr('Fix conflicts', '修复冲突')}
                  {!isFixConflictsLoading && <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleFixConflicts('build')}>
                  <Hammer className="h-4 w-4 mr-2" />
                  {tr('Fix in Build mode', '以 Build 模式修复')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFixConflicts('plan')}>
                  <Map className="h-4 w-4 mr-2" />
                  {tr('Fix in Plan mode', '以 Plan 模式修复')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs font-semibold"
              onClick={() => handleFixConflicts()}
              disabled={isFixConflictsLoading}
              data-testid="fix-conflicts-button"
            >
              {isFixConflictsLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              )}
              {isFixConflictsLoading
                ? tr('Fixing conflicts...', '正在修复冲突...')
                : tr('Fix conflicts', '修复冲突')}
            </Button>
          )}
        </div>
      )}
      <div className="flex-1" />
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {!isConnectionMode &&
          isGitHub &&
          hasAttachedPR &&
          prLiveState?.state === 'MERGED' &&
          !lifecycle.isDefault && (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={() => lifecycle.archiveWorktree()}
              disabled={isArchivingWorktree}
              title={tr('Archive worktree', '归档工作树')}
              data-testid="pr-archive-button"
            >
              {isArchivingWorktree ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5 mr-1" />
              )}
              {isArchivingWorktree ? (
                tr('Archiving...', '归档中...')
              ) : showVimHints ? (
                <span>
                  <span className="text-primary font-bold">A</span>
                  {tr('rchive', '归档')}
                </span>
              ) : (
                tr('Archive', '归档')
              )}
            </Button>
          )}
        {!isConnectionMode &&
          isGitHub &&
          hasAttachedPR &&
          prLiveState?.state !== 'MERGED' &&
          prLiveState?.state !== 'CLOSED' &&
          isCleanTree && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600/20"
              onClick={() => lifecycle.mergePR()}
              disabled={isMergingPR}
              title={tr('Merge Pull Request', '合并拉取请求')}
              data-testid="pr-merge-button"
            >
              {isMergingPR ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <GitMerge className="h-3.5 w-3.5 mr-1" />
              )}
              {isMergingPR ? (
                tr('Merging...', '合并中...')
              ) : showVimHints ? (
                <span>
                  <span className="text-primary font-bold">M</span>
                  {tr('erge PR', '合并 PR')}
                </span>
              ) : (
                tr('Merge PR', '合并 PR')
              )}
            </Button>
          )}
        {!isConnectionMode && selectedWorktree && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => pinAndActivate(() => lifecycle.createCodeReview())}
              disabled={isOperating || lifecycleLoading}
              title={tr('Review branch changes with AI', '使用 AI 审查分支变更')}
              data-testid="review-button"
            >
              {lifecycleLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <FileSearch className="h-3.5 w-3.5 mr-1" />
              )}
              {showVimHints ? (
                <span>
                  <span className="text-primary font-bold">R</span>
                  {tr('eview', '审查')}
                </span>
              ) : (
                tr('Review', '审查')
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground px-2 h-7"
                  data-testid="review-target-branch-trigger"
                >
                  vs {reviewTargetBranch || branchInfo?.tracking || 'origin/main'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                {remoteBranches.length === 0 ? (
                  <DropdownMenuItem disabled>{tr('No remote branches', '没有远程分支')}</DropdownMenuItem>
                ) : (
                  remoteBranches.map((branch) => (
                    <DropdownMenuItem
                      key={branch.name}
                      onClick={() => lifecycle.setReviewTargetBranch(branch.name)}
                      data-testid={`review-target-branch-${branch.name}`}
                    >
                      {branch.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {/* PR Badge with Popover Picker — shown when a PR is attached */}
        {!isConnectionMode && isGitHub && hasAttachedPR && (
          <ContextMenu>
            <Popover open={prPickerOpen} onOpenChange={setPrPickerOpen}>
              <ContextMenuTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    title={tr(
                      `PR #${attachedPR!.number} (right-click for options)`,
                      `PR #${attachedPR!.number}（右键查看选项）`
                    )}
                    data-testid="pr-badge"
                  >
                    <GitPullRequest className="h-3.5 w-3.5 mr-1" />
                    PR #{attachedPR!.number}
                    {prLiveState?.state === 'MERGED' && (
                      <span className="text-muted-foreground ml-1">{tr('· merged', '· 已合并')}</span>
                    )}
                    {prLiveState?.state === 'CLOSED' && (
                      <span className="text-muted-foreground ml-1">{tr('· closed', '· 已关闭')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
              </ContextMenuTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                {/* Attached PR header */}
                <div className="px-3 py-2 border-b">
                  <div className="text-xs font-medium text-muted-foreground">
                    {tr(`Attached: #${attachedPR!.number}`, `已附加：#${attachedPR!.number}`)}
                  </div>
                  {prLiveState?.title && (
                    <div className="text-sm truncate">
                      {prLiveState.title}
                      {prLiveState.state && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({tr(prLiveState.state.toLowerCase(), prLiveState.state === 'MERGED' ? '已合并' : prLiveState.state === 'CLOSED' ? '已关闭' : prLiveState.state.toLowerCase())})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* PR list */}
                <div className="max-h-48 overflow-y-auto">
                  {prListLoading ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />
                      {tr('Loading PRs...', '正在加载 PR...')}
                    </div>
                  ) : prList.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {tr('No open PRs found', '未找到开放中的 PR')}
                    </div>
                  ) : (
                    prList.map((pr) => (
                      <button
                        key={pr.number}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                          'flex items-center gap-2',
                          pr.number === attachedPR!.number && 'bg-accent/50'
                        )}
                        onClick={() => handleSelectPR(pr)}
                        data-testid={`pr-picker-item-${pr.number}`}
                      >
                        <span className={cn(
                          'text-xs font-mono shrink-0',
                          pr.number === attachedPR!.number && 'text-primary font-bold'
                        )}>
                          {pr.number === attachedPR!.number ? '●' : ' '} #{pr.number}
                        </span>
                        <span className="truncate">{pr.title}</span>
                      </button>
                    ))
                  )}
                </div>
                {/* Detach action */}
                <div className="border-t">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-1"
                    onClick={handleDetachPR}
                    data-testid="pr-detach-button"
                  >
                    <X className="h-3.5 w-3.5" />
                    {tr('Detach PR', '分离 PR')}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <ContextMenuContent>
              <ContextMenuItem onClick={lifecycle.openPRInBrowser}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {tr('Open PR in Browser', '在浏览器中打开 PR')}
              </ContextMenuItem>
              <ContextMenuItem onClick={lifecycle.copyPRUrl}>
                <Copy className="h-4 w-4 mr-2" />
                {tr('Copy PR URL', '复制 PR 链接')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={handleDetachPR}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-2" />
                {tr('Detach PR', '分离 PR')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
        {/* Create PR button — shown when no PR attached */}
        {!isConnectionMode && isGitHub && !hasAttachedPR && (
          <Popover open={prPickerOpen} onOpenChange={setPrPickerOpen}>
            <PopoverAnchor asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  if (selectedWorktreeId && selectedWorktreePath) {
                    useGitStore.getState().setCreatePRModalOpen(true, {
                      worktreeId: selectedWorktreeId,
                      worktreePath: selectedWorktreePath,
                    })
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setPrPickerOpen(true)
                }}
                disabled={isOperating || lifecycleLoading}
                title={tr('Create Pull Request (right-click to attach existing)', '创建拉取请求（右键可附加现有 PR）')}
                data-testid="pr-button"
              >
                {lifecycleLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <GitPullRequest className="h-3.5 w-3.5 mr-1" />
                )}
                {showVimHints ? (
                  <span>
                    <span className="text-primary font-bold">P</span>R
                  </span>
                ) : (
                  'PR'
                )}
              </Button>
            </PopoverAnchor>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-3 py-2 border-b">
                <div className="text-xs font-medium text-muted-foreground">
                  {tr('Attach existing PR', '附加现有 PR')}
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {prListLoading ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />
                    {tr('Loading PRs...', '正在加载 PR...')}
                  </div>
                ) : prList.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    {tr('No open PRs found', '未找到开放中的 PR')}
                  </div>
                ) : (
                  prList.map((pr) => (
                    <button
                      key={pr.number}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer',
                        'flex items-center gap-2'
                      )}
                      onClick={() => handleSelectPR(pr)}
                      data-testid={`pr-picker-item-${pr.number}`}
                    >
                      <span className="text-xs font-mono shrink-0">
                        #{pr.number}
                      </span>
                      <span className="truncate">{pr.title}</span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-muted-foreground px-2 h-7"
                  data-testid="pr-target-branch-trigger"
                >
                  → {prTargetBranch || branchInfo?.tracking || 'origin/main'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                {remoteBranches.length === 0 ? (
                  <DropdownMenuItem disabled>{tr('No remote branches', '没有远程分支')}</DropdownMenuItem>
                ) : (
                  remoteBranches.map((branch) => (
                    <DropdownMenuItem
                      key={branch.name}
                      onClick={() => lifecycle.setPrTargetBranch(branch.name)}
                      data-testid={`pr-target-branch-${branch.name}`}
                    >
                      {branch.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Popover>
        )}
        {boardMode === 'toggle' && (
          <Tip
            tipId={kanbanIconSeen ? 'kanban-reenter' : 'kanban-icon'}
            enabled={kanbanIconSeen ? justExitedKanban : hasProjects}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const fileStore = useFileViewerStore.getState()
                if (!isBoardViewActive) {
                  fileStore.clearActiveViews()
                  toggleBoardView()
                } else if (fileStore.hasActiveOverlay()) {
                  fileStore.clearActiveViews()
                } else {
                  toggleBoardView()
                }
              }}
              title={
                isBoardViewActive
                  ? tr('Close Board', '关闭看板')
                  : tr('Open Board', '打开看板')
              }
              data-testid="kanban-board-toggle"
              className={cn(
                isBoardViewActive && 'bg-accent text-accent-foreground'
              )}
            >
              <KanbanIcon className="h-4 w-4" />
            </Button>
          </Tip>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={openSessionHistory}
          title={tr('Session History (⌘K)', '会话历史（⌘K）')}
          data-testid="session-history-toggle"
        >
          <History className="h-4 w-4" />
        </Button>
        <Tip tipId="settings-default-provider" enabled={nonDefaultProviderChosen}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openSettings()}
            title={tr('Settings (⌘,)', '设置（⌘,）')}
            data-testid="settings-toggle"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </Tip>
        <Button
          onClick={toggleRightSidebar}
          variant="ghost"
          size="icon"
          title={
            rightSidebarCollapsed
              ? tr('Show sidebar', '显示侧边栏')
              : tr('Hide sidebar', '隐藏侧边栏')
          }
          data-testid="right-sidebar-toggle"
        >
          {rightSidebarCollapsed ? (
            <PanelRightOpen className="h-4 w-4" />
          ) : (
            <PanelRightClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  )
}
