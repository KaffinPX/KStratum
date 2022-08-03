const events = require('events')

const kaspajs = require('kaspajs')

module.exports = class kaspaClient extends events.EventEmitter {
  constructor (nodeAddress) {
    super()

    this.kaspa = new kaspajs.Daemon(nodeAddress, () => this.handleReady())

    this.kaspa.on('reconnect', () => {
      console.log('Reconnected to Kaspa node!')
    })

    this.kaspa.on('err', console.error)

    this.kaspa.on('end', () => {
      console.info('Disconnected from Kaspa node, trying to reconnect...')
    })
  }

  async handleReady () {
    this.emit('ready')
    await this.listenTemplates()
  }

  async listenTemplates () {
    this.kaspa.subscribe('notifyNewBlockTemplateRequest', {}, () => {
      this.emit('newTemplate')
    })
  }
}
