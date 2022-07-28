const events = require('events')

const kaspajs = require('kaspajs')

module.exports = class kaspaClient extends events.EventEmitter {
  constructor (nodeAddress) {
    super()

    this.kaspa = new kaspajs.Node(nodeAddress, () => this.emit('ready'))
  }
}