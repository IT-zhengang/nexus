import { createElement } from 'react'
import { toast as sonnerToast, ExternalToast } from 'sonner'
import { CheckCircle2, XCircle, Info as InfoIcon, AlertTriangle } from 'lucide-react'
import { translateText } from '@/i18n/useI18n'

type ToastOptions = ExternalToast & {
  retry?: () => void | Promise<void>
}

/**
 * Enhanced toast notifications with consistent patterns
 */
export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions): string | number => {
    return sonnerToast.success(message, {
      duration: 3000,
      icon: createElement(CheckCircle2, { className: 'h-4 w-4 text-green-500' }),
      ...options
    })
  },

  /**
   * Show an error toast with optional retry action
   */
  error: (message: string, options?: ToastOptions): string | number => {
    const { retry, ...rest } = options || {}

    return sonnerToast.error(message, {
      duration: 5000,
      icon: createElement(XCircle, { className: 'h-4 w-4 text-red-500' }),
      ...rest,
      ...(retry && {
        action: {
          label: translateText('Retry', '重试'),
          onClick: retry
        }
      })
    })
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions): string | number => {
    return sonnerToast.warning(message, {
      duration: 4000,
      icon: createElement(AlertTriangle, { className: 'h-4 w-4 text-amber-500' }),
      ...options
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions): string | number => {
    return sonnerToast.info(message, {
      duration: 3000,
      icon: createElement(InfoIcon, { className: 'h-4 w-4 text-blue-500' }),
      ...options
    })
  },

  /**
   * Show a loading toast (returns a function to update/dismiss it)
   */
  loading: (message: string, options?: ToastOptions): string | number => {
    return sonnerToast.loading(message, {
      duration: Infinity,
      ...options
    })
  },

  /**
   * Show a promise toast that handles loading/success/error states
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    },
    options?: ToastOptions
  ): Promise<T> => {
    return sonnerToast.promise(promise, messages, options)
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number): void => {
    sonnerToast.dismiss(toastId)
  },

  /**
   * Custom toast with full control
   */
  custom: (
    message: string,
    options?: ToastOptions & {
      icon?: React.ReactNode
    }
  ): string | number => {
    return sonnerToast(message, options)
  }
}

/**
 * Show an operation result toast
 * Automatically shows success or error based on result
 */
export function showResultToast(
  result: { success: boolean; error?: string },
  successMessage: string,
  options?: {
    retry?: () => void | Promise<void>
    errorPrefix?: string
  }
): void {
  if (result.success) {
    toast.success(successMessage)
  } else {
    const errorMessage = options?.errorPrefix
      ? `${options.errorPrefix}: ${result.error || translateText('Unknown error', '未知错误')}`
      : result.error || translateText('An error occurred', '发生错误')
    toast.error(errorMessage, { retry: options?.retry })
  }
}

/**
 * Toast for Git operations
 */
export const gitToast = {
  worktreeCreated: (name: string): string | number => {
    return toast.success(translateText(`Worktree "${name}" created successfully`, `工作树"${name}"创建成功`))
  },

  worktreeArchived: (name: string): string | number => {
    return toast.success(translateText(`Worktree "${name}" archived and branch deleted`, `工作树"${name}"已归档并删除分支`))
  },

  worktreeUnbranched: (name: string): string | number => {
    return toast.success(translateText(`Worktree "${name}" removed (branch preserved)`, `工作树"${name}"已移除（保留分支）`))
  },

  operationFailed: (operation: string, error?: string, retry?: () => void): string | number => {
    return toast.error(
      error
        ? translateText(`Failed to ${operation}: ${error}`, `${operation}失败：${error}`)
        : translateText(`Failed to ${operation}`, `${operation}失败`),
      {
      retry
    })
  }
}

/**
 * Toast for project operations
 */
export const projectToast = {
  added: (name: string): string | number => {
    return toast.success(translateText(`Project "${name}" added successfully`, `项目"${name}"添加成功`))
  },

  removed: (name: string): string | number => {
    return toast.success(translateText(`Project "${name}" removed from Hive`, `项目"${name}"已从 Hive 移除`))
  },

  renamed: (name: string): string | number => {
    return toast.success(translateText(`Project renamed to "${name}"`, `项目已重命名为"${name}"`))
  },

  validationError: (error: string): string | number => {
    return toast.error(error)
  }
}

/**
 * Toast for clipboard operations
 */
export const clipboardToast = {
  copied: (what: string = translateText('Content', '内容')): string | number => {
    return toast.success(translateText(`${what} copied to clipboard`, `${what}已复制到剪贴板`))
  },

  failed: (): string | number => {
    return toast.error(translateText('Failed to copy to clipboard', '复制到剪贴板失败'))
  }
}

/**
 * Toast for session operations
 */
export const sessionToast = {
  created: (): string | number => {
    return toast.success(translateText('New session created', '新会话已创建'))
  },

  loaded: (name?: string): string | number => {
    return toast.success(
      name
        ? translateText(`Loaded session "${name}"`, `已加载会话"${name}"`)
        : translateText('Session loaded', '会话已加载')
    )
  },

  closed: (): string | number => {
    return toast.info(translateText('Session closed', '会话已关闭'))
  },

  error: (error: string, retry?: () => void): string | number => {
    return toast.error(error, { retry })
  },

  archived: (): string | number => {
    return toast.info(translateText('This session is from an archived worktree. Opening in read-only mode.', '此会话来自已归档的工作树。将以只读模式打开。'))
  }
}

export default toast
