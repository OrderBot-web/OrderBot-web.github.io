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
        this.clawY = 110;
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
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.moveClaw(-18);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.moveClaw(18);
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
        this.clawX = Math.max(120, Math.min(this.width - 120, this.clawX + amount));
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 110;
        this.clawState = 'idle';
        this.clawOpen = true;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.prizes = [];

        // Riempie la macchina di tante palline piccole
        for (let i = 0; i < 45; i++) {
            const isRare = Math.random() < 0.07; // 7% sono rare (ma non si vede)
            this.prizes.push({
                x: 100 + Math.random() * (this.width - 200),
                y: 320 + Math.random() * 190,
                size: isRare ? 22 : 19,
                type: isRare ? 'rare' : 'normal',
                color: '#4fc3f7' // Tutte dello stesso colore
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
            this.clawY += 6.5;

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

                // Probabilità di presa più realistica
                let chance = p.type === 'rare' ? 0.78 : 0.38;

                if (dist < p.size + 14 && Math.random() < chance) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    grabbed = true;
                    break;
                }
            }

            setTimeout(() => {
                this.clawState = 'returning';
            }, 160);
        }

        if (this.clawState === 'returning') {
            this.clawY -= 7.5;
            if (this.clawY <= 110) {
                this.clawY = 110;
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
            this.messageTimer = 200;
            this.score += 1500;
            this.createParticles(this.clawX, this.clawY, 50, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 70;
            this.score += 100;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 45 + Math.random() * 30,
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
                        title: "🎁 Vincita Rara",
                        description: `Punteggio: **${this.score}**`,
                        color: 0xf9ca24
                    }]
                })
            });
        } catch (e) {}
    }

    draw() {
        const c = this.ctx;

        // Sfondo scuro
        c.fillStyle = '#0a0a12';
        c.fillRect(0, 0, this.width, this.height);

        // Macchina (cornice + interno)
        c.fillStyle = '#151520';
        c.fillRect(55, 45, this.width - 110, this.height - 65);
        
        c.strokeStyle = '#3a3a55';
        c.lineWidth = 7;
        c.strokeRect(55, 45, this.width - 110, this.height - 65);

        // Effetto vetro
        c.fillStyle = 'rgba(40, 40, 70, 0.15)';
        c.fillRect(60, 50, this.width - 120, this.height - 75);

        // Palline (tutte uguali visivamente)
        this.prizes.forEach(p => {
            c.shadowBlur = 6;
            c.shadowColor = '#4fc3f7';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            // Riflesso
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.beginPath();
            c.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#bbbbbb';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(this.clawX, 45);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        const open = this.clawOpen ? 16 : 5;
        c.fillStyle = '#e0e0e0';

        // Sinistra
        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX - open, this.clawY + 22);
        c.lineTo(this.clawX - open + 6, this.clawY + 25);
        c.lineTo(this.clawX, this.clawY + 6);
        c.fill();

        // Destra
        c.beginPath();
        c.moveTo(this.clawX, this.clawY);
        c.lineTo(this.clawX + open, this.clawY + 22);
        c.lineTo(this.clawX + open - 6, this.clawY + 25);
        c.lineTo(this.clawX, this.clawY + 6);
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

        // Testi
        c.fillStyle = '#ffffff';
        c.font = 'bold 22px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 35);

        c.font = '15px Inter, sans-serif';
        c.fillText('← → = Muovi   |   SPAZIO = Scendi', this.width / 2, this.height - 18);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#ffffff';
            c.font = this.message.includes('RARISSIMO') ? 'bold 36px Inter, sans-serif' : 'bold 26px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        c.fillStyle = '#55efc4';
        c.font = 'bold 18px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 40, 35);
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
