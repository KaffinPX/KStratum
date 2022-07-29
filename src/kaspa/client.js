const events = require('events')

const kaspajs = require('kaspajs')

module.exports = class kaspaClient extends events.EventEmitter {
  constructor (nodeAddress) {
    super()

    this.kaspa = new kaspajs.Node(nodeAddress, () => process.nextTick(() => this.handleReady()))
  }

  async handleReady () {
    this.emit('ready')
  }
}
