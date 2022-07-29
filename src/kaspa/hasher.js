const blake2b = require('blakejs/blake2b')
const struct = require('python-struct')

module.exports = class Hasher {
  serializeHeader (header, isPrePow) {
    const hasher = blake2b.blake2bInit(32, Buffer.from('BlockHash'))
    const nonce = isPrePow ? 0 : header.nonce
    const timestamp = isPrePow ? 0 : header.timestamp

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

    const blue_work = Buffer.from(header.blueWork, 'hex')

    blake2b.blake2bUpdate(hasher, struct.pack('<Q', blue_work.length))
    blake2b.blake2bUpdate(hasher, blue_work)

    blake2b.blake2bUpdate(hasher, Buffer.from(header.pruningPoint, 'hex'))
    return blake2b.blake2bFinal(hasher)
  }

  serializeJobData (serialized_header) {
    const context = blake2b.blake2bInit(32, Buffer.from('BlockHash'))
    blake2b.blake2bUpdate(context, serialized_header)
    const pre_hash = Buffer.from(blake2b.blake2bFinal(context))

    const pre_hash_uints64 = []

    for (let i = 0; i < 4; i++) {
      const result = to_little(
        pre_hash.slice(i * 8, i * 8 + 8)
      )
      pre_hash_uints64.push(
        BigInt(`0x${result.toString('hex')}`)
      )
    }

    return pre_hash_uints64
  }
}

function to_little (buff) {
  return Buffer.from([...buff].reverse())
}
