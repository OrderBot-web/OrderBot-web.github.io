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
        this.clawY = 90;
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
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveClaw(-15);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveClaw(15);
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
        this.clawX = Math.max(100, Math.min(this.width - 100, this.clawX + amount));
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 90;
        this.clawState = 'idle';
        this.clawOpen = true;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.prizes = [];

        const totalBalls = 250;
        const winningBalls = 25; // 25 palline vincenti

        for (let i = 0; i < totalBalls; i++) {
            const isWinning = i < winningBalls;
            this.prizes.push({
                x: 75 + Math.random() * (this.width - 150),
                y: 250 + Math.random() * 260,
                size: isWinning ? 18 : 15,
                type: isWinning ? 'rare' : 'normal',
                color: '#4fc3f7'
            });
        }

        // Mischia le palline
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
            this.clawY += 5.5;

            // Prende le palline ovunque mentre scende
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);

                const chance = p.type === 'rare' ? 0.85 : 0.30;

                if (dist < p.size + 10 && Math.random() < chance) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.clawOpen = false;
                    return;
                }
            }

            if (this.clawY > 515) {
                this.clawState = 'returning';
                this.clawOpen = false;
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 6.5;

            if (this.clawY <= 90) {
                this.clawY = 90;
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
            this.messageTimer = 230;
            this.score += 6000;
            this.createParticles(this.clawX, this.clawY - 8, 70, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 50;
            this.score += 70;
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

        const playerName = window.playerDiscordName || "Anonimo";

        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🎰 **${playerName}** ha vinto il **PREMIO RARISSIMO** nella Macchina a Gancio!`,
                    embeds: [{
                        title: "🎁 Vincita Rara - Macchina a Gancio",
                        description: `**${playerName}** ha ottenuto il premio leggendario!\nPunteggio: **${this.score}**`,
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
        c.fillStyle = '#11111a';
        c.fillRect(35, 22, this.width - 70, this.height - 38);

        c.strokeStyle = '#2a2a42';
        c.lineWidth = 5;
        c.strokeRect(35, 22, this.width - 70, this.height - 38);

        // Vetro
        c.fillStyle = 'rgba(15, 15, 45, 0.06)';
        c.fillRect(40, 27, this.width - 80, this.height - 48);

        // 250 Palline
        this.prizes.forEach(p => {
            c.shadowBlur = 3;
            c.shadowColor = '#4fc3f7';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = 'rgba(255,255,255,0.22)';
            c.beginPath();
            c.arc(p.x - p.size * 0.2, p.y - p.size * 0.2, p.size * 0.2, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#cccccc';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(this.clawX, 22);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        const openOffset = this.clawOpen ? 12 : 3;
        c.fillStyle = '#e8e8e8';

        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX - openOffset, this.clawY + 14);
        c.lineTo(this.clawX - openOffset + 3, this.clawY + 17);
        c.lineTo(this.clawX, this.clawY + 2);
        c.fill();

        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX + openOffset, this.clawY + 14);
        c.lineTo(this.clawX + openOffset - 3, this.clawY + 17);
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
        c.font = 'bold 18px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 18);

        c.font = '13px Inter, sans-serif';
        c.fillText('← → = Muovi   |   SPAZIO o INVIO = Fai scendere', this.width / 2, this.height - 10);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARISSIMO') ? 'bold 32px Inter, sans-serif' : 'bold 22px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        c.fillStyle = '#55efc4';
        c.font = 'bold 15px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 25, 18);
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
