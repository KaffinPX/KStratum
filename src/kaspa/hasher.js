const blake2b = require('blakejs/blake2b')
const struct = require('python-struct')

module.exports = class Hasher {
  async serializeHeader (header, isPrePow) {
    const hasher = blake2b.blake2bInit(32, Buffer.from('BlockHash'))
    const nonce = isPrePow ? '0' : header.nonce
    const timestamp = isPrePow ? '0' : header.timestamp

    blake2b.blake2bUpdate(hasher, struct.pack('<HQ', header.version, header.parents.length))
    for (const parent of header.parents) {
      blake2b.blake2bUpdate(hasher, struct.pack('<Q', parent.parentHashes.length))
      for (const parentHash of parent.parentHashes) {
        blake2b.blake2bUpdate(hasher, Buffer.from(parentHash, 'hex'))
      }
    }
    blake2b.blake2bUpdate(hasher, Buffer.from(header.hashMerkleRoot, 'hex'))
    blake2b.blake2bUpdate(hasher, Buffer.from(header.acceptedIdMerkleRoot, 'hex'))
    blake2b.blake2bUpdate(hasher, Buffer.from(header.utxoCommitment, 'hex'))
    blake2b.blake2bUpdate(hasher, struct.pack('<QIQQQ', timestamp, header.bits, nonce, header.daaScore, header.blueScore))

    const blueWork = header.blueWork
    const parsedBluework = Buffer.from(blueWork.padStart(blueWork.length + blueWork.length % 2, '0'), 'hex')

    blake2b.blake2bUpdate(hasher, struct.pack('<Q', parsedBluework.length))
    blake2b.blake2bUpdate(hasher, parsedBluework)

    blake2b.blake2bUpdate(hasher, Buffer.from(header.pruningPoint, 'hex'))
    return Buffer.from(blake2b.blake2bFinal(hasher))
  }

  async serializeJobData (prePowHash) {
    const preHashU64s = []

    for (let i = 0; i < 4; i++) {
      const result = toLittle(
        prePowHash.slice(i * 8, i * 8 + 8)
      )
      preHashU64s.push(
        BigInt(`0x${result.toString('hex')}`)
      )
    }

    return preHashU64s
  }

  async calculateTarget (bits) {
    const unshiftedExpt = bits >> 24n
    let mant = bits & BigInt('0xFFFFFF')
    let expt

    if (unshiftedExpt <= 3n) {
      mant = mant >> (8n * (3n - unshiftedExpt))
      expt = 0n
    } else {
      expt = 8n * ((bits >> 24n) - 3n)
    }

    return mant << expt
  }
}

const toLittle = (buffer) => {
  return Buffer.from([...buffer].reverse())
}
