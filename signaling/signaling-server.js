// signaling-server.js
const io = require('socket.io')(9000, {
  cors: { origin: "*" } // מאפשר לכל Localhost להתחבר
});

console.log("Signaling Server rdy on port 9000");

// שרת פשוט שרק "משקף" את ההודעות בין שני המחשבים
io.on('connection', (socket) => {
  console.log('User connected for WebRTC:', socket.id);

  socket.on('signal', (data) => {
    // שולח את הנתונים (ה-SDP) למחשב השני
    socket.broadcast.emit('signal', data);
  });
});
