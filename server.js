const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let count = 0;
const users = {}; 
const userClicks = {};
let onlineUsers = 0;

app.use(express.static(__dirname + "/public"));
app.use(cors());

io.on("connection", (socket) => {
  console.log(`🔗 Bir kullanıcı bağlandı: ${socket.id}`);
  onlineUsers++; 

  console.log(`🌐 Şu an online kullanıcılar: ${onlineUsers}`);
  io.emit("onlineCount", onlineUsers);

  socket.on("registerUser", (userId) => {
    console.log(`🆕 Kullanıcı kaydı alındı: ${userId}`);
    if (!users[userId]) {
      users[userId] = [];
      userClicks[userId] = 0;
    }
    users[userId].push(socket.id);

    console.log(`📊 Güncellenmiş kullanıcı sayısı: ${Object.keys(users).length}`);
    io.emit("onlineCount", onlineUsers);
  });

  socket.on("increment", (userId) => {
    count++;
    userClicks[userId] = (userClicks[userId] || 0) + 1;

    io.emit("updateCount", count);
    socket.emit("personalCount", userClicks[userId]);
  });

  socket.on("resetCount", () => {
    count = 0;
    for (const userId in userClicks) {
      userClicks[userId] = 0;
    }
    io.emit("updateCount", count);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Kullanıcı ayrıldı: ${socket.id}`);
    onlineUsers = Math.max(0, onlineUsers - 1);

    for (const userId in users) {
      users[userId] = users[userId].filter((id) => id !== socket.id);
      if (users[userId].length === 0) {
        delete users[userId];
        delete userClicks[userId];
      }
    }

    console.log(`📉 Güncellenmiş online kullanıcı sayısı: ${onlineUsers}`);
    io.emit("onlineCount", onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`);
});
