import { detectTransportMode } from './detect'
import { getWebAuth } from './graphql/auth'
import { initGraphQLClient } from './graphql/client'
import { createDbAdapter } from './graphql/adapters/db'
import { createOpenCodeOpsAdapter } from './graphql/adapters/opencode-ops'
import { createGitOpsAdapter } from './graphql/adapters/git-ops'
import { createFileTreeOpsAdapter } from './graphql/adapters/file-tree-ops'

export interface TransportResult {
  mode: 'electron' | 'web'
  needsAuth: boolean
}

export function installTransport(): TransportResult {
  const mode = detectTransportMode()
  if (mode === 'electron') return { mode, needsAuth: false }

  const auth = getWebAuth()
  if (!auth) return { mode, needsAuth: true }

  // Derive WebSocket URL from HTTP URL
  const wsUrl = auth.serverUrl.replace(/^http/, 'ws') + '/graphql'
  const httpUrl = auth.serverUrl + '/graphql'

  initGraphQLClient({ httpUrl, wsUrl, apiKey: auth.apiKey })

  // Install core adapters
  window.db = createDbAdapter()
  window.opencodeOps = createOpenCodeOpsAdapter()
  window.gitOps = createGitOpsAdapter()
  window.fileTreeOps = createFileTreeOpsAdapter()

  // Remaining adapters will be installed in Session 4
  return { mode, needsAuth: false }
}
