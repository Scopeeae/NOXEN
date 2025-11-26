const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const moment = require('moment');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const filter = new Filter();

// MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB BAĞLANDI'))
  .catch(err => console.log('MongoDB HATASI:', err));

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı');

  socket.on('join', ({ username, room }) => {
    socket.join(room);
    socket.emit('message', formatMessage('NOXEN', `Hoş geldin ${username}!`));
    socket.broadcast.to(room).emit('message', formatMessage('NOXEN', `${username} odaya katıldı`));
  });

  socket.on('chatMessage', (msg) => {
    const finalMsg = filter.isProfane(msg) ? '***' : msg;
    io.to([...socket.rooms][1]).emit('message', formatMessage(socket.username || 'Anonim', finalMsg));
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı');
  });
});

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().format('HH:mm')
  };
}

// Index route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`NOXEN ÇALIŞIYOR → https://noxen.onrender.com | Port: ${PORT}`);
});
