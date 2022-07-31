#!/usr/bin/env node
const Operator = require('./src/operator')
const Client = require('./src/kaspa/client')
const Hasher = require('./src/kaspa/hasher')
const Server = require('./src/stratum/server')

const interactions = require('./src/stratum/interactions')

const operator = new Operator(process.argv)

console.log(`Running KStratum for \x1b[33m${operator.address}\x1b[0m`)
console.info(`Connecting to node \x1b[33m${operator.node}\x1b[0m`)

const client = new Client(operator.node)
const hasher = new Hasher()

const peers = new Set()

client.on('ready', () => {
  console.log('Connected to Kaspa node, starting stratum...')

  const server = new Server(operator.port, operator.listenAddress)

  server.on('listening', () => {
    console.log(`Stratum server listening on \x1b[33m${server.server.address().address}:${server.server.address().port}\x1b[0m`)
  })

  server.on('error', (err) => {
    if (err.code === 'EACCES') {
      console.error(`Failed to listen to port ${err.address}:${err.port}`)
      console.error(err.message)
    } else {
      console.error(err)
    }
    process.exit(1)
  })

  const jobs = new Map()
  let lastDifficulty = 10

  server.on('peer', (peer) => {
    peer.on('interaction', (interaction) => {
      if (interaction.method === 'subscribe') {
        peers.add(peer)
      } else if (interaction.method === 'authorize') {
        peer.sendInteraction(new interactions.setExtranonce((require('crypto')).randomBytes(2).toString('hex')))
        peer.sendInteraction(new interactions.setDifficulty(lastDifficulty))
        peer.sendInteraction(new interactions.Answer(interaction.id, true))
      } else if (interaction.method === 'submit') {
        const block = jobs.get(Number(interaction.params[1]))
        if (typeof block === 'undefined') return peer.sendInteraction(new interactions.Answer(interaction.id, false))

        block.header.nonce = BigInt(interaction.params[2]).toString()

        client.kaspa.request('submitBlockRequest', {
          block,
          allowNonDAABlocks: false
        }).then(result => {
          if (result.rejectReason !== 'NONE') return peer.sendInteraction(new interactions.Answer(interaction.id, false))

          const hash = hasher.serializeHeader(block.header, false)
          let blockReward = 0n
          block.transactions[0].outputs.forEach(output => {
            blockReward += BigInt(output.amount)
          })
          
          console.log(`Accepted block \x1b[33m${hash.toString('hex')}\x1b[0m, mined \x1b[33m${blockReward / BigInt(1e8)}\x1b[0m KAS!`)

          peer.sendInteraction(new interactions.Answer(interaction.id, true))
        }).catch(err => {
          console.error(err)
          peer.sendInteraction(new interactions.Answer(interaction.id, false))
        })
      }
    })
  })

  const isSeenTemplate = new Set()

  client.kaspa.subscribe('notifyBlockAddedRequest', {}, async (block) => {
    const blockTemplate = await client.kaspa.request('getBlockTemplateRequest', {
      payAddress: operator.address,
      extraData: 'KStratum: Coded by KaffinPX & jwj & Not Thomiz'
    })

    if (!blockTemplate.isSynced) { console.error(`Node is not synced.`); process.exit(1) }

    const header = hasher.serializeHeader(blockTemplate.block.header, true)

    if (isSeenTemplate.has(header)) return

    isSeenTemplate.add(header)
    setTimeout(() => { isSeenTemplate.delete(header) }, 10 * 1000)

    const job = hasher.serializeJobData(header)
    const lastJob = Array.from(jobs.entries()).pop()
    let jobId = (lastJob && lastJob[0] || 0) + 1

    if (jobId >= 99) { jobs.clear(); jobId = 1 }

    jobs.set(jobId, blockTemplate.block)

    const difficulty =  2 ** 31 / block.block.header.bits
    
    if (lastDifficulty !== difficulty) {
      lastDifficulty = difficulty

      peers.forEach(peer => {
        peer.sendInteraction(new interactions.setDifficulty(lastDifficulty))
      })
    }

    peers.forEach(peer => {
      peer.sendInteraction(new interactions.Notify(jobId.toString(), [job[0].toString(), job[1].toString(), job[2].toString(), job[3].toString()], blockTemplate.block.header.timestamp))
    })
  })
})
