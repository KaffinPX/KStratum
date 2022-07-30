# KStratum 🏊
### Stratum adapter for Kaspa!

## Features
* Light, uses about 20 MB ram(nearly no CPU usage!) on a typical computer.
* Supports multiple miners per instance.
* Zero fee solo Stratum mining(Time to ditch pools?).
* Supports multiple networks(Testnet, mainnet...).

## Usage
Install NodeJS 16 from [here](https://nodejs.org/) and run KStratum by ``npx kstratum@latest <arguments>`` on command line.

### Arguments
* ``--node <address>``: Switchs to another node. Default: `79.120.76.62:16110`
* ``--address <address>``: Sets mining address.
* ``--port <port>``: Sets Stratum listening port. Default: `16112`

#### Sponsored by [LOLMiner](https://github.com/Lolliedieb/lolMiner-releases)