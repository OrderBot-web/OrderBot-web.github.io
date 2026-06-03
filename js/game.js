const DISCORD_WEBHOOK_URL = 'https://discord.com/api/v10/webhooks/1511405598489575657/kfAincCiahPdZJjkF48XjUFPoeMlc9IhR6V575DS6eWllmXgXH7iWfZ1PnYxja1kgl5T';

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.running = false;
        this.score = 0;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.clawX = 0;
        this.clawY = 130;
        this.clawState = 'idle'; // idle, movingDown, returning
        this.prizes = [];

        this.init();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    init() {
        window.addEventListener('resize', () => this.resize());

        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;

            if (this.clawState === 'idle') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveClaw(-18);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveClaw(18);
                if (e.code === 'Space' || e.code === 'Enter') this.startDrop();
            }

            if (e.code === 'Escape') {
                this.running = false;
                document.getElementById('game-container').classList.remove('active');
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.canvas.addEventListener('click', () => {
            if (this.clawState === 'idle') this.startDrop();
        });

        this.resetClawMachine();
    }

    moveClaw(amount) {
        this.clawX = Math.max(140, Math.min(this.width - 140, this.clawX + amount));
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 130;
        this.clawState = 'idle';
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        // Premi sparsi in modo più realistico
        this.prizes = [];
        const startX = 140;
        const spacingX = 95;
        const startY = 360;

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 8; col++) {
                const isRare = Math.random() < 0.09;
                this.prizes.push({
                    x: startX + col * spacingX + (row * 25),
                    y: startY + row * 70,
                    size: isRare ? 36 : 30,
                    type: isRare ? 'rare' : 'normal',
                    color: isRare ? '#ffd700' : '#5ce1ff'
                });
            }
        }
    }

    startDrop() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'movingDown';
    }

    update() {
        if (!this.running) return;

        if (this.clawState === 'movingDown') {
            this.clawY += 7;

            // Controllo collisione
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);

                if (dist < p.size + 18) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.checkWin();
                    return;
                }
            }

            if (this.clawY > 520) {
                this.clawState = 'returning';
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 8;
            if (this.clawY <= 130) {
                this.clawY = 130;
                this.clawState = 'idle';
            }
        }

        // Particelle
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        if (this.messageTimer > 0) this.messageTimer--;
    }

    checkWin() {
        if (!this.wonPrize) return;

        if (this.wonPrize.type === 'rare') {
            this.message = '🎉 PREMIO RARISSIMO!';
            this.messageTimer = 200;
            this.score += 1000;
            this.createParticles(this.clawX, this.clawY, 40, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Hai preso un premio!';
            this.messageTimer = 90;
            this.score += 100;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                life: 50 + Math.random() * 30,
                color: color
            });
        }
    }

    async sendDiscordWebhook() {
        if (!DISCORD_WEBHOOK_URL) return;
        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🎰 **Qualcuno ha vinto il PREMIO RARISSIMO** nella Macchina a Gancio!`,
                    embeds: [{
                        title: "🎁 Vincita Rara - Macchina a Gancio",
                        description: `Punteggio: **${this.score}**`,
                        color: 0xf9ca24
                    }]
                })
            });
        } catch (e) {}
    }

    draw() {
        const c = this.ctx;
        c.fillStyle = '#0d0d14';
        c.fillRect(0, 0, this.width, this.height);

        // Cornice macchina
        c.fillStyle = '#1c1c2e';
        c.fillRect(70, 60, this.width - 140, this.height - 90);
        c.strokeStyle = '#4a4a6a';
        c.lineWidth = 6;
        c.strokeRect(70, 60, this.width - 140, this.height - 90);

        // Premi
        this.prizes.forEach(p => {
            c.shadowBlur = p.type === 'rare' ? 20 : 6;
            c.shadowColor = p.type === 'rare' ? '#ffd700' : '#5ce1ff';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = '#ffffff44';
            c.lineWidth = 3;
            c.stroke();
            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#cccccc';
        c.lineWidth = 9;
        c.beginPath();
        c.moveTo(this.clawX, 60);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        c.fillStyle = '#e0e0e0';
        c.beginPath();
        c.moveTo(this.clawX - 24, this.clawY);
        c.lineTo(this.clawX, this.clawY + 30);
        c.lineTo(this.clawX + 24, this.clawY);
        c.fill();

        // Particelle
        this.particles.forEach(p => {
            c.globalAlpha = p.life / 70;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        // UI
        c.fillStyle = '#fff';
        c.font = 'bold 26px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('🎰  MACCHINA A GANCIO  🎰', this.width / 2, 45);

        c.font = '17px Inter, sans-serif';
        c.fillText('Muovi con ← →   |   Premi SPAZIO per far scendere', this.width / 2, this.height - 25);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARISSIMO') ? 'bold 40px Inter, sans-serif' : 'bold 30px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        c.fillStyle = '#55efc4';
        c.font = 'bold 22px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 50, 45);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.resetClawMachine();
        this.loop();
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.SpaceGame = SpaceGame;
