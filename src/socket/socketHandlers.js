const config = require('../config/config');

class SocketHandler {
    constructor() {
        this.count = 0;
        this.users = {};
        this.userClicks = {};
        this.onlineUsers = 0;
    }

    handleConnection(io, socket) {
        console.log(`🔗 Bir kullanıcı bağlandı: ${socket.id}`);
        this.onlineUsers++;

        console.log(`🌐 Şu an online kullanıcılar: ${this.onlineUsers}`);
        io.emit("onlineCount", this.onlineUsers);

        // Config bilgisini gönder
        socket.emit("config", {
            TARGET_COUNT: config.TARGET_COUNT
        });

        socket.emit("updateCount", this.count);
        socket.emit("personalCount", 0);

        this.setupSocketEvents(io, socket);
    }

    setupSocketEvents(io, socket) {
        socket.on("registerUser", (userId) => this.handleRegisterUser(io, socket, userId));
        socket.on("increment", (userId) => this.handleIncrement(io, socket, userId));
        socket.on("resetCount", () => this.handleResetCount(io));
        socket.on("disconnect", () => this.handleDisconnect(io, socket));
    }

    handleRegisterUser(io, socket, userId) {
        console.log(`🆕 Kullanıcı kaydı alındı: ${userId}`);
        if (!this.users[userId]) {
            this.users[userId] = [];
            this.userClicks[userId] = 0;
        }
        this.users[userId].push(socket.id);

        console.log(`📊 Güncellenmiş kullanıcı sayısı: ${Object.keys(this.users).length}`);
        io.emit("onlineCount", this.onlineUsers);
    }

    handleIncrement(io, socket, userId) {
        this.count++;
        this.userClicks[userId] = (this.userClicks[userId] || 0) + 1;

        io.emit("updateCount", this.count);
        socket.emit("personalCount", this.userClicks[userId]);
    }

    handleResetCount(io) {
        this.count = 0;
        for (const userId in this.userClicks) {
            this.userClicks[userId] = 0;
        }
        io.emit("updateCount", this.count);
        io.emit("closeModal");
        io.emit("resetState");
    }

    handleDisconnect(io, socket) {
        console.log(`❌ Kullanıcı ayrıldı: ${socket.id}`);
        this.onlineUsers = Math.max(0, this.onlineUsers - 1);

        for (const userId in this.users) {
            this.users[userId] = this.users[userId].filter((id) => id !== socket.id);
            if (this.users[userId].length === 0) {
                delete this.users[userId];
                delete this.userClicks[userId];
            }
        }

        console.log(`📉 Güncellenmiş online kullanıcı sayısı: ${this.onlineUsers}`);
        io.emit("onlineCount", this.onlineUsers);
    }
}

module.exports = new SocketHandler(); 