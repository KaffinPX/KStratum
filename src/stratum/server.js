const net = require('net')
const events = require('events')

const Peer = require('./peer')

module.exports = class stratumServer extends events.EventEmitter {
  constructor (port, listenAddress) {
    super()

    this.server = net.createServer()

    this.server.on('connection', (socket) => this.handleConnection(socket))
    this.server.on('listening', () => this.emit('listening'))
    this.server.on('error', (err) => this.emit('error', err))

    this.server.listen(port, listenAddress)
  }

  handleConnection (socket) {
    this.emit('peer', new Peer(socket))
  }
}
