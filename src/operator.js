require('modernlog/patch')

module.exports = class Operator {
  constructor (processArgs) {
    const env = parseEnv(processArgs)

    this.node = env['node'] ?? '79.120.76.62:16110'
    this.address = env['address']
    this.port = env['port'] ?? 16112
    this.listenAddress = env['listen-address'] ?? '127.0.0.1'

    if (typeof env['help'] !== 'undefined') {
      console.log('KStratum Help\n--node <address>: Configures Kaspa node[Default: 79.120.76.62:16110]\n--address <wallet>: Configures mining wallet\n--port <port>: Configures Stratum port [Default: 16112]\n--listen-address <address>: Configures Stratum ip address [Default: 127.0.0.1]')
      process.exit()
    }

    if (!this.address || !/kaspa(dev|test|sim)?:[023456789abcdefghjkmnpqrtuvwxyzls]{61}/.test(this.address)) {
      console.error('Invalid address parameter')
      process.exit(1)
    }
  }
}

const parseEnv = (argv) => {
  const executedCommands = {}

  for (let arg = 1; arg < process.argv.length; arg++) {
    const data = argv[arg]

    if (data.startsWith('--') && data.length > 2) {
      executedCommands[data.replace('--', '')] = null
    } else {
      const beforeData = argv[arg - 1]
      if (typeof executedCommands[beforeData && beforeData.replace('--', '')] !== 'undefined') {
        executedCommands[beforeData.replace('--', '')] = data
      }
    } 
  }

  return executedCommands
}