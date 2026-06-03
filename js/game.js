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

        this.clawX = 0;
        this.clawY = 120;
        this.clawState = 'idle';
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
            if ((e.code === 'Space' || e.code === 'Enter') && this.clawState === 'idle') this.startGrab();
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
        this.clawY = 120;
        this.clawState = 'idle';
        this.wonPrize = null;
        this.message = '';
        this.messageTimer = 0;

        this.prizes = [];
        for (let i = 0; i < 12; i++) {
            this.prizes.push({
                x: 180 + (i % 6) * 130,
                y: 380 + Math.floor(i / 6) * 90,
                size: 32,
                type: Math.random() < 0.12 ? 'rare' : 'normal',
                color: Math.random() < 0.12 ? '#f9ca24' : '#74b9ff'
            });
        }
    }

    startGrab() {
        if (this.clawState !== 'idle') return;
        this.clawState = 'moving';
    }

    update() {
        if (!this.running) return;

        if (this.clawState === 'moving') {
            this.clawY += 7;
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                if (Math.hypot(this.clawX - p.x, this.clawY - p.y) < p.size + 25) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.checkWin();
                    break;
                }
            }
            if (this.clawY > 520) this.clawState = 'returning';
        }

        if (this.clawState === 'returning') {
            this.clawY -= 9;
            if (this.clawY <= 120) {
                this.clawY = 120;
                this.clawState = 'idle';
            }
        }

        if (this.messageTimer > 0) this.messageTimer--;
    }

    checkWin() {
        if (!this.wonPrize) return;

        if (this.wonPrize.type === 'rare') {
            this.message = '🎉 HAI VINTO IL PREMIO RARISSIMO!';
            this.messageTimer = 200;
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
        } catch (e) {}
    }

    draw() {
        const c = this.ctx;
        c.fillStyle = '#0a0a12';
        c.fillRect(0, 0, this.width, this.height);
        c.fillStyle = '#1a1a2e';
        c.fillRect(60, 60, this.width - 120, this.height - 120);

        this.prizes.forEach(p => {
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            c.fill();
            if (p.type === 'rare') {
                c.strokeStyle = '#fff';
                c.lineWidth = 4;
                c.stroke();
            }
        });

        c.strokeStyle = '#aaa';
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(this.clawX, 60);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

        c.fillStyle = '#ddd';
        c.beginPath();
        c.moveTo(this.clawX - 22, this.clawY);
        c.lineTo(this.clawX, this.clawY + 28);
        c.lineTo(this.clawX + 22, this.clawY);
        c.fill();

        c.fillStyle = '#fff';
        c.font = 'bold 26px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 45);

        c.font = '18px Inter, sans-serif';
        c.fillText('Premi SPAZIO o clicca per far scendere il braccio', this.width / 2, this.height - 35);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARISSIMO') ? '#f9ca24' : '#fff';
            c.font = 'bold 34px Inter, sans-serif';
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
