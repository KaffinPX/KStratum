const events = require('events')

module.exports = class Worker extends events.EventEmitter {
  constructor (socket) {
    super()

    this._socket = socket

    this.sentInteractions = 0
    this.cachedBytes = []

    this._socket.on('data', (data) => this._handleStream(data))
    this._socket.on('error', (err) => (err))
    this._socket.on('end', () => this.emit('end'))
  }

  async sendInteraction (interaction) {
    const jsonInteraction = interaction.toJSON()

    if (typeof jsonInteraction.id === 'undefined') {
      this.sentInteractions += 1
      jsonInteraction.id = this.sentInteractions
    }

    let interactionCall = JSON.stringify(jsonInteraction)

    if (typeof interaction.jobId !== 'undefined') {
      interactionCall = interactionCall.replace(`"${interaction.job[0]}"`, interaction.job[0])
      interactionCall = interactionCall.replace(`"${interaction.job[1]}"`, interaction.job[1])
      interactionCall = interactionCall.replace(`"${interaction.job[2]}"`, interaction.job[2])
      interactionCall = interactionCall.replace(`"${interaction.job[3]}"`, interaction.job[3])
      interactionCall = interactionCall.replace(`"${interaction.timestamp}"`, interaction.timestamp)
    }

    this._socket.write(interactionCall + '\n')
  }

  async _handleStream (data) {
    for (const byte of data) {
      if (byte === 0x0a) {
        const interaction = Buffer.from(this.cachedBytes)

        await this._handleMessage(interaction)

        this.cachedBytes = []
      } else {
        this.cachedBytes.push(byte)

        if (this.cachedBytes.length > 512) {
          this._socket.end('INVALID_INTERACTION_SIZE')
        }
      }
    }
  }

  async _handleMessage (buffer) {
    let interaction = buffer.toString()

    interaction = await this._parseInteraction(interaction).catch(() => { this._socket.end('INVALID_INTERACTION') })

    this.emit('interaction', interaction)
  }

  async _parseInteraction (data) {
    const interaction = JSON.parse(data)

    interaction.method = interaction.method.replace('mining.', '')

    return interaction
  }
}
