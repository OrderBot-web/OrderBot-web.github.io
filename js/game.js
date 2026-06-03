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
        this.clawY = 95;
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
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveClaw(-16);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveClaw(16);
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
        this.clawX = Math.max(105, Math.min(this.width - 105, this.clawX + amount));
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 95;
        this.clawState = 'idle';
        this.clawOpen = true;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.prizes = [];

        // 110 palline
        for (let i = 0; i < 110; i++) {
            const isRare = Math.random() < 0.01; // 1% raro
            this.prizes.push({
                x: 85 + Math.random() * (this.width - 170),
                y: 280 + Math.random() * 230,
                size: isRare ? 19 : 16,
                type: isRare ? 'rare' : 'normal',
                color: '#4fc3f7'
            });
        }
    }

    dropClaw() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'dropping';
        this.clawOpen = true;
    }

    update() {
        if (!this.running) return;

        if (this.clawState === 'dropping') {
            this.clawY += 5.8;

            if (this.clawY > 500) {
                this.clawState = 'grabbing';
                this.clawOpen = false;
            }
        }

        if (this.clawState === 'grabbing') {
            let grabbed = false;

            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);

                const chance = p.type === 'rare' ? 0.82 : 0.33;

                if (dist < p.size + 11 && Math.random() < chance) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    grabbed = true;
                    break;
                }
            }

            setTimeout(() => {
                if (this.clawState === 'grabbing') this.clawState = 'returning';
            }, 120);
        }

        if (this.clawState === 'returning') {
            this.clawY -= 7;

            if (this.clawY <= 95) {
                this.clawY = 95;
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
            this.score += 3000;
            this.createParticles(this.clawX, this.clawY - 10, 65, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 55;
            this.score += 80;
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
                    content: `🎰 **Qualcuno ha vinto il PREMIO** nella Macchina a Gancio!`,
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
        c.fillStyle = '#12121c';
        c.fillRect(40, 30, this.width - 80, this.height - 45);

        c.strokeStyle = '#32324a';
        c.lineWidth = 6;
        c.strokeRect(40, 30, this.width - 80, this.height - 45);

        // Vetro
        c.fillStyle = 'rgba(25, 25, 55, 0.08)';
        c.fillRect(45, 35, this.width - 90, this.height - 55);

        // 110 Palline
        this.prizes.forEach(p => {
            c.shadowBlur = 4;
            c.shadowColor = '#4fc3f7';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            // Riflesso
            c.fillStyle = 'rgba(255,255,255,0.25)';
            c.beginPath();
            c.arc(p.x - p.size * 0.22, p.y - p.size * 0.22, p.size * 0.25, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#cccccc';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(this.clawX, 30);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        const openOffset = this.clawOpen ? 13 : 4;
        c.fillStyle = '#e8e8e8';

        // Sinistra
        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX - openOffset, this.clawY + 16);
        c.lineTo(this.clawX - openOffset + 4, this.clawY + 19);
        c.lineTo(this.clawX, this.clawY + 3);
        c.fill();

        // Destra
        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX + openOffset, this.clawY + 16);
        c.lineTo(this.clawX + openOffset - 4, this.clawY + 19);
        c.lineTo(this.clawX, this.clawY + 3);
        c.fill();

        // Particelle
        this.particles.forEach(p => {
            c.globalAlpha = p.life / 70;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        // UI
        c.fillStyle = '#fff';
        c.font = 'bold 19px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 25);

        c.font = '14px Inter, sans-serif';
        c.fillText('← → = Muovi   |   SPAZIO o INVIO = Fai scendere', this.width / 2, this.height - 12);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARISSIMO') ? 'bold 34px Inter, sans-serif' : 'bold 24px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        c.fillStyle = '#55efc4';
        c.font = 'bold 16px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 30, 25);
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
