import { useState, useCallback, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveWebAuth } from '@/transport/graphql/auth'
import { useI18n } from '@/i18n'

interface WebAuthScreenProps {
  onAuthenticated: () => void
}

type ErrorKind = 'invalid-key' | 'unreachable' | 'rate-limited' | 'unknown'

function errorMessage(kind: ErrorKind, tr: (english: string, chinese: string) => string): string {
  switch (kind) {
    case 'invalid-key':
      return tr('Invalid API key. Check the key and try again.', 'API Key 无效，请检查后重试。')
    case 'unreachable':
      return tr(
        'Server unreachable. Check the URL and make sure the server is running.',
        '服务器不可达，请检查 URL 并确认服务器已启动。'
      )
    case 'rate-limited':
      return tr('Too many attempts. Please wait a moment and try again.', '尝试次数过多，请稍后再试。')
    case 'unknown':
      return tr('An unexpected error occurred. Please try again.', '发生了未知错误，请重试。')
  }
}

export default function WebAuthScreen({ onAuthenticated }: WebAuthScreenProps) {
  const { tr } = useI18n()
  const [serverUrl, setServerUrl] = useState(() => window.location.origin)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<ErrorKind | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      const url = serverUrl.replace(/\/+$/, '')

      try {
        const res = await fetch(`${url}/api/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ apiKey })
        })

        if (res.ok) {
          saveWebAuth({ serverUrl: url, apiKey })
          onAuthenticated()
          return
        }

        if (res.status === 401 || res.status === 403) {
          setError('invalid-key')
        } else if (res.status === 429) {
          setError('rate-limited')
        } else {
          setError('unknown')
        }
      } catch {
        setError('unreachable')
      } finally {
        setLoading(false)
      }
    },
    [serverUrl, apiKey, onAuthenticated]
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h1 className="mb-1 text-xl font-semibold text-foreground">Hive</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {tr('Connect to your headless server', '连接到你的无界面服务器')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="server-url" className="text-sm font-medium text-foreground">
              {tr('Server URL', '服务器地址')}
            </label>
            <Input
              id="server-url"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={tr('https://your-server:8443', 'https://你的服务器:8443')}
              required
              autoComplete="url"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-key" className="text-sm font-medium text-foreground">
              {tr('API Key', 'API Key')}
            </label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={tr('Enter your API key', '输入你的 API Key')}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{errorMessage(error, tr)}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !apiKey.trim()}>
            {loading ? tr('Connecting...', '连接中...') : tr('Connect', '连接')}
          </Button>
        </form>
      </div>
    </div>
  )
}
