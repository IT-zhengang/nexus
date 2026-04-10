import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { useI18n } from '@/i18n'

interface ErrorFallbackProps {
  error?: Error | null
  resetError?: () => void
  title?: string
  message?: string
  compact?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  message,
  compact = false
}: ErrorFallbackProps): JSX.Element {
  const { tr } = useI18n()
  const resolvedTitle =
    title === 'Something went wrong' ? tr('Something went wrong', '出现了一些问题') : title
  const errorMessage = message || error?.message || tr('An unexpected error occurred', '发生了一个意外错误')

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-muted-foreground flex-1 truncate">{errorMessage}</span>
        {resetError && (
          <Button variant="ghost" size="sm" onClick={resetError} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
      <h3 className="font-medium mb-1">{resolvedTitle}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{errorMessage}</p>
      {resetError && (
        <Button variant="outline" size="sm" onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {tr('Try Again', '重试')}
        </Button>
      )}
    </div>
  )
}

export default ErrorFallback
