const net = require('net');

const server = net.createServer()

server.on('connection', (socket) => {
  const client = new net.Socket();
  client.connect(6943, 'localhost')

  client.on('data', (data) => {
    console.log('From mining pool:', data.toString())

    socket.write(data)
  })

	socket.on('data', (data) => {
    console.log('From miner:', data.toString())

    client.write(data)
  })
})

server.on('listening', () => {
  console.log('Listening!')
})

server.listen(6942, '127.0.0.1')