const net = require('net')
const events = require('events')

const Peer = require('./peer')

module.exports = class stratumServer extends events.EventEmitter {
  constructor (port) {
    super()

    this.server = net.createServer()

    this.server.on('connection', this.handleConnection)
    this.server.on('listening', () => this.emit('listening'))

    this.server.listen(port, '127.0.0.1')
  }

  handleConnection (socket) {
    this.emit('peer', new Peer(socket))
  }
}