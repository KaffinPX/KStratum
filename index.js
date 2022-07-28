const Server = require('./src/stratum/server')
const interactions = require('./src/stratum/interactions')

const server = new Server(6942)

server.on('listening', () => {
  console.log(`Stratum server listening on ${server.server.address().port}`)
})