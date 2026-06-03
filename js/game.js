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
        this.clawY = 85;
        this.clawState = 'idle';
        this.clawOpen = true;
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
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveClaw(-14);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveClaw(14);
                if (e.code === 'Space' || e.code === 'Enter') this.dropClaw();
            }
            if (e.code === 'Escape') {
                this.running = false;
                document.getElementById('game-container').classList.remove('active');
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.resetClawMachine();
    }

    moveClaw(amount) {
        this.clawX = Math.max(95, Math.min(this.width - 95, this.clawX + amount));
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 85;
        this.clawState = 'idle';
        this.clawOpen = true;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.prizes = [];

        // 500 palline totali → 20 rare
        const totalBalls = 500;
        const rareCount = 20;

        for (let i = 0; i < totalBalls; i++) {
            const isRare = i < rareCount; // prime 20 sono rare
            this.prizes.push({
                x: 70 + Math.random() * (this.width - 140),
                y: 240 + Math.random() * 270,
                size: isRare ? 17 : 14,
                type: isRare ? 'rare' : 'normal',
                color: '#4fc3f7'
            });
        }

        // Mischia le palline in modo casuale
        this.prizes.sort(() => Math.random() - 0.5);
    }

    dropClaw() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'dropping';
        this.clawOpen = true;
    }

    update() {
        if (!this.running) return;

        if (this.clawState === 'dropping') {
            this.clawY += 5.2;

            // Controlla collisione mentre scende (prende ovunque)
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);

                const chance = p.type === 'rare' ? 0.88 : 0.28;

                if (dist < p.size + 9 && Math.random() < chance) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.clawOpen = false;
                    return;
                }
            }

            if (this.clawY > 530) {
                this.clawState = 'returning';
                this.clawOpen = false;
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 5.8;

            if (this.clawY <= 85) {
                this.clawY = 85;
                this.clawState = 'idle';
                this.clawOpen = true;

                if (this.wonPrize) {
                    this.checkWin();
                    this.wonPrize = null;
                }
            }
        }

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
            this.messageTimer = 250;
            this.score += 8000;
            this.createParticles(this.clawX, this.clawY - 5, 80, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 45;
            this.score += 60;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 25,
                y: y,
                vx: (Math.random() - 0.5) * 4.5,
                vy: (Math.random() - 0.5) * 4.5 - 2,
                life: 50 + Math.random() * 35,
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

        c.fillStyle = '#0a0a12';
        c.fillRect(0, 0, this.width, this.height);

        // Macchina
        c.fillStyle = '#0f0f18';
        c.fillRect(30, 20, this.width - 60, this.height - 35);

        c.strokeStyle = '#2a2a40';
        c.lineWidth = 5;
        c.strokeRect(30, 20, this.width - 60, this.height - 35);

        // Vetro
        c.fillStyle = 'rgba(15, 15, 45, 0.05)';
        c.fillRect(35, 25, this.width - 70, this.height - 45);

        // 500 Palline
        this.prizes.forEach(p => {
            c.shadowBlur = 2;
            c.shadowColor = '#4fc3f7';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = 'rgba(255,255,255,0.2)';
            c.beginPath();
            c.arc(p.x - p.size * 0.18, p.y - p.size * 0.18, p.size * 0.2, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#cccccc';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(this.clawX, 20);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        const openOffset = this.clawOpen ? 11 : 3;
        c.fillStyle = '#e8e8e8';

        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX - openOffset, this.clawY + 12);
        c.lineTo(this.clawX - openOffset + 3, this.clawY + 15);
        c.lineTo(this.clawX, this.clawY + 2);
        c.fill();

        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX + openOffset, this.clawY + 12);
        c.lineTo(this.clawX + openOffset - 3, this.clawY + 15);
        c.lineTo(this.clawX, this.clawY + 2);
        c.fill();

        // Particelle
        this.particles.forEach(p => {
            c.globalAlpha = p.life / 70;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        // UI
        c.fillStyle = '#fff';
        c.font = 'bold 17px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 18);

        c.font = '12px Inter, sans-serif';
        c.fillText('← → = Muovi   |   SPAZIO o INVIO = Fai scendere', this.width / 2, this.height - 8);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARISSIMO') ? 'bold 30px Inter, sans-serif' : 'bold 20px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        c.fillStyle = '#55efc4';
        c.font = 'bold 14px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 20, 18);
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
