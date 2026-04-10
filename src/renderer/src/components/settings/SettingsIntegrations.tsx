import { useState, useEffect } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { toast } from 'sonner'
import { saveProviderSettingsToDatabase, loadProviderSettingsFromDatabase } from '@/lib/provider-settings'
import { useI18n } from '@/i18n'

interface ProviderInfo {
  id: string
  name: string
  icon: string
}

interface SettingsFieldDef {
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
}

export function SettingsIntegrations() {
  const { tr } = useI18n()
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [schemas, setSchemas] = useState<Record<string, SettingsFieldDef[]>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({})

  useEffect(() => {
    window.ticketImport.listProviders().then(async (provs) => {
      setProviders(provs)
      const schemaMap: Record<string, SettingsFieldDef[]> = {}
      for (const p of provs) {
        schemaMap[p.id] = await window.ticketImport.getSettingsSchema(p.id)
      }
      setSchemas(schemaMap)

      // Load saved values from dedicated provider-settings key (fast initial read)
      const saved: Record<string, string> = {}
      try {
        const raw = localStorage.getItem('hive-provider-settings')
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, string>
          for (const fields of Object.values(schemaMap)) {
            for (const field of fields) {
              const val = parsed[field.key]
              if (typeof val === 'string') saved[field.key] = val
            }
          }
          setValues(saved)
        }
      } catch {
        // ignore
      }

      // Load from database (source of truth) and merge — DB wins over localStorage
      try {
        const dbSettings = await loadProviderSettingsFromDatabase()
        if (dbSettings) {
          const merged = { ...saved }
          for (const fields of Object.values(schemaMap)) {
            for (const field of fields) {
              const dbVal = dbSettings[field.key]
              if (typeof dbVal === 'string') merged[field.key] = dbVal
            }
          }
          setValues(merged)
          // Sync localStorage from database so getProviderSettings() stays current
          localStorage.setItem('hive-provider-settings', JSON.stringify(merged))
        } else if (Object.keys(saved).length > 0) {
          // No DB values yet — seed the database from localStorage
          await saveProviderSettingsToDatabase(saved)
        }
      } catch {
        // ignore — localStorage values are already loaded
      }
    })
  }, [])

  const handleFieldChange = (key: string, value: string) => {
    setValues((prev) => {
      const updated = { ...prev, [key]: value }

      // Persist to dedicated localStorage key (separate from Zustand's hive-settings)
      try {
        localStorage.setItem('hive-provider-settings', JSON.stringify(updated))
      } catch {
        // ignore
      }

      // Persist to SQLite database (durable source of truth)
      saveProviderSettingsToDatabase(updated)

      return updated
    })
    setTestResult({})
  }

  const handleTest = async (providerId: string) => {
    setTesting(providerId)
    setTestResult((prev) => ({ ...prev, [providerId]: null }))

    try {
      const providerSettings: Record<string, string> = {}
      const fields = schemas[providerId] ?? []
      for (const f of fields) {
        if (values[f.key]) providerSettings[f.key] = values[f.key]
      }

      const result = await window.ticketImport.authenticate(providerId, providerSettings)
      setTestResult((prev) => ({ ...prev, [providerId]: result.success }))
      if (result.success) {
        toast.success(
          `${providers.find((p) => p.id === providerId)?.name}: ${tr('Connected!', '已连接！')}`
        )
      } else {
        toast.error(result.error ?? tr('Authentication failed', '认证失败'))
      }
    } catch (err) {
      setTestResult((prev) => ({ ...prev, [providerId]: false }))
      toast.error(
        `${tr('Test failed:', '测试失败：')} ${err instanceof Error ? err.message : String(err)}`
      )
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">{tr('Integrations', '集成')}</h3>
        <p className="text-xs text-muted-foreground">
          {tr(
            'Configure connections to external platforms for ticket import.',
            '配置外部平台连接，用于导入工单。'
          )}
        </p>
      </div>

      {providers.map((provider) => {
        const fields = schemas[provider.id] ?? []
        const result = testResult[provider.id]

        return (
          <div key={provider.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ProviderIcon provider={provider.icon} size="md" />
                <h4 className="text-sm font-medium">{provider.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                {result === true && <Check className="h-4 w-4 text-green-500" />}
                {result === false && <X className="h-4 w-4 text-red-500" />}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={testing !== null}
                  onClick={() => handleTest(provider.id)}
                >
                  {testing === provider.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {tr('Test connection', '测试连接')}
                </Button>
              </div>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {tr(
                  'No configuration needed. Uses GitHub CLI authentication by default.',
                  '无需额外配置。默认使用 GitHub CLI 认证。'
                )}
              </p>
            ) : (
              fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                    {!field.required && (
                      <span className="text-muted-foreground/50 ml-1">
                        ({tr('optional', '可选')})
                      </span>
                    )}
                  </label>
                  <Input
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="text-sm h-8"
                  />
                </div>
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}
