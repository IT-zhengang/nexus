import { useState, useEffect, useMemo } from 'react'
import { Loader2, Search, GitBranch, GitPullRequest, Globe, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

interface BranchInfo {
  name: string
  isRemote: boolean
  isCheckedOut: boolean
  worktreePath?: string
}

interface PullRequestInfo {
  number: number
  title: string
  author: string
  headRefName: string
}

type TabValue = 'branches' | 'prs'

interface BranchPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectPath: string
  onSelect: (branchName: string, prNumber?: number) => void
}

export function BranchPickerDialog({
  open,
  onOpenChange,
  projectPath,
  onSelect
}: BranchPickerDialogProps): React.JSX.Element {
  const { tr } = useI18n()
  const [branches, setBranches] = useState<BranchInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<TabValue>('branches')
  const [prs, setPrs] = useState<PullRequestInfo[]>([])
  const [prsLoading, setPrsLoading] = useState(false)
  const [prsError, setPrsError] = useState<string | null>(null)

  // Fetch branches when dialog opens
  useEffect(() => {
    if (!open) {
      setFilter('')
      setActiveTab('branches')
      setPrs([])
      setPrsError(null)
      return
    }

    setLoading(true)
    setError(null)

    window.gitOps
      .listBranchesWithStatus(projectPath)
      .then((result) => {
        if (result.success) {
          setBranches(result.branches)
        } else {
          setError(result.error || tr('Failed to load branches', '加载分支失败'))
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : tr('Failed to load branches', '加载分支失败'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, projectPath, tr])

  // Fetch PRs when PRs tab is selected (lazy)
  useEffect(() => {
    if (!open || activeTab !== 'prs') return

    setPrsLoading(true)
    setPrsError(null)

    window.gitOps
      .listPRs(projectPath)
      .then((result) => {
        if (result.success) {
          setPrs(result.prs)
        } else {
          setPrsError(result.error || tr('Failed to load pull requests', '加载拉取请求失败'))
        }
      })
      .catch((err) => {
        setPrsError(err instanceof Error ? err.message : tr('Failed to load pull requests', '加载拉取请求失败'))
      })
      .finally(() => {
        setPrsLoading(false)
      })
  }, [open, projectPath, activeTab, tr])

  // Filter and sort branches
  const filteredBranches = useMemo(() => {
    const lowerFilter = filter.toLowerCase()
    const filtered = branches.filter((b) => b.name.toLowerCase().includes(lowerFilter))

    // Sort: local first, then remote; alphabetical within each group
    return filtered.sort((a, b) => {
      if (a.isRemote !== b.isRemote) return a.isRemote ? 1 : -1
      return a.name.localeCompare(b.name)
    })
  }, [branches, filter])

  // Filter PRs
  const filteredPRs = useMemo(() => {
    const lowerFilter = filter.toLowerCase()
    return prs.filter(
      (pr) =>
        pr.title.toLowerCase().includes(lowerFilter) ||
        pr.headRefName.toLowerCase().includes(lowerFilter) ||
        `#${pr.number}`.includes(lowerFilter)
    )
  }, [prs, filter])

  const handleSelect = (branch: BranchInfo): void => {
    onSelect(branch.name)
  }

  const handlePRSelect = (pr: PullRequestInfo): void => {
    onSelect(pr.headRefName, pr.number)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tr('New Workspace', '新建工作区')}</DialogTitle>
          <DialogDescription>
            {tr('Select a branch or pull request to create a new workspace from.', '选择一个分支或拉取请求来创建新的工作区。')}
          </DialogDescription>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 border-b">
          <button
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              activeTab === 'branches'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('branches')}
          >
            <GitBranch className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            {tr('Branches', '分支')}
          </button>
          <button
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              'border-b-2 -mb-px',
              activeTab === 'prs'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('prs')}
          >
            <GitPullRequest className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
            {tr('PRs', 'PR')}
          </button>
        </div>

        {/* Search/Filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === 'branches'
                ? tr('Filter branches...', '筛选分支...')
                : tr('Filter pull requests...', '筛选拉取请求...')
            }
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Branches List */}
        {activeTab === 'branches' && (
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{tr('Loading branches...', '正在加载分支...')}</span>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm text-destructive">{error}</div>
            ) : filteredBranches.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {filter
                  ? tr('No branches match your filter', '没有匹配筛选条件的分支')
                  : tr('No branches found', '未找到分支')}
              </div>
            ) : (
              <div className="py-1">
                {filteredBranches.map((branch) => (
                  <button
                    key={`${branch.name}-${branch.isRemote}`}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm text-left',
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                    )}
                    onClick={() => handleSelect(branch)}
                  >
                    <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{branch.name}</span>
                    {branch.isRemote && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground shrink-0">
                          <Globe className="h-2.5 w-2.5" />
                          {tr('remote', '远程')}
                        </span>
                    )}
                    {branch.isCheckedOut && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-primary/10 text-primary shrink-0">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {tr('active', '活动中')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRs List */}
        {activeTab === 'prs' && (
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {prsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{tr('Loading pull requests...', '正在加载拉取请求...')}</span>
              </div>
            ) : prsError ? (
              <div className="px-4 py-8 text-center text-sm text-destructive">{prsError}</div>
            ) : filteredPRs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {filter
                  ? tr('No pull requests match your filter', '没有匹配筛选条件的拉取请求')
                  : tr('No open pull requests', '没有打开的拉取请求')}
              </div>
            ) : (
              <div className="py-1">
                {filteredPRs.map((pr) => (
                  <button
                    key={pr.number}
                    className={cn(
                      'flex items-start gap-2 w-full px-3 py-2 text-sm text-left',
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none'
                    )}
                    onClick={() => handlePRSelect(pr)}
                  >
                    <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-muted-foreground shrink-0">
                          #{pr.number}
                        </span>
                        <span className="truncate">{pr.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground truncate">
                          {pr.author}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground max-w-[200px] truncate">
                          <GitBranch className="h-2.5 w-2.5 shrink-0" />
                          {pr.headRefName}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        {activeTab === 'branches' && !loading && !error && filteredBranches.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
            {filter && ` matching "${filter}"`}
          </p>
        )}
        {activeTab === 'prs' && !prsLoading && !prsError && filteredPRs.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {filteredPRs.length} pull request{filteredPRs.length !== 1 ? 's' : ''}
            {filter && ` matching "${filter}"`}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
