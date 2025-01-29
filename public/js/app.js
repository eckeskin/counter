class CounterApp {
    constructor() {
        this.socket = io();
        this.target = 100; // Bu değer backend'den gelecek
        this.hasReachedTarget = false;
        this.userId = this.initializeUserId();
        
        // Sayfa yüklendiğinde kişisel sayacı sıfırla
        document.getElementById("personal-count").textContent = "0";
        
        this.initializeSocketEvents();
        this.initializeEventListeners();
        
        // Hedef sayıyı güncelle
        document.getElementById("target-input").textContent = this.target.toLocaleString();
    }

    initializeUserId() {
        let userId = localStorage.getItem("userId");
        if (!userId) {
            userId = Math.random().toString(36).substring(2);
            localStorage.setItem("userId", userId);
        }
        return userId;
    }

    initializeSocketEvents() {
        // Önce kişisel sayacı sıfırla, sonra kullanıcı kaydı yap
        document.getElementById("personal-count").textContent = "0";
        this.socket.emit("registerUser", this.userId);

        // İlk veri geldiğinde elementleri göster
        this.socket.on("config", (config) => {
            this.target = config.TARGET_COUNT;
            document.getElementById("target-input").textContent = this.target.toLocaleString();
        });

        this.socket.on("onlineCount", (count) => {
            console.log("🔹 Online Kullanıcı Sayısı:", count);
            document.getElementById("online-count").textContent = count;
            this.showElements(); // Online sayısı geldiğinde göster
        });

        this.socket.on("updateCount", (count) => {
            this.updateCountDisplay(count);
            this.showElements(); // Sayaç değeri geldiğinde göster
        });

        this.socket.on("closeModal", () => {
            document.getElementById("success-modal").style.display = "none";
        });

        this.socket.on("resetState", () => {
            this.hasReachedTarget = false;
            document.getElementById("count-display").style.pointerEvents = "auto";
        });

        this.socket.on("personalCount", (count) => {
            document.getElementById("personal-count").textContent = count;
            this.showElements(); // Kişisel sayaç geldiğinde göster
        });

        // Yeniden bağlanma durumunda
        this.socket.on("connect", () => {
            document.getElementById("personal-count").textContent = "0";
            this.socket.emit("registerUser", this.userId);
        });
    }

    updateCountDisplay(count) {
        document.getElementById("count-display").textContent = count;
        const progress = (count / this.target) * 100;
        document.getElementById("progress-bar").style.width = `${progress}%`;
        document.getElementById("progress-text").textContent = `${Math.round(progress)}%`;

        if (count >= this.target && !this.hasReachedTarget) {
            this.hasReachedTarget = true;
            document.getElementById("success-modal").style.display = "flex";
        }
    }

    initializeEventListeners() {
        document.getElementById("count-display").addEventListener("click", () => {
            if (!this.hasReachedTarget) {
                this.socket.emit("increment", this.userId);
            }
        });

        document.getElementById("close-modal").addEventListener("click", () => this.resetCounter());
        
        this.initializeUIEventListeners();
    }

    initializeUIEventListeners() {
        document.getElementById("close-modal").addEventListener("mousedown", function(event) {
            event.preventDefault();
            this.blur();
        });

        document.getElementById("success-modal").addEventListener("mousedown", function(event) {
            if (event.target === this) {
                event.preventDefault();
                document.activeElement.blur();
                document.getElementById("close-modal").blur();
            }
        });

        document.getElementById("close-modal").addEventListener("focus", function() {
            this.blur();
        });

        document.addEventListener("dblclick", function(event) {
            event.preventDefault();
        });

        document.addEventListener("gesturestart", function(event) {
            event.preventDefault();
        });
    }

    resetCounter() {
        this.hasReachedTarget = false;
        document.getElementById("count-display").style.pointerEvents = "auto";
        document.getElementById("success-modal").style.display = "none";

        setTimeout(() => {
            document.activeElement.blur();
            document.getElementById("close-modal").blur();
        }, 10);
        
        this.socket.emit("resetCount");
    }

    // Elementleri görünür yap
    showElements() {
        const elements = [
            document.getElementById("count-display"),
            document.getElementById("personal-count"),
            document.getElementById("progress-bar"),
            document.getElementById("progress-text"),
            document.getElementById("online-count")
        ];

        // Tüm elementleri aynı anda görünür yap
        requestAnimationFrame(() => {
            elements.forEach(element => {
                element.style.opacity = "1";
            });
        });
    }
}

// Uygulama başlatma
document.addEventListener("DOMContentLoaded", () => {
    new CounterApp();
}); 