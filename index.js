const Client = require('./src/kaspa/client')
const Server = require('./src/stratum/server')

const interactions = require('./src/stratum/interactions')

const client = new Client('164.92.190.13:16110')

client.on('ready', () => {
  console.log(`Connected to Kaspa node, starting stratum...`)

  const server = new Server(6942)

  server.on('listening', () => {
    console.log(`Stratum server listening on ${server.server.address().port}`)
  })

  server.on('peer', (peer) => {
    console.log(peer)
  })
})