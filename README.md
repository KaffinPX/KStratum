# KStratum 🏊
### Stratum adapter for Kaspa!

## Features
* Light, uses about 20 MB ram(nearly no CPU usage!) on a typical computer.
* Supports multiple miners per instance.
* Zero fee solo Stratum mining(Time to ditch pools?).
* Supports multiple networks(Testnet, mainnet...).

## Usage
### npx
Install NodeJS 16 from [here](https://nodejs.org/) and run KStratum:
```
npx kstratum@latest <arguments>
```

### Docker
Modify the command arguments in the included Dockerfile to reflect your Node, Wallet, Port, and Listening Address.

Build the container:
```
docker build -t kstratum .
```

Run the container locally:
```
docker run -p 16112:16112 -t kstratum
```

### Arguments
* ``--node <ip/domain:port>``: Switchs to another node. Default: `79.120.76.62:16110`
* ``--address <address>``: Sets mining address.
* ``--port <port>``: Sets Stratum listening port. Default: `16112`
* ``--listen-address <ip/domain>``: Sets Stratum listening address. Default: `127.0.0.1`

#### Sponsored by [lolMiner](https://github.com/Lolliedieb/lolMiner-releases)
