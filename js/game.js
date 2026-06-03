/**
 * GALAXY WORLD - Macchina a Gancio Arcade (Versione Pulita)
 * Rimossa Easter Egg 5 click + Fix per bottone "Gioca al Minigioco"
 */

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/v10/webhooks/1511405598489575657/kfAincCiahPdZJjkF48XjUFPoeMlc9IhR6V575DS6eWllmXgXH7iWfZ1PnYxja1kgl5T';

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Stato base
        this.running = false;
        this.credits = 3000;
        this.score = 0;
        this.message = '';
        this.messageTimer = 0;

        // Macchina a Gancio
        this.clawX = 0;
        this.clawY = 0;
        this.clawState = 'idle'; // idle, moving, grabbing, returning
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

        // Controlli tastiera
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;

            if (e.code === 'Space' || e.code === 'Enter') {
                if (this.clawState === 'idle') this.startGrab();
            }
            if (e.code === 'Escape') {
                this.running = false;
                document.getElementById('game-container').classList.remove('active');
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        // Touch / Click
        this.canvas.addEventListener('click', () => {
            if (this.clawState === 'idle') this.startGrab();
        });

        this.resetClawMachine();
    }

    resetClawMachine() {
        this.clawX = this.width / 2;
        this.clawY = 120;
        this.clawState = 'idle';
        this.wonPrize = null;
        this.message = '';
        this.messageTimer = 0;

        // Crea premi
        this.prizes = [];
        for (let i = 0; i < 12; i++) {
            this.prizes.push({
                x: 200 + (i % 6) * 120,
                y: 420 + Math.floor(i / 6) * 80,
                size: 35,
                type: Math.random() < 0.15 ? 'rare' : 'normal', // 15% raro
                color: Math.random() < 0.15 ? '#f9ca24' : '#74b9ff'
            });
        }
    }

    startGrab() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'moving';
    }

    update() {
        if (!this.running) return;

        // Movimento del braccio
        if (this.clawState === 'moving') {
            this.clawY += 6;

            // Controlla collisione con premi
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

            if (this.clawY > 520) {
                this.clawState = 'returning';
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 8;
            if (this.clawY <= 120) {
                this.clawY = 120;
                this.clawState = 'idle';
            }
        }

        // Timer messaggio
        if (this.messageTimer > 0) this.messageTimer--;
    }

    checkWin() {
        if (!this.wonPrize) return;

        if (this.wonPrize.type === 'rare') {
            this.message = '🎉 HAI VINTO IL PREMIO RARISSIMO!';
            this.messageTimer = 180;
            this.score += 500;
            this.sendDiscordWebhook();
        } else {
            this.message = 'Hai vinto un premio!';
            this.messageTimer = 120;
            this.score += 50;
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
        } catch (e) {
            console.log("Webhook error:", e);
        }
    }

    draw() {
        const c = this.ctx;
        c.fillStyle = '#0a0a12';
        c.fillRect(0, 0, this.width, this.height);

        // Sfondo macchina
        c.fillStyle = '#1a1a2e';
        c.fillRect(80, 80, this.width - 160, this.height - 160);

        // Premi
        this.prizes.forEach(p => {
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
            if (p.type === 'rare') {
                c.strokeStyle = '#fff';
                c.lineWidth = 3;
                c.stroke();
            }
        });

        // Braccio / Artiglio
        c.strokeStyle = '#aaa';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(this.clawX, 80);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        // Artiglio
        c.fillStyle = '#ccc';
        c.beginPath();
        c.moveTo(this.clawX - 25, this.clawY);
        c.lineTo(this.clawX, this.clawY + 30);
        c.lineTo(this.clawX + 25, this.clawY);
        c.fill();

        // Testo
        c.fillStyle = '#fff';
        c.font = 'bold 24px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 50);

        c.font = '18px Inter, sans-serif';
        c.fillText('Premi SPAZIO o clicca per far scendere il braccio', this.width / 2, this.height - 40);

        // Messaggio vincita
        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#f9ca24' : '#fff';
            c.font = 'bold 32px Inter, sans-serif';
            c.fillText(this.message, this.width / 2, this.height / 2);
        }

        // Punteggio
        c.fillStyle = '#55efc4';
        c.font = 'bold 20px Inter, sans-serif';
        c.textAlign = 'left';
        c.fillText(`Punti: ${this.score}`, 40, 50);
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
