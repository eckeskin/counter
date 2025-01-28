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

app.use(express.static(__dirname + "/public"));
app.use(cors());

io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı:", socket.id);

  socket.on("registerUser", (userId) => {
    if (!users[userId]) {
      users[userId] = [];
      userClicks[userId] = 0;
    }
    users[userId].push(socket.id);

    // Yeni bağlanan kullanıcıya mevcut sayaç değerlerini hemen gönder
    socket.emit("updateCount", count);
    socket.emit("personalCount", userClicks[userId] || 0);
    socket.emit("onlineCount", Object.keys(users).length);

    io.emit("onlineCount", Object.keys(users).length);
  });

  socket.on("increment", (userId) => {
    count++;
    userClicks[userId]++;

    io.emit("updateCount", count);
    socket.emit("personalCount", userClicks[userId]);
  });

  socket.on("disconnect", () => {
    for (const userId in users) {
      users[userId] = users[userId].filter((id) => id !== socket.id);
      if (users[userId].length === 0) {
        delete users[userId];
        delete userClicks[userId];
      }
    }
    io.emit("onlineCount", Object.keys(users).length);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
