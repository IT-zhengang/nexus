import { useState, useRef, useEffect, useCallback } from 'react'
import { revealLabel } from '@/lib/platform'
import {
  ChevronRight,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  GitBranch,
  FolderHeart
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem
} from '@/components/ui/context-menu'
import {
  useProjectStore,
  useWorktreeStore,
  useSpaceStore,
  useConnectionStore,
  useHintStore,
  useVimModeStore,
  useSettingsStore
} from '@/stores'
import { HintBadge } from '@/components/ui/HintBadge'
import { WorktreeList, BranchPickerDialog } from '@/components/worktrees'
import { LanguageIcon } from './LanguageIcon'
import { HighlightedText } from './HighlightedText'
import { gitToast } from '@/lib/toast'
import { useI18n } from '@/i18n'

interface Project {
  id: string
  name: string
  path: string
  description: string | null
  tags: string | null
  language: string | null
  custom_icon: string | null
  detected_icon: string | null
  setup_script: string | null
  run_script: string | null
  archive_script: string | null
  auto_assign_port: boolean
  sort_order: number
  created_at: string
  last_accessed_at: string
}

interface ProjectItemProps {
  project: Project
  nameMatchIndices?: number[]
  pathMatchIndices?: number[]
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}

export function ProjectItem({
  project,
  nameMatchIndices,
  pathMatchIndices,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ProjectItemProps): React.JSX.Element {
  const { tr } = useI18n()
  const {
    selectedProjectId,
    expandedProjectIds,
    editingProjectId,
    selectProject,
    toggleProjectExpanded,
    setEditingProject,
    updateProjectName,
    removeProject,
    refreshLanguage
  } = useProjectStore()

  const { createWorktree, creatingForProjectId, syncWorktrees } = useWorktreeStore()

  const spaces = useSpaceStore((s) => s.spaces)
  const projectSpaceMap = useSpaceStore((s) => s.projectSpaceMap)
  const assignProjectToSpace = useSpaceStore((s) => s.assignProjectToSpace)
  const removeProjectFromSpace = useSpaceStore((s) => s.removeProjectFromSpace)

  const connectionModeActive = useConnectionStore((s) => s.connectionModeActive)

  const projectSpaceIds = projectSpaceMap[project.id] ?? []

  const plusHint = useHintStore((s) => s.hintMap.get('plus:' + project.id))
  const hintMode = useHintStore((s) => s.mode)
  const hintPendingChar = useHintStore((s) => s.pendingChar)
  const hintActionMode = useHintStore((s) => s.actionMode)
  const isSearchMode = useHintStore((s) => s.filterActive)
  const inputFocused = useHintStore((s) => s.inputFocused)

  const vimMode = useVimModeStore((s) => s.mode)
  const vimModeEnabled = useSettingsStore((s) => s.vimModeEnabled)
  const autoPullBeforeWorktree = useSettingsStore((s) => s.autoPullBeforeWorktree)
  const projectHint = useHintStore((s) => s.hintMap.get('project:' + project.id))

  const [editName, setEditName] = useState(project.name)
  const [branchPickerOpen, setBranchPickerOpen] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const [noCommitsDialogOpen, setNoCommitsDialogOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isCreatingWorktree = creatingForProjectId === project.id

  const isSelected = selectedProjectId === project.id
  const isExpanded = isSearchMode || expandedProjectIds.has(project.id)
  const isEditing = editingProjectId === project.id

  // Focus input when editing starts (deferred to run after menu closes)
  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing])

  const handleClick = (): void => {
    selectProject(project.id)
    toggleProjectExpanded(project.id)
  }

  const handleToggleExpand = (e: React.MouseEvent): void => {
    e.stopPropagation()
    toggleProjectExpanded(project.id)
  }

  const handleStartEdit = (): void => {
    setEditName(project.name)
    setEditingProject(project.id)
  }

  const handleSaveEdit = async (): Promise<void> => {
    const trimmedName = editName.trim()
    if (trimmedName && trimmedName !== project.name) {
      const success = await updateProjectName(project.id, trimmedName)
      if (success) {
        toast.success(tr('Project renamed successfully', '项目重命名成功'))
      } else {
        toast.error(tr('Failed to rename project', '项目重命名失败'))
      }
    }
    setEditingProject(null)
  }

  const handleCancelEdit = (): void => {
    setEditName(project.name)
    setEditingProject(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleRemove = async (): Promise<void> => {
    setRemoveConfirmOpen(false)
    const success = await removeProject(project.id)
    if (success) {
      toast.success(tr('Project removed from Hive', '项目已从 Hive 中移除'))
    } else {
      toast.error(tr('Failed to remove project', '移除项目失败'))
    }
  }

  const handleOpenInFinder = async (): Promise<void> => {
    await window.projectOps.showInFolder(project.path)
  }

  const handleCopyPath = async (): Promise<void> => {
    await window.projectOps.copyToClipboard(project.path)
    toast.success(tr('Path copied to clipboard', '路径已复制到剪贴板'))
  }

  const handleRefreshProject = async (): Promise<void> => {
    await syncWorktrees(project.id, project.path)
    toast.success(tr('Project refreshed', '项目已刷新'))
  }

  const doCreateWorktree = useCallback(async (): Promise<void> => {
    if (isCreatingWorktree) return

    // Check if repo has any commits before attempting worktree creation
    const hasCommits = await window.worktreeOps.hasCommits(project.path)
    if (!hasCommits) {
      setNoCommitsDialogOpen(true)
      return
    }

    // Show loading toast with appropriate progress message based on auto-pull setting
    const loadingToastId = autoPullBeforeWorktree
      ? toast.loading(tr('Pulling latest changes from origin...', '正在从 origin 拉取最新变更...'))
      : toast.loading(tr('Creating worktree...', '正在创建工作树...'))

    try {
      const result = await createWorktree(project.id, project.path, project.name)

      // Dismiss loading toast
      toast.dismiss(loadingToastId)

      if (result.success) {
        // Show warning if auto-pull was enabled but pull failed
        if (autoPullBeforeWorktree && result.pullInfo?.pulled === false) {
          toast.warning(
            tr(
              'Failed to pull latest changes - worktree created from local branch',
              '拉取最新变更失败 - 已基于本地分支创建工作树'
            )
          )
          // Delay success toast so warning is visible
          setTimeout(() => {
            gitToast.worktreeCreated(project.name)
          }, 1500)
        }
        // Show info toast if commits were pulled
        else if (result.pullInfo?.updated) {
          toast.info(tr('Pulled latest changes from origin', '已从 origin 拉取最新变更'))
          gitToast.worktreeCreated(project.name)
        } else {
          // No pull info to show, just success
          gitToast.worktreeCreated(project.name)
        }
      } else {
        gitToast.operationFailed('create worktree', result.error)
      }
    } catch (error) {
      toast.dismiss(loadingToastId)
      gitToast.operationFailed(
        'create worktree',
        error instanceof Error ? error.message : tr('Unknown error', '未知错误')
      )
    }
  }, [isCreatingWorktree, createWorktree, project, autoPullBeforeWorktree, tr])

  const handleCreateWorktree = useCallback(
    async (e: React.MouseEvent): Promise<void> => {
      e.stopPropagation()
      await doCreateWorktree()
    },
    [doCreateWorktree]
  )

  useEffect(() => {
    const handler = (e: Event): void => {
      const ce = e as CustomEvent<{ projectId: string }>
      if (ce.detail.projectId === project.id) doCreateWorktree()
    }
    window.addEventListener('hive:hint-plus', handler)
    return () => window.removeEventListener('hive:hint-plus', handler)
  }, [project.id, doCreateWorktree])

  const handleBranchSelect = useCallback(
    async (branchName: string, prNumber?: number): Promise<void> => {
      setBranchPickerOpen(false)

      // Show loading toast with appropriate progress message based on auto-pull setting
      const loadingToastId = autoPullBeforeWorktree && !prNumber
        ? toast.loading(tr('Pulling latest changes from origin...', '正在从 origin 拉取最新变更...'))
        : toast.loading(tr('Creating worktree...', '正在创建工作树...'))

      try {
        const result = await window.worktreeOps.createFromBranch(
          project.id,
          project.path,
          project.name,
          branchName,
          prNumber
        )

        // Dismiss loading toast
        toast.dismiss(loadingToastId)

        if (result.success && result.worktree) {
          useWorktreeStore.getState().loadWorktrees(project.id)
          useWorktreeStore.getState().selectWorktree(result.worktree.id)

          // Show warning if auto-pull was enabled but pull failed (not for PRs)
          if (autoPullBeforeWorktree && !prNumber && result.pullInfo?.pulled === false) {
            toast.warning(
              tr(
                'Failed to pull latest changes - worktree created from local branch',
                '拉取最新变更失败 - 已基于本地分支创建工作树'
              )
            )
            // Delay success toast so warning is visible
            setTimeout(() => {
              gitToast.worktreeCreated(branchName)
            }, 1500)
          }
          // Show info toast if commits were pulled (not applicable for PR checkouts)
          else if (!prNumber && result.pullInfo?.updated) {
            toast.info(tr('Pulled latest changes from origin', '已从 origin 拉取最新变更'))
            gitToast.worktreeCreated(branchName)
          } else {
            // No pull info to show, just success
            gitToast.worktreeCreated(branchName)
          }
        } else {
          gitToast.operationFailed('create worktree from branch', result.error)
        }
      } catch (error) {
        toast.dismiss(loadingToastId)
        gitToast.operationFailed(
          'create worktree from branch',
          error instanceof Error ? error.message : tr('Unknown error', '未知错误')
        )
      }
    },
    [project, autoPullBeforeWorktree, tr]
  )

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
              isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              isDragging && 'opacity-50',
              isDragOver && 'border-t-2 border-primary'
            )}
            draggable={!!onDragStart && !isEditing && !connectionModeActive}
            onDragStart={connectionModeActive ? undefined : onDragStart}
            onDragOver={connectionModeActive ? undefined : onDragOver}
            onDrop={connectionModeActive ? undefined : onDrop}
            onDragEnd={connectionModeActive ? undefined : onDragEnd}
            onClick={handleClick}
            data-testid={`project-item-${project.id}`}
          >
            {/* Project Hint Badge (visible in vim normal mode, left of chevron) */}
            {!isEditing && projectHint && vimModeEnabled && vimMode === 'normal' && (
              <HintBadge
                code={projectHint}
                mode={hintMode}
                pendingChar={hintPendingChar}
                actionMode={hintActionMode}
              />
            )}

            {/* Expand/Collapse Chevron */}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={handleToggleExpand}
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            </Button>

            {/* Language Icon */}
            <LanguageIcon language={project.language} customIcon={project.custom_icon} detectedIcon={project.detected_icon} />

            {/* Project Name */}
            {isEditing ? (
              <Input
                ref={inputRef}
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="h-6 py-0 px-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex-1 min-w-0">
                {nameMatchIndices ? (
                  <HighlightedText
                    text={project.name}
                    indices={nameMatchIndices}
                    className="text-sm truncate block"
                  />
                ) : (
                  <span className="text-sm truncate block" title={project.path}>
                    {project.name}
                  </span>
                )}
                {pathMatchIndices && (
                  <HighlightedText
                    text={project.path}
                    indices={pathMatchIndices}
                    className="text-[10px] text-muted-foreground truncate block"
                  />
                )}
              </div>
            )}

            {/* Plus Hint Badge (visible when filter is active and search field is focused) */}
            {!isEditing &&
              plusHint &&
              (inputFocused || (vimModeEnabled && vimMode === 'normal')) && (
                <HintBadge
                  code={plusHint}
                  mode={hintMode}
                  pendingChar={hintPendingChar}
                  actionMode={hintActionMode}
                />
              )}

            {/* Create Worktree Button */}
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-5 w-5 p-0 cursor-pointer', 'hover:bg-accent')}
                onClick={handleCreateWorktree}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setBranchPickerOpen(true)
                }}
                disabled={isCreatingWorktree}
              >
                {isCreatingWorktree ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </ContextMenuTrigger>

        {!connectionModeActive && (
          <ContextMenuContent className="w-48">
            <ContextMenuItem onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {tr('Edit Name', '编辑名称')}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleOpenInFinder}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {revealLabel(true)}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyPath}>
              <Copy className="h-4 w-4 mr-2" />
              {tr('Copy Path', '复制路径')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => refreshLanguage(project.id)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tr('Refresh Language', '刷新语言')}
            </ContextMenuItem>
            <ContextMenuItem onClick={handleRefreshProject}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {tr('Refresh Project', '刷新项目')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setBranchPickerOpen(true)}>
              <GitBranch className="h-4 w-4 mr-2" />
              {tr('New Workspace From...', '从以下来源新建工作区...')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => useProjectStore.getState().openProjectSettings(project.id)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {tr('Project Settings', '项目设置')}
            </ContextMenuItem>
            {spaces.length > 0 && (
              <>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <FolderHeart className="h-4 w-4 mr-2" />
                    {tr('Assign to Space', '分配到空间')}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-40">
                    {spaces.map((space) => {
                      const isAssigned = projectSpaceIds.includes(space.id)
                      return (
                        <ContextMenuCheckboxItem
                          key={space.id}
                          checked={isAssigned}
                          onSelect={(e) => {
                            e.preventDefault()
                            if (isAssigned) {
                              removeProjectFromSpace(project.id, space.id)
                            } else {
                              assignProjectToSpace(project.id, space.id)
                            }
                          }}
                        >
                          {space.name}
                        </ContextMenuCheckboxItem>
                      )
                    })}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => setRemoveConfirmOpen(true)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {tr('Remove from Hive', '从 Hive 中移除')}
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      {/* Worktree List - shown when project is expanded */}
      {isExpanded && <WorktreeList project={project} />}

      {/* Branch Picker Dialog */}
      <BranchPickerDialog
        open={branchPickerOpen}
        onOpenChange={setBranchPickerOpen}
        projectPath={project.path}
        onSelect={handleBranchSelect}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Remove project from Hive?', '要从 Hive 中移除此项目吗？')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {tr('This will remove', '这将从 Hive 中移除')}{' '}
                  <span className="font-semibold">{project.name}</span>
                  {tr('from Hive.', '。')}
                </p>
                <p className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">
                  {project.path}
                </p>
                <p>{tr('Your files on disk will not be affected.', '磁盘上的文件不会受到影响。')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr('Cancel', '取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tr('Remove', '移除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Commits Dialog */}
      <AlertDialog open={noCommitsDialogOpen} onOpenChange={setNoCommitsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Initial Commit Required', '需要初始提交')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                'Creating a first commit with the initial state is required for adding worktrees.',
                '要添加工作树，需要先基于当前初始状态创建第一次提交。'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNoCommitsDialogOpen(false)}>
              {tr('OK', '确定')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
