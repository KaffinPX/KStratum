const net = require('net')
const events = require('events')

const Worker = require('./worker')

module.exports = class stratumServer extends events.EventEmitter {
  constructor (port, listenAddress) {
    super()

    this.server = net.createServer()

    this.server.on('connection', (socket) => this._handleConnection(socket))
    this.server.on('listening', () => this.emit('listening'))
    this.server.on('error', (err) => this.emit('error', err))

    this.server.listen(port, listenAddress)
  }

  async _handleConnection (socket) {
    this.emit('worker', new Worker(socket))
  }
}
