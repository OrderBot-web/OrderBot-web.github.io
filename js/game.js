/**
 * GALAXY WORLD - Macchina a Gancio (Versione Figa)
 * Grafica migliorata + Webhook su premio raro
 */

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
        this.clawY = 140;
        this.clawState = 'idle'; // idle, moving, returning
        this.prizes = [];
        this.wonPrize = null;

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
            if ((e.code === 'Space' || e.code === 'Enter') && this.clawState === 'idle') {
                this.startGrab();
            }
            if (e.code === 'Escape') {
                this.running = false;
                document.getElementById('game-container').classList.remove('active');
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.canvas.addEventListener('click', () => {
            if (this.clawState === 'idle') this.startGrab();
        });

        this.resetClawMachine();
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 140;
        this.clawState = 'idle';
        this.wonPrize = null;
        this.message = '';
        this.messageTimer = 0;
        this.particles = [];

        this.prizes = [];
        for (let i = 0; i < 14; i++) {
            const isRare = Math.random() < 0.10; // 10% raro
            this.prizes.push({
                x: 160 + (i % 7) * 115,
                y: 380 + Math.floor(i / 7) * 85,
                size: isRare ? 38 : 32,
                type: isRare ? 'rare' : 'normal',
                color: isRare ? '#ffd700' : '#7ed6ff',
                glow: isRare
            });
        }
    }

    startGrab() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'moving';
    }

    update() {
        if (!this.running) return;

        // Movimento artiglio
        if (this.clawState === 'moving') {
            this.clawY += 6.5;

            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);

                if (dist < p.size + 20) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.checkWin();
                    break;
                }
            }

            if (this.clawY > 540) {
                this.clawState = 'returning';
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 8;
            if (this.clawY <= 140) {
                this.clawY = 140;
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
            this.messageTimer = 220;
            this.score += 800;
            this.createWinParticles(this.clawX, this.clawY);
            this.sendDiscordWebhook();
        } else {
            this.message = 'Hai vinto!';
            this.messageTimer = 100;
            this.score += 80;
        }
    }

    createWinParticles(x, y) {
        for (let i = 0; i < 35; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 1,
                life: 60 + Math.random() * 40,
                color: '#ffd700'
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
                        description: `Un giocatore ha ottenuto il premio leggendario!\nPunteggio: **${this.score}**`,
                        color: 0xf9ca24
                    }]
                })
            });
        } catch (e) {}
    }

    draw() {
        const c = this.ctx;

        // Sfondo
        c.fillStyle = '#05050a';
        c.fillRect(0, 0, this.width, this.height);

        // Macchina (cornice)
        c.fillStyle = '#1f1f2e';
        c.fillRect(80, 70, this.width - 160, this.height - 100);
        c.strokeStyle = '#3a3a5c';
        c.lineWidth = 8;
        c.strokeRect(80, 70, this.width - 160, this.height - 100);

        // Vetro effetto
        c.fillStyle = 'rgba(30, 30, 50, 0.3)';
        c.fillRect(90, 80, this.width - 180, this.height - 120);

        // Premi
        this.prizes.forEach(p => {
            c.shadowBlur = p.glow ? 25 : 8;
            c.shadowColor = p.glow ? '#ffd700' : '#4a9eff';

            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();

            // Bordo
            c.strokeStyle = p.glow ? '#fff' : '#ffffff55';
            c.lineWidth = p.glow ? 4 : 2;
            c.stroke();

            c.shadowBlur = 0;
        });

        // Braccio
        c.strokeStyle = '#bbbbcc';
        c.lineWidth = 10;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(this.clawX, 70);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        c.fillStyle = '#ddd';
        c.beginPath();
        c.moveTo(this.clawX - 26, this.clawY);
        c.lineTo(this.clawX, this.clawY + 32);
        c.lineTo(this.clawX + 26, this.clawY);
        c.fill();

        c.strokeStyle = '#aaa';
        c.lineWidth = 3;
        c.stroke();

        // Particelle
        this.particles.forEach(p => {
            c.globalAlpha = p.life / 80;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 4, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        // Testo
        c.fillStyle = '#fff';
        c.font = 'bold 28px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('🎰  MACCHINA A GANCIO  🎰', this.width / 2, 50);

        c.font = '18px Inter, sans-serif';
        c.fillText('Premi SPAZIO o clicca per far scendere il braccio', this.width / 2, this.height - 30);

        // Messaggio vincita
        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARISSIMO') 
                ? 'bold 42px Inter, sans-serif' 
                : 'bold 32px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2 - 20);
        }

        // Punteggio
        c.fillStyle = '#55efc4';
        c.font = 'bold 24px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 50, 50);
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
