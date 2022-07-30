require('modernlog/patch')

module.exports = class Process {
  constructor (processArgs) {
    const env = parseEnv(processArgs)

    this.node = env['node'] ?? '79.120.76.62:16210'
    this.address = env['address'] ?? 'kaspatest:qrap0pn389g42eltya6ezvd3e56nkyuu3w3cmgpdsqkaafy52x922nzv4nnh4'
    this.port = env['port'] ?? 16112

    if (!/kaspa(dev|test|sim)?:[023456789abcdefghjkmnpqrtuvwxyzls]{61}/.test(this.address)) {
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
      if (typeof executedCommands[beforeData?.replace('--', '')] !== 'undefined') {
        executedCommands[beforeData.replace('--', '')] = data
      }
    } 
  }

  return executedCommands
}