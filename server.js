const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Canlı sunucu için CORS ayarı (Render, Railway vb.)
const io = new Server(server, {
  cors: {
    origin: "*", // Tüm istemcilere izin ver
    methods: ["GET", "POST"]
  }
});

// Ortak sayaç değişkeni
let count = 0;

// Statik dosyaları sun (index.html ve diğer dosyalar için)
app.use(express.static(__dirname + "/public"));
app.use(cors()); // CORS sorunlarını önler

// Socket.IO bağlantıları yönet
io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı:", socket.id);

  // Yeni bağlanan kullanıcıya mevcut sayaç değerini gönder
  socket.emit("updateCount", count);

  // Kullanıcı "increment" isteği gönderdiğinde sayacı artır
  socket.on("increment", () => {
    count++;
    io.emit("updateCount", count);
  });

  socket.on("disconnect", () => {
    console.log("Bir kullanıcı ayrıldı:", socket.id);
  });
});

// PORT ayarı (Canlı ve Localhost için otomatik seçim)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
