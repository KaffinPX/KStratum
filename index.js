const Environment = require('./src/environment')
const Client = require('./src/kaspa/client')
const Hasher = require('./src/kaspa/hasher')
const Server = require('./src/stratum/server')

const interactions = require('./src/stratum/interactions')
const errors = require('./src/stratum/errors')

const environment = new Environment(process.argv)

console.log(`Running KStratum for \x1b[33m${environment.address}\x1b[0m`)
console.info(`Connecting to node \x1b[33m${environment.node}\x1b[0m`)

const client = new Client(environment.node)
const hasher = new Hasher()

const peers = new Set()

client.on('ready', () => {
  console.log('Connected to Kaspa node, starting stratum...')

  const server = new Server(environment.port, environment.listenAddress)

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
    peer.on('interaction', async (interaction) => {
      if (interaction.method === 'subscribe') {
        peers.add(peer)
      } else if (interaction.method === 'authorize') {
        await peer.sendInteraction(new interactions.SetExtranonce((require('crypto')).randomBytes(2).toString('hex')))
        await peer.sendInteraction(new interactions.SetDifficulty(lastDifficulty))
        await peer.sendInteraction(new interactions.Answer(interaction.id, true))
      } else if (interaction.method === 'submit') {
        const block = jobs.get(Number(interaction.params[1]))
        if (typeof block === 'undefined') return await peer.sendInteraction(new interactions.ErrorAnswer(interaction.id, errors['JOB_NOT_FOUND']))

        block.header.nonce = BigInt(interaction.params[2]).toString()

        const hash = await hasher.serializeHeader(block.header, false)

        client.kaspa.request('submitBlockRequest', {
          block,
          allowNonDAABlocks: false
        }).then(async () => {
          let blockReward = 0n
          for (const output of block.transactions[0].outputs) {
            blockReward += BigInt(output.amount)
          }
  
          console.info(`Accepted block \x1b[33m${hash.toString('hex')}\x1b[0m, mined \x1b[33m${blockReward / BigInt(1e8)}\x1b[0m KAS!`)
          await peer.sendInteraction(new interactions.Answer(interaction.id, true))
        }).catch(async (err) => {
          if (err.message.includes('ErrInvalidPoW')) {
            await peer.sendInteraction(new interactions.ErrorAnswer(interaction.id, errors['LOW_DIFFICULTY_SHARE']))
            console.error(`Invalid work submitted for block \x1b[33m${hash.toString('hex')}\x1b[0m`)
          } else if (err.message.includes('ErrDuplicateBlock')) {
            await peer.sendInteraction(new interactions.ErrorAnswer(interaction.id, errors['DUPLICATE_SHARE']))
            console.error(`Block \x1b[33m${hash.toString('hex')}\x1b[0m already submitted`)
          } else {
            await peer.sendInteraction(new interactions.ErrorAnswer(interaction.id, errors['UNKNOWN']))
            console.error(err)
          }
        })
      }
    })
  })

  client.on('newTemplate', async () => {
    const blockTemplate = await client.kaspa.request('getBlockTemplateRequest', {
      payAddress: environment.address,
      extraData: 'KStratum[0.3.2].developers=["KaffinPX","jwj","Not Thomiz"]'
    })

    if (!blockTemplate.isSynced) { console.error('Node is not synced.'); process.exit(1) }

    const header = await hasher.serializeHeader(blockTemplate.block.header, true)
    const job = await hasher.serializeJobData(header)

    const lastJob = Array.from(jobs.entries()).pop()

    let jobId = (lastJob?.[0] ?? 0) + 1
    if (jobId > 99) { jobId = 1 }

    jobs.set(jobId, blockTemplate.block)

    const difficulty = Number(2n ** 255n / await hasher.calculateTarget(BigInt(blockTemplate.block.header.bits))) / 2 ** 31

    if (lastDifficulty !== difficulty) {
      lastDifficulty = difficulty

      for (const peer of peers) {
        await peer.sendInteraction(new interactions.SetDifficulty(lastDifficulty))
      }
    }

    for (const peer of peers) {
      await peer.sendInteraction(new interactions.Notify(jobId.toString(), [job[0].toString(), job[1].toString(), job[2].toString(), job[3].toString()], blockTemplate.block.header.timestamp))
    }
  })
})
