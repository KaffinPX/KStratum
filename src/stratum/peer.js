const events = require('events')

module.exports = class Peer extends events.EventEmitter {
  constructor (socket) {
    super()

    this._socket = socket

    this.sentInteractionCount = 0
    this.onGoingData = ""

    this._socket.on('data', (data) => this.handleStream(data))
    this._socket.on('error', (err) => (err))
  }

  sendInteraction (interaction) {
    const jsonInteraction = interaction.toJSON()

    if (typeof jsonInteraction.id === 'undefined') {
      this.sentInteractionCount += 1
      jsonInteraction.id = this.sentInteractionCount
    }

    this._socket.write(JSON.stringify(jsonInteraction))
  }

  parseInteraction (data) {
    const interaction = JSON.parse(data)
    
    interaction.method = interaction.method.replace('mining.', '')

    return interaction
  }
  
  handleStream (data) {
    this.onGoingData += data.toString()

    if (this.onGoingData.includes('}')) {
      const splittedData = this.onGoingData.split('{')

      splittedData.forEach((interaction) => {
        if (!interaction.includes('}')) return this.onGoingData = interaction

        try {
          this.emit('interaction', this.parseInteraction('{' + interaction))
        } catch (err) { this._socket.end('INVALID_INTERACTION') }
      })

      this.onGoingData = this.onGoingData.split('}')?.[1] ?? ""
    }
  }
}