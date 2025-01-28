const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Uygulama ve sunucu ayarları
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Toplam sayaç değeri
let count = 0;

// Statik dosyaları sun (index.html gibi)
app.use(express.static(__dirname + "/public"));

// Socket.IO bağlantısı
io.on("connection", (socket) => {
  console.log("Bir kullanıcı bağlandı:", socket.id);

  // Emit a custom event to notify the client
  socket.emit("userConnected", `Kullanıcı bağlandı: ${socket.id}`);

  // Yeni bağlanan kullanıcıya mevcut sayaç değerini gönder
  socket.emit("updateCount", count);

  // Kullanıcı "increment" mesajı gönderdiğinde sayacı artır ve herkese yayınla
  socket.on("increment", () => {
    count++;
    io.emit("updateCount", count); // Tüm bağlı kullanıcılara gönder
  });

  // Kullanıcı bağlantıyı kestiğinde log yazdır
  socket.on("disconnect", () => {
    console.log("Bir kullanıcı ayrıldı:", socket.id);
  });
});

// Sunucuyu başlat
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
