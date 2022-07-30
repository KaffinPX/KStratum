const events = require('events')

module.exports = class Peer extends events.EventEmitter {
  constructor (socket) {
    super()

    this._socket = socket

    this.sentInteractionCount = 0
    this.onGoingData = ''

    this._socket.on('data', (data) => this.handleStream(data))
    this._socket.on('error', (err) => (err))
  }

  sendInteraction (interaction) {
    const jsonInteraction = interaction.toJSON()

    if (typeof jsonInteraction.id === 'undefined') {
      this.sentInteractionCount += 1
      jsonInteraction.id = this.sentInteractionCount
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
        } catch (err) {
          console.error(err)
          this._socket.end('INVALID_INTERACTION')
        }
      })

      const e = this.onGoingData.split('}')
      this.onGoingData = e && e[1] || ''
    }
  }
}
