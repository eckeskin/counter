const config = require('../config/config');

class SocketHandler {
    constructor() {
        this.count = 0;
        this.users = new Map();        // Kullanıcı bilgilerini Map olarak tutuyoruz
        this.userClicks = new Map();   // Tıklama sayılarını da Map olarak tutuyoruz
        this.disconnectTimers = new Map(); // Bağlantı kopması durumunda zamanlayıcıları tutuyoruz
    }

    // Aktif kullanıcı sayısını hesapla (her kullanıcıyı bir kez say)
    getOnlineUserCount() {
        return this.users.size;
    }

    // Kullanıcının tüm socket bağlantılarını getir
    getUserSockets(userId) {
        return this.users.get(userId) || new Set();
    }

    // Kullanıcının herhangi bir socket bağlantısı var mı?
    isUserConnected(userId) {
        const sockets = this.getUserSockets(userId);
        return sockets.size > 0;
    }

    handleConnection(io, socket) {
        console.log(`🔗 Bir kullanıcı bağlandı: ${socket.id}`);

        // Config bilgisini gönder
        socket.emit("config", {
            TARGET_COUNT: config.TARGET_COUNT
        });

        socket.emit("updateCount", this.count);
        
        // Kullanıcı daha önce tıklama yapmışsa, kişisel sayacını gönder
        socket.on("registerUser", (userId) => {
            const clicks = this.userClicks.get(userId) || 0;
            socket.emit("personalCount", clicks);
        });

        this.setupSocketEvents(io, socket);
    }

    setupSocketEvents(io, socket) {
        socket.on("registerUser", (userId) => this.handleRegisterUser(io, socket, userId));
        socket.on("increment", (userId) => this.handleIncrement(io, socket, userId));
        socket.on("resetCount", () => this.handleResetCount(io));
        socket.on("disconnect", () => this.handleDisconnect(io, socket));
    }

    handleRegisterUser(io, socket, userId) {
        // Eğer bu kullanıcı için bekleyen bir disconnect timer varsa iptal et
        if (this.disconnectTimers.has(userId)) {
            clearTimeout(this.disconnectTimers.get(userId));
            this.disconnectTimers.delete(userId);
            console.log(`⏱️ ${userId} için disconnect timer iptal edildi`);
        }
        
        // Kullanıcıyı kaydet
        if (!this.users.has(userId)) {
            this.users.set(userId, new Set());
            this.userClicks.set(userId, 0);
            console.log(`🆕 Yeni kullanıcı kaydı alındı: ${userId}`);
        } else {
            console.log(`🔄 Mevcut kullanıcı yeni sekmede: ${userId}`);
        }
        
        this.users.get(userId).add(socket.id);
        socket.userId = userId; // Socket nesnesine userId'yi ekle

        const onlineCount = this.getOnlineUserCount();
        console.log(`📊 Güncellenmiş kullanıcı sayısı: ${onlineCount}`);
        io.emit("onlineCount", onlineCount);
    }

    handleIncrement(io, socket, userId) {
        this.count++;
        this.userClicks.set(userId, (this.userClicks.get(userId) || 0) + 1);
        const personalCount = this.userClicks.get(userId);

        io.emit("updateCount", this.count);
        
        // Kullanıcının tüm aktif sekmelerine kişisel sayacı gönder
        const userSockets = this.getUserSockets(userId);
        for (const socketId of userSockets) {
            io.to(socketId).emit("personalCount", personalCount);
        }
    }

    handleResetCount(io) {
        this.count = 0;
        for (const [userId] of this.userClicks) {
            this.userClicks.set(userId, 0);
        }
        io.emit("updateCount", this.count);
        io.emit("closeModal");
        io.emit("resetState");
    }

    handleDisconnect(io, socket) {
        const userId = socket.userId;
        if (!userId) return;

        console.log(`❌ Socket bağlantısı koptu: ${socket.id} (Kullanıcı: ${userId})`);
        
        const userSockets = this.getUserSockets(userId);
        userSockets.delete(socket.id);

        // Eğer kullanıcının başka aktif soketi yoksa, 30 saniye bekle
        if (userSockets.size === 0) {
            console.log(`⏱️ ${userId} için 30 saniyelik disconnect timer başlatıldı`);
            
            const timer = setTimeout(() => {
                if (!this.isUserConnected(userId)) {
                    console.log(`⌛ ${userId} için süre doldu, kullanıcı siliniyor`);
                    this.users.delete(userId);
                    this.userClicks.delete(userId);
                    this.disconnectTimers.delete(userId);
                    
                    const onlineCount = this.getOnlineUserCount();
                    console.log(`📉 Güncellenmiş online kullanıcı sayısı: ${onlineCount}`);
                    io.emit("onlineCount", onlineCount);
                }
            }, 30000); // 30 saniye bekle

            this.disconnectTimers.set(userId, timer);
        }
    }
}

module.exports = new SocketHandler(); 