import { createServer } from 'node:net'
import { execSync } from 'node:child_process'
import { readCollabConfig } from './config.js'
import { createCollaborationServer } from './server.js'

const config = readCollabConfig()
await assertPortAvailable(config.port)

const server = createCollaborationServer(config)

await server.listen()

console.log(
  `[collab] listening on ws://${config.host}:${config.port} using minimal Hocuspocus runtime`,
)

async function assertPortAvailable(port: number) {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer()

    probe.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        const ownerPid = findPortOwnerPid(port)
        reject(
          new Error(
            [
              `[collab] port ${port} is already in use.`,
              ownerPid ? `PID ${ownerPid} is listening on it.` : '',
              'A collab server is probably already running.',
              `Stop the old process or change PORT in apps/collab/.env before starting another one.`,
            ].join(' '),
          ),
        )
        return
      }

      reject(error)
    })

    probe.listen(port, () => {
      probe.close((closeError) => {
        if (closeError) {
          reject(closeError)
          return
        }

        resolve()
      })
    })
  })
}

function findPortOwnerPid(port: number) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(
        `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`,
        { stdio: ['ignore', 'pipe', 'ignore'] },
      )
        .toString()
        .trim()

      return output || null
    }

    const output = execSync(`lsof -ti tcp:${port}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()

    return output.split('\n')[0] || null
  } catch {
    return null
  }
}
