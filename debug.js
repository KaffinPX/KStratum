const net = require('net');

const server = net.createServer()

server.on('connection', (socket) => {
  const client = new net.Socket();
  client.connect(6942, 'localhost')

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
  console.log('Listening for possible proxying!')
})

server.listen(6943, '127.0.0.1')