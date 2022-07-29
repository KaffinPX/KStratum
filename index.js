#! /usr/bin/env node
const Client = require('./src/kaspa/client')
const Hasher = require('./src/kaspa/hasher')
const Server = require('./src/stratum/server')

const interactions = require('./src/stratum/interactions')

const params = {
  node: '164.92.190.13:16110',
  address: '',
  port: 6942
}

const NODE_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/
const ADDRESS_REGEX = /kaspa(dev|testnet|sim)?:[023456789abcdefghjkmnpqrtuvwxyzls]{61}/

if(process.argv.length < 3) {
  console.log(`Usage: npx kstratum --node {ip:port} --address <address> --port {port}

Default node: ${params.node}
Default port: ${params.port}`)
  process.exit(1)
}
require("modernlog/patch")

for(let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if(!arg.startsWith('--')) {
    console.error(`Invalid argument: ${arg}`)
    process.exit(1)
  }

  const key = arg.slice(2)
  i++
  let value = process.argv[i]
  if(!value || value.startsWith('--')){
    console.error(`Invalid parameter value: ${key}:${value}`)
    process.exit(1)
  }

  switch(key){
    case "node": {
      if(!NODE_REGEX.test(value)){
        console.error(`Invalid --node parameter: ${value}`)
        process.exit(1)
      }
      params.node = value
      break
    }
    case "address": {
      if(!ADDRESS_REGEX.test(value)){
        console.error(`Invalid --address parameter: ${value}`)
        process.exit(1)
      }
      params.address = value
      break
    }
    case "port": {
      const number = parseInt(value)
      if(isNaN(number) || number < 1 || number > 65535){
        console.error(`Invalid --port parameter: ${value}`)
        process.exit(1)
      }
      params.port = number
    }
  }
}

if(!params.address){
  console.error('Missing --address parameter')
  process.exit(1)
}

console.log(`Running kstratum for \x1b[33m${params.address}\x1b[0m`)
console.info(`Connecting to node \x1b[33m${params.node}\x1b[0m`)
const client = new Client(params.node)
const hasher = new Hasher()

const peers = new Set()

client.on('ready', () => {
  console.log('Connected to Kaspa node, starting stratum...')

  const server = new Server(params.port)

  server.on('listening', () => {
    console.log(`Stratum server listening on \x1b[33m${server.server.address().port}\x1b[0m`)
  })

  server.on('error', (err) => {
    if(err.code === "EACCES"){
      console.error(`Failed to listen to port ${err.address}:${err.port}`)
      console.error(err.message)
    }else{
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
        const block = jobs.get(interaction.params[1])
        if (typeof block === 'undefined') return

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
      payAddress: params.address,
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

    if (lastDifficulty !== Number(Math.ceil(block.block.verboseData.difficulty).toString()[0]) + 1) {
      lastDifficulty = Number(Math.ceil(block.block.verboseData.difficulty).toString()[0]) + 1

      peers.forEach(peer => {
        peer.sendInteraction(new interactions.setDifficulty(lastDifficulty))
      })
    }

    peers.forEach(peer => {
      peer.sendInteraction(new interactions.Notify(jobId.toString(), [ job[0].toString(), job[1].toString(), job[2].toString(), job[3].toString() ], blockTemplate.block.header.timestamp))
    })
  })
})
