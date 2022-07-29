class setExtranonce {
  constructor (nonce) {
    this.nonce = nonce
    this.reservedBytes = 6
  }

  toJSON () {
    return {
      method: 'set_extranonce',
      params: [this.nonce, this.reservedBytes]
    }
  }
}

class setDifficulty {
  constructor (difficulty) {
    this.difficulty = difficulty
  }

  toJSON () {
    return {
      method: 'mining.set_difficulty',
      params: [this.difficulty]
    }
  }
}

class Notify {
  constructor (jobId, job, timestamp) {
    this.jobId = jobId
    this.job = job
    this.timestamp = timestamp
  }

  toJSON () {
    return {
      method: 'mining.notify',
      params: [this.jobId, this.job, this.timestamp]
    }
  }
}

class Answer {
  constructor (interactionId, answer) {
    this.interactionId = interactionId
    this.answer = answer
  }

  toJSON () {
    return {
      id: this.interactionId,
      result: this.answer
    }
  }
}

module.exports = {
  setExtranonce,
  setDifficulty,
  Notify,
  Answer
}
