const Client = require('./src/kaspa/client')
const Hasher = require('./src/kaspa/hasher')
const Server = require('./src/stratum/server')

const interactions = require('./src/stratum/interactions')

const client = new Client('164.92.190.13:16110')
const hasher = new Hasher()

const peers = new Set()

const miningAddress = 'kaspa:qrevg3fkad49s7hcg9ry7262kpfpxkrga2sywwkcn2kz3u2nktejs5lwecl2j'

client.on('ready', () => {
  console.log('Connected to Kaspa node, starting stratum...')

  const server = new Server(6942)

  server.on('listening', () => {
    console.log(`Stratum server listening on ${server.server.address().port}`)
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
        const block = jobs.get(interaction.params[1]) 
        if (typeof block === 'undefined') return peer.sendInteraction(new interactions.Answer(interaction.id, false))

        block.header.nonce = interaction.params[2]

        client.kaspa.request('submitBlockRequest', {
          block,
          allowNonDAABlocks: false
        }).then(result => {
          if (!result.rejectReason !== 0) return peer.sendInteraction(new interactions.Answer(interaction.id, false))

          peer.sendInteraction(new interactions.Answer(interaction.id, true))
        })
      }
    })
  })

  client.kaspa.subscribe('notifyBlockAddedRequest', {}, async (block) => {
    const blockTemplate = await client.kaspa.request('getBlockTemplateRequest', {
      payAddress: miningAddress,
      extraData: 'KStratum: Coded by KaffinPX & jwj & Not Thomiz'
    })

    const header = hasher.serializeHeader(blockTemplate.block.header, true)
    const job = hasher.serializeJobData(header)

    let jobId = (Array.from(jobs.entries()).pop()?.[0] ?? 0) + 1

    if (jobId >= 99) {
      jobs.clear()
      jobId = 1
    }

    jobs.set(jobId, blockTemplate.block)

    if (lastDifficulty !== Number(BigInt(Math.floor(block.block.verboseData.difficulty)) / (2n ** 31n))) {
      lastDifficulty = Number(BigInt(Math.floor(block.block.verboseData.difficulty)) / (2n ** 31n))

      peers.forEach(peer => {
        peer.sendInteraction(new interactions.setDifficulty(lastDifficulty))
      })
    }

    peers.forEach(peer => {
      peer.sendInteraction(new interactions.Notify(jobId.toString(), [ job[0].toString(), job[1].toString(), job[2].toString(), job[3].toString() ], blockTemplate.block.header.timestamp))
    })
  })
})
