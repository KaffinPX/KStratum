class SetExtranonce {
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

class SetDifficulty {
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
  constructor (interactionId) {
    this.interactionId = interactionId
  }

  toJSON () {
    return {
      id: this.interactionId,
      result: true
    }
  }
}

class ErrorAnswer {
  constructor (interactionId, error) {
    this.interactionId = interactionId
    this.error = error
  }

  toJSON () {
    return {
      id: this.interactionId,
      result: null,
      error: this.error
    }
  }
}

module.exports = {
  errors: {
    "UNKNOWN": [20, 'Unknown problem', null],
    "JOB_NOT_FOUND": [21, 'Job not found', null],
    "DUPLICATE_SHARE": [22, 'Duplicate share submitted', null],
    "LOW_DIFFICULTY_SHARE": [23, 'Invalid difficulty', null],
    "UNAUTHORIZED_WORKER": [24, 'Unauthorized', null],
    "NOT_SUBSCRIBED": [25, 'Not subscribed', null],
  },
  SetExtranonce,
  SetDifficulty,
  Notify,
  Answer,
  ErrorAnswer
}
