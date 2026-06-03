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
        this.isMobile = false;

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

        // Rileva se è un dispositivo mobile
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (this.isMobile) {
            this.createMobileControls();
        }

        this.resetClawMachine();
    }

    // ==================== CONTROLLI MOBILE ====================
    createMobileControls() {
        const controls = document.createElement('div');
        controls.id = 'mobile-controls';
        controls.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            z-index: 9999;
            user-select: none;
            touch-action: none;
        `;

        controls.innerHTML = `
            <button id="btn-left" style="width:70px;height:70px;font-size:32px;border-radius:50%;background:#1f1f2e;color:white;border:3px solid #555;">←</button>
            <button id="btn-drop" style="width:85px;height:70px;font-size:26px;border-radius:12px;background:#c0392b;color:white;border:3px solid #e74c3c;font-weight:bold;">↓</button>
            <button id="btn-right" style="width:70px;height:70px;font-size:32px;border-radius:50%;background:#1f1f2e;color:white;border:3px solid #555;">→</button>
        `;

        document.body.appendChild(controls);

        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnDrop = document.getElementById('btn-drop');

        let intervalLeft = null;
        let intervalRight = null;

        // Sinistra (movimento continuo)
        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveClaw(-18);
            intervalLeft = setInterval(() => this.moveClaw(-18), 110);
        });
        btnLeft.addEventListener('touchend', () => clearInterval(intervalLeft));
        btnLeft.addEventListener('touchcancel', () => clearInterval(intervalLeft));

        // Destra (movimento continuo)
        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveClaw(18);
            intervalRight = setInterval(() => this.moveClaw(18), 110);
        });
        btnRight.addEventListener('touchend', () => clearInterval(intervalRight));
        btnRight.addEventListener('touchcancel', () => clearInterval(intervalRight));

        // Scendi
        btnDrop.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.dropClaw();
        });

        // Supporto mouse (per test)
        btnLeft.addEventListener('mousedown', () => {
            this.moveClaw(-18);
            intervalLeft = setInterval(() => this.moveClaw(-18), 110);
        });
        btnLeft.addEventListener('mouseup', () => clearInterval(intervalLeft));
        btnLeft.addEventListener('mouseleave', () => clearInterval(intervalLeft));

        btnRight.addEventListener('mousedown', () => {
            this.moveClaw(18);
            intervalRight = setInterval(() => this.moveClaw(18), 110);
        });
        btnRight.addEventListener('mouseup', () => clearInterval(intervalRight));
        btnRight.addEventListener('mouseleave', () => clearInterval(intervalRight));

        btnDrop.addEventListener('click', () => this.dropClaw());
    }

    moveClaw(amount) {
        if (this.clawState !== 'idle') return;
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
        const winningBalls = 25;

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
            p.x += p.vx; p.y += p.vy; p.life--;
            return p.life > 0;
        });

        if (this.messageTimer > 0) this.messageTimer--;
    }

    checkWin() {
        if (!this.wonPrize) return;

        if (this.wonPrize.type === 'rare') {
            this.message = '🎉 PREMIO RARO!';
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
                    content: `🎰 **${playerName}** ha vinto il **PREMIO RARO** nella Macchina a Gancio!`,
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

        c.fillStyle = '#11111a';
        c.fillRect(35, 22, this.width - 70, this.height - 38);
        c.strokeStyle = '#2a2a42';
        c.lineWidth = 5;
        c.strokeRect(35, 22, this.width - 70, this.height - 38);

        c.fillStyle = 'rgba(15,15,45,0.06)';
        c.fillRect(40, 27, this.width - 80, this.height - 48);

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

        c.strokeStyle = '#cccccc';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(this.clawX, 22);
        c.lineTo(this.clawX, this.clawY);
        c.stroke();

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

        this.particles.forEach(p => {
            c.globalAlpha = p.life / 70;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        c.fillStyle = '#fff';
        c.font = 'bold 18px Inter, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO', this.width / 2, 18);

        c.font = '13px Inter, sans-serif';
        c.fillText('← → = Muovi | SPAZIO o INVIO = Fai scendere', this.width / 2, this.height - 10);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARO') ? '#ffd700' : '#fff';
            c.font = this.message.includes('RARO') ? 'bold 32px Inter, sans-serif' : 'bold 22px Inter, sans-serif';
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
