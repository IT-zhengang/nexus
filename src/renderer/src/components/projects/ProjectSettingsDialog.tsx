import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { ImageIcon, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useProjectStore } from '@/stores'
import { LanguageIcon } from './LanguageIcon'
import { useI18n } from '@/i18n'

interface Project {
  id: string
  name: string
  path: string
  language: string | null
  custom_icon: string | null
  detected_icon: string | null
  setup_script: string | null
  run_script: string | null
  archive_script: string | null
  auto_assign_port: boolean
}

interface ProjectSettingsDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange
}: ProjectSettingsDialogProps): React.JSX.Element {
  const { tr } = useI18n()
  const { updateProject } = useProjectStore()

  const [setupScript, setSetupScript] = useState('')
  const [runScript, setRunScript] = useState('')
  const [archiveScript, setArchiveScript] = useState('')
  const [customIcon, setCustomIcon] = useState<string | null>(null)
  const [autoAssignPort, setAutoAssignPort] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickingIcon, setPickingIcon] = useState(false)

  // Load current values when dialog opens
  useEffect(() => {
    if (open) {
      setSetupScript(project.setup_script ?? '')
      setRunScript(project.run_script ?? '')
      setArchiveScript(project.archive_script ?? '')
      setCustomIcon(project.custom_icon ?? null)
      setAutoAssignPort(project.auto_assign_port ?? false)
    }
  }, [
    open,
    project.setup_script,
    project.run_script,
    project.archive_script,
    project.custom_icon,
    project.auto_assign_port
  ])

  const handlePickIcon = async (): Promise<void> => {
    setPickingIcon(true)
    try {
      const result = await window.projectOps.pickProjectIcon(project.id)
      if (result.success && result.filename) {
        setCustomIcon(result.filename)
      }
      // If cancelled, do nothing
    } catch {
      toast.error(tr('Failed to pick icon', '选择图标失败'))
    } finally {
      setPickingIcon(false)
    }
  }

  const handleClearIcon = async (): Promise<void> => {
    try {
      await window.projectOps.removeProjectIcon(project.id)
      setCustomIcon(null)
    } catch {
      toast.error(tr('Failed to remove icon', '移除图标失败'))
    }
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const success = await updateProject(project.id, {
        setup_script: setupScript.trim() || null,
        run_script: runScript.trim() || null,
        archive_script: archiveScript.trim() || null,
        custom_icon: customIcon,
        auto_assign_port: autoAssignPort
      })
      if (success) {
        toast.success(tr('Project settings saved', '项目设置已保存'))
        onOpenChange(false)
      } else {
        toast.error(tr('Failed to save project settings', '保存项目设置失败'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tr('Project Settings', '项目设置')}</DialogTitle>
          <DialogDescription className="text-xs truncate">{project.path}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Project Icon */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tr('Project Icon', '项目图标')}</label>
            <p className="text-xs text-muted-foreground">
              {tr(
                'Custom icon displayed in the sidebar. Supports SVG, PNG, JPG, and WebP.',
                '显示在侧边栏中的自定义图标，支持 SVG、PNG、JPG 和 WebP。'
              )}
            </p>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-muted/30">
                <LanguageIcon
                  language={project.language}
                  customIcon={customIcon}
                  detectedIcon={project.detected_icon}
                  className="h-5 w-5 text-muted-foreground shrink-0"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handlePickIcon}
                  disabled={pickingIcon}
                >
                  <ImageIcon className="h-3 w-3 mr-1.5" />
                  {pickingIcon ? tr('Picking...', '选择中...') : tr('Change', '更改')}
                </Button>
                {customIcon && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleClearIcon}
                  >
                    <X className="h-3 w-3 mr-1.5" />
                    {tr('Clear', '清除')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Auto Port Assignment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{tr('Auto-assign Port', '自动分配端口')}</label>
                <p className="text-xs text-muted-foreground">
                  {tr(
                    'Assign a unique port to each worktree and inject PORT into run/setup scripts. Ports start at 3011.',
                    '为每个工作树分配唯一端口，并将 PORT 注入到运行/初始化脚本中。端口从 3011 开始。'
                  )}
                </p>
              </div>
              <Switch checked={autoAssignPort} onCheckedChange={setAutoAssignPort} />
            </div>
          </div>

          {/* Setup Script */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tr('Setup Script', '初始化脚本')}</label>
            <p className="text-xs text-muted-foreground">
              {tr(
                'Commands to run when a new worktree is initialized. Each line is a separate command.',
                '新工作树初始化时执行的命令。每一行代表一条独立命令。'
              )}
            </p>
            <Textarea
              value={setupScript}
              onChange={(e) => setSetupScript(e.target.value)}
              placeholder={'pnpm install\npnpm run build'}
              rows={4}
              className="font-mono text-sm resize-y"
            />
          </div>

          {/* Run Script */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tr('Run Script', '运行脚本')}</label>
            <p className="text-xs text-muted-foreground">
              {tr(
                "Commands triggered by \u2318R. Press \u2318R again while running to stop.",
                '\u2318R 触发的命令。运行过程中再次按 \u2318R 可停止。'
              )}
            </p>
            <Textarea
              value={runScript}
              onChange={(e) => setRunScript(e.target.value)}
              placeholder={'pnpm run dev'}
              rows={4}
              className="font-mono text-sm resize-y"
            />
          </div>

          {/* Archive Script */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{tr('Archive Script', '归档脚本')}</label>
            <p className="text-xs text-muted-foreground">
              {tr(
                "Commands to run before worktree archival. Failures won't block archival.",
                '工作树归档前执行的命令。执行失败不会阻止归档。'
              )}
            </p>
            <Textarea
              value={archiveScript}
              onChange={(e) => setArchiveScript(e.target.value)}
              placeholder={'pnpm run clean'}
              rows={4}
              className="font-mono text-sm resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tr('Cancel', '取消')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? tr('Saving...', '保存中...') : tr('Save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
