import { readCollabConfig } from './config.js'
import { createCollaborationServer } from './server.js'

const config = readCollabConfig()
const server = createCollaborationServer(config)

await server.listen()

console.log(
  `[collab] listening on ws://${config.host}:${config.port} using minimal Hocuspocus runtime`,
)
