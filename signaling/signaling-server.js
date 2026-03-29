// signaling-server.js
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 9000 });

console.log("Signaling Server rdy on port 9000");

// Simple relay server for WebRTC signaling and game state
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Broadcast to all other connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // 1 = OPEN
          client.send(JSON.stringify(data));
        }
      });
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
