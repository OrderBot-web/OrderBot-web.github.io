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
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (this.isMobile) {
            this.createMobileControls();
        }
        this.resetClawMachine();
    }

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

        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveClaw(-18);
            intervalLeft = setInterval(() => this.moveClaw(-18), 110);
        });
        btnLeft.addEventListener('touchend', () => clearInterval(intervalLeft));
        btnLeft.addEventListener('touchcancel', () => clearInterval(intervalLeft));

        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.moveClaw(18);
            intervalRight = setInterval(() => this.moveClaw(18), 110);
        });
        btnRight.addEventListener('touchend', () => clearInterval(intervalRight));
        btnRight.addEventListener('touchcancel', () => clearInterval(intervalRight));

        btnDrop.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.dropClaw();
        });

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

        const totalBalls = 240;
        const rareCount = 14;

        for (let i = 0; i < totalBalls; i++) {
            const isRare = i < rareCount;
            this.prizes.push({
                x: 75 + Math.random() * (this.width - 150),
                y: 255 + Math.random() * 255,
                size: isRare ? 20 : 16,
                type: isRare ? 'rare' : 'skull',
                expression: Math.floor(Math.random() * 4),
                hasBandana: Math.random() > 0.65
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
            this.clawY += 5.6;
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);
                const chance = p.type === 'rare' ? 0.80 : 0.26;
                if (dist < p.size + 11 && Math.random() < chance) {
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
            this.clawY -= 6.6;
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
            this.messageTimer = 240;
            this.score += 6200;
            this.createParticles(this.clawX, this.clawY - 8, 80, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 50;
            this.score += 75;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 26,
                y: y,
                vx: (Math.random() - 0.5) * 4.8,
                vy: (Math.random() - 0.5) * 4.8 - 2,
                life: 50 + Math.random() * 38,
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
                    content: `🎰 **${playerName}** ha vinto il **PREMIO RARO** nella Macchina a Gancio Brawl Stars!`,
                    embeds: [{
                        title: "🎁 Vincita Rara - Claw Machine",
                        description: `**${playerName}** ha ottenuto il premio leggendario!\nPunteggio: **${this.score}**`,
                        color: 0xf1c40f
                    }]
                })
            });
        } catch (e) {}
    }

    drawSkullBall(p) {
        const c = this.ctx;
        const { x, y, size, expression, hasBandana } = p;

        c.shadowBlur = 7;
        c.shadowColor = 'rgba(255, 220, 80, 0.35)';
        
        c.fillStyle = '#ffe066';
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.beginPath();
        c.arc(x - size * 0.26, y - size * 0.26, size * 0.28, 0, Math.PI * 2);
        c.fill();

        c.shadowBlur = 0;

        c.fillStyle = '#1a1a1a';
        const eyeY = y - size * 0.08;

        if (expression === 0) { // Angry
            c.save();
            c.translate(x - size * 0.32, eyeY);
            c.rotate(-0.35);
            c.beginPath();
            c.ellipse(0, 0, size * 0.24, size * 0.18, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();

            c.save();
            c.translate(x + size * 0.32, eyeY);
            c.rotate(0.35);
            c.beginPath();
            c.ellipse(0, 0, size * 0.24, size * 0.18, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();

            c.strokeStyle = '#111';
            c.lineWidth = Math.max(2, size * 0.07);
            c.beginPath();
            c.moveTo(x - size * 0.48, eyeY - size * 0.18);
            c.lineTo(x - size * 0.12, eyeY - size * 0.05);
            c.stroke();
            c.beginPath();
            c.moveTo(x + size * 0.48, eyeY - size * 0.18);
            c.lineTo(x + size * 0.12, eyeY - size * 0.05);
            c.stroke();

        } else if (expression === 1) { // Sleepy
            c.lineWidth = Math.max(3, size * 0.09);
            c.strokeStyle = '#111';
            c.beginPath();
            c.arc(x - size * 0.32, eyeY, size * 0.22, 0.2, Math.PI - 0.2);
            c.stroke();
            c.beginPath();
            c.arc(x + size * 0.32, eyeY, size * 0.22, 0.2, Math.PI - 0.2);
            c.stroke();

        } else {
            c.beginPath();
            c.ellipse(x - size * 0.32, eyeY, size * 0.23, size * 0.26, 0, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.ellipse(x + size * 0.32, eyeY, size * 0.23, size * 0.26, 0, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = '#111';
            c.beginPath();
            c.arc(x - size * 0.32, eyeY + 1, size * 0.11, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(x + size * 0.32, eyeY + 1, size * 0.11, 0, Math.PI * 2);
            c.fill();
        }

        c.fillStyle = '#111';
        c.beginPath();
        c.moveTo(x, y + size * 0.08);
        c.lineTo(x - size * 0.11, y + size * 0.22);
        c.lineTo(x + size * 0.11, y + size * 0.22);
        c.closePath();
        c.fill();

        c.strokeStyle = '#111';
        c.lineWidth = Math.max(2.2, size * 0.08);
        if (expression === 3) {
            c.beginPath();
            c.arc(x, y + size * 0.32, size * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
            c.stroke();
        } else {
            c.beginPath();
            c.arc(x, y + size * 0.30, size * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
            c.stroke();
        }

        c.lineWidth = Math.max(1.3, size * 0.05);
        for (let i = -1; i <= 1; i++) {
            const tx = x + i * size * 0.15;
            c.beginPath();
            c.moveTo(tx, y + size * 0.18);
            c.lineTo(tx, y + size * 0.38);
            c.stroke();
        }

        if (hasBandana) {
            c.fillStyle = '#4a9eff';
            c.beginPath();
            c.ellipse(x, y - size * 0.72, size * 0.72, size * 0.16, 0, 0, Math.PI * 2);
            c.fill();
            
            c.fillStyle = 'rgba(255,255,255,0.4)';
            c.beginPath();
            c.ellipse(x - size * 0.15, y - size * 0.74, size * 0.25, size * 0.06, 0, 0, Math.PI * 2);
            c.fill();
        }
    }

    drawClaw(x, y, openOffset) {
        const c = this.ctx;

        c.strokeStyle = '#5d6a7a';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(x, 28);
        c.lineTo(x, y - 28);
        c.stroke();

        c.fillStyle = '#5b8cff';
        c.beginPath();
        c.roundRect(x - 13, y - 32, 26, 16, 4);
        c.fill();
        c.strokeStyle = '#3a5fcc';
        c.lineWidth = 2;
        c.stroke();

        c.fillStyle = '#5b8cff';
        c.beginPath();
        c.moveTo(x - 9, y - 18);
        c.lineTo(x - (openOffset + 10), y + 18);
        c.lineTo(x - (openOffset + 4), y + 24);
        c.lineTo(x - 6, y - 12);
        c.closePath();
        c.fill();
        c.strokeStyle = '#3a5fcc';
        c.stroke();

        c.beginPath();
        c.moveTo(x + 9, y - 18);
        c.lineTo(x + (openOffset + 10), y + 18);
        c.lineTo(x + (openOffset + 4), y + 24);
        c.lineTo(x + 6, y - 12);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = '#3a5fcc';
        c.beginPath();
        c.moveTo(x - (openOffset + 10), y + 18);
        c.lineTo(x - (openOffset + 4), y + 24);
        c.lineTo(x - (openOffset + 14), y + 20);
        c.closePath();
        c.fill();

        c.beginPath();
        c.moveTo(x + (openOffset + 10), y + 18);
        c.lineTo(x + (openOffset + 4), y + 24);
        c.lineTo(x + (openOffset + 14), y + 20);
        c.closePath();
        c.fill();
    }

    draw() {
        const c = this.ctx;

        c.fillStyle = '#0b0b18';
        c.fillRect(0, 0, this.width, this.height);

        c.fillStyle = '#101022';
        c.fillRect(40, 30, this.width - 80, this.height - 50);

        c.strokeStyle = '#2a2a4a';
        c.lineWidth = 7;
        c.strokeRect(40, 30, this.width - 80, this.height - 50);

        const gradient = c.createRadialGradient(
            this.width / 2, 180, 80,
            this.width / 2, 320, 420
        );
        gradient.addColorStop(0, 'rgba(180, 210, 255, 0.12)');
        gradient.addColorStop(1, 'rgba(100, 140, 255, 0.03)');
        c.fillStyle = gradient;
        c.fillRect(48, 38, this.width - 96, this.height - 62);

        c.fillStyle = '#2ecc71';
        c.beginPath();
        c.moveTo(45, 32);
        c.quadraticCurveTo(this.width / 2, 2, this.width - 45, 32);
        c.lineTo(this.width - 45, 48);
        c.lineTo(45, 48);
        c.closePath();
        c.fill();

        c.fillStyle = '#58d68d';
        c.beginPath();
        c.moveTo(50, 34);
        c.quadraticCurveTo(this.width / 2, 10, this.width - 50, 34);
        c.lineTo(this.width - 50, 46);
        c.lineTo(50, 46);
        c.closePath();
        c.fill();

        c.strokeStyle = '#27ae60';
        c.lineWidth = 2.5;
        for (let i = 0; i < 6; i++) {
            const vx = 70 + i * (this.width - 140) / 5;
            c.beginPath();
            c.moveTo(vx, 46);
            c.quadraticCurveTo(vx + 12, 30, vx + 26, 42);
            c.stroke();
        }

        this.prizes.forEach(p => {
            this.drawSkullBall(p);
        });

        const openOffset = this.clawOpen ? 13 : 3;
        this.drawClaw(this.clawX, this.clawY, openOffset);

        this.particles.forEach(p => {
            c.globalAlpha = p.life / 70;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        c.fillStyle = '#ffffff';
        c.font = 'bold 19px Inter, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO • BRAWL STARS', this.width / 2, 23);

        c.font = '12.5px Inter, system-ui, sans-serif';
        c.fillStyle = '#aaaaaa';
        c.fillText('← → = Muovi   |   SPAZIO o INVIO = Abbassa   |   ESC = Esci', this.width / 2, this.height - 12);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('RARO') ? '#ffd700' : '#ffffff';
            c.font = this.message.includes('RARO') 
                ? 'bold 36px Inter, system-ui, sans-serif' 
                : 'bold 24px Inter, system-ui, sans-serif';
            c.textAlign = 'center';
            c.fillText(this.message, this.width / 2, this.height / 2 - 25);
        }

        c.fillStyle = 'rgba(46, 204, 113, 0.92)';
        c.fillRect(18, this.height - 48, 205, 35);
        c.strokeStyle = '#27ae60';
        c.lineWidth = 2.5;
        c.strokeRect(18, this.height - 48, 205, 35);

        c.fillStyle = '#ffffff';
        c.font = 'bold 15px Inter, system-ui, sans-serif';
        c.textAlign = 'left';
        c.fillText(`⚡ ${this.score}`, 32, this.height - 25);

        c.fillStyle = '#f1c40f';
        c.fillText(`☠ ${this.prizes.filter(p => p.type === 'rare').length}`, 138, this.height - 25);
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
