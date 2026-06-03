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

        const totalBalls = 220;
        const rareCount = 12;

        for (let i = 0; i < totalBalls; i++) {
            const isRare = i < rareCount;
            this.prizes.push({
                x: 80 + Math.random() * (this.width - 160),
                y: 260 + Math.random() * 240,
                size: isRare ? 22 : 17,
                type: isRare ? 'brawler' : 'skull',
                color: isRare ? this.getRandomBrawlerColor() : '#f1c40f',
                brawlerName: isRare ? this.getRandomBrawlerName() : null
            });
        }
        this.prizes.sort(() => Math.random() - 0.5);
    }

    getRandomBrawlerColor() {
        const colors = ['#e74c3c', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#f39c12', '#8e44ad', '#27ae60'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomBrawlerName() {
        const names = ['Spike', 'Shelly', 'Colt', 'Bull', 'Brock', 'Crow', 'Leon', 'Nita', 'Jessie', 'Dynamike'];
        return names[Math.floor(Math.random() * names.length)];
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
            for (let i = 0; i < this.prizes.length; i++) {
                const p = this.prizes[i];
                const dist = Math.hypot(this.clawX - p.x, this.clawY - p.y);
                const chance = p.type === 'brawler' ? 0.82 : 0.28;
                if (dist < p.size + 12 && Math.random() < chance) {
                    this.wonPrize = p;
                    this.prizes.splice(i, 1);
                    this.clawState = 'returning';
                    this.clawOpen = false;
                    return;
                }
            }
            if (this.clawY > 520) {
                this.clawState = 'returning';
                this.clawOpen = false;
            }
        }

        if (this.clawState === 'returning') {
            this.clawY -= 6.8;
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
        if (this.wonPrize.type === 'brawler') {
            this.message = `🎉 ${this.wonPrize.brawlerName || 'BRAWLER'}!`;
            this.messageTimer = 260;
            this.score += 6500;
            this.createParticles(this.clawX, this.clawY - 8, 85, '#ffd700');
            this.sendDiscordWebhook();
        } else {
            this.message = 'Preso!';
            this.messageTimer = 55;
            this.score += 85;
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 28,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2.5,
                life: 55 + Math.random() * 40,
                color: color
            });
        }
    }

    async sendDiscordWebhook() {
        if (!DISCORD_WEBHOOK_URL) return;
        const playerName = window.playerDiscordName || "Anonimo";
        const prizeName = this.wonPrize ? (this.wonPrize.brawlerName || 'PREMIO RARO') : 'PREMIO RARO';
        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🎰 **${playerName}** ha vinto **${prizeName}** nella Macchina a Gancio Brawl Stars!`,
                    embeds: [{
                        title: "🎁 Vincita Leggendaria - Claw Machine",
                        description: `**${playerName}** ha catturato **${prizeName}**!\nPunteggio totale: **${this.score}**`,
                        color: 0xf1c40f
                    }]
                })
            });
        } catch (e) {}
    }

    // ==================== DRAWING ====================

    drawBrawlerBall(p) {
        const c = this.ctx;
        const { x, y, size, color, brawlerName } = p;

        c.shadowBlur = 8;
        c.shadowColor = 'rgba(0,0,0,0.5)';
        
        c.fillStyle = color;
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.beginPath();
        c.arc(x - size * 0.28, y - size * 0.28, size * 0.32, 0, Math.PI * 2);
        c.fill();

        c.shadowBlur = 0;

        c.fillStyle = '#111';
        const eyeY = y - size * 0.15;
        const eyeSize = size * 0.22;

        c.beginPath();
        c.arc(x - size * 0.28, eyeY, eyeSize, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(x + size * 0.28, eyeY, eyeSize, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(x - size * 0.32, eyeY - size * 0.08, eyeSize * 0.35, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(x + size * 0.24, eyeY - size * 0.08, eyeSize * 0.35, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = '#111';
        c.lineWidth = Math.max(2, size * 0.08);
        c.beginPath();
        c.arc(x, y + size * 0.22, size * 0.28, 0.2 * Math.PI, 0.8 * Math.PI);
        c.stroke();

        if (brawlerName === 'Spike' || brawlerName === 'Crow' || brawlerName === 'Leon') {
            c.fillStyle = '#2c3e50';
            c.beginPath();
            c.ellipse(x, y - size * 0.75, size * 0.55, size * 0.22, 0, 0, Math.PI * 2);
            c.fill();
        } else if (brawlerName === 'Shelly' || brawlerName === 'Colt') {
            c.fillStyle = '#34495e';
            c.fillRect(x - size * 0.65, y - size * 0.82, size * 1.3, size * 0.18);
            c.fillStyle = color;
            c.beginPath();
            c.arc(x, y - size * 0.72, size * 0.38, 0, Math.PI, true);
            c.fill();
        }

        if (brawlerName && size > 18) {
            c.fillStyle = '#fff';
            c.font = `bold ${Math.max(9, size * 0.38)}px Inter, sans-serif`;
            c.textAlign = 'center';
            c.fillText(brawlerName.substring(0, 5), x, y + size + 14);
        }
    }

    drawSkullBall(p) {
        const c = this.ctx;
        const { x, y, size } = p;

        c.shadowBlur = 6;
        c.shadowColor = 'rgba(241, 196, 15, 0.4)';
        
        c.fillStyle = '#f1c40f';
        c.beginPath();
        c.arc(x, y, size, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.beginPath();
        c.arc(x - size * 0.25, y - size * 0.25, size * 0.3, 0, Math.PI * 2);
        c.fill();

        c.shadowBlur = 0;

        c.fillStyle = '#1a1a1a';
        const eyeY = y - size * 0.12;

        c.beginPath();
        c.ellipse(x - size * 0.32, eyeY, size * 0.26, size * 0.32, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(x + size * 0.32, eyeY, size * 0.26, size * 0.32, 0, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#111';
        c.beginPath();
        c.arc(x - size * 0.32, eyeY + 2, size * 0.12, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(x + size * 0.32, eyeY + 2, size * 0.12, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#111';
        c.beginPath();
        c.moveTo(x, y + size * 0.05);
        c.lineTo(x - size * 0.12, y + size * 0.22);
        c.lineTo(x + size * 0.12, y + size * 0.22);
        c.closePath();
        c.fill();

        c.strokeStyle = '#111';
        c.lineWidth = Math.max(2.5, size * 0.09);
        c.beginPath();
        c.arc(x, y + size * 0.32, size * 0.32, 0.15 * Math.PI, 0.85 * Math.PI);
        c.stroke();

        c.lineWidth = Math.max(1.5, size * 0.06);
        for (let i = -1; i <= 1; i++) {
            const tx = x + i * size * 0.18;
            c.beginPath();
            c.moveTo(tx, y + size * 0.18);
            c.lineTo(tx, y + size * 0.42);
            c.stroke();
        }

        if (Math.random() > 0.6) {
            c.fillStyle = '#3498db';
            c.beginPath();
            c.ellipse(x, y - size * 0.68, size * 0.7, size * 0.18, 0, 0, Math.PI * 2);
            c.fill();
        }
    }

    drawEagleClaw(x, y, openOffset) {
        const c = this.ctx;

        // Metal arm
        c.strokeStyle = '#5a6a7a';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(x, 25);
        c.lineTo(x, y - 35);
        c.stroke();

        c.fillStyle = '#4a5568';
        c.fillRect(x - 14, y - 42, 28, 18);
        c.strokeStyle = '#2d3748';
        c.lineWidth = 2;
        c.strokeRect(x - 14, y - 42, 28, 18);

        // === AQUILA BRAWL STARS ===
        const headY = y - 28;
        const headScale = 1.0;

        // Testa
        c.fillStyle = '#8B5A2B';
        c.beginPath();
        c.ellipse(x, headY, 38 * headScale, 32 * headScale, 0, 0, Math.PI * 2);
        c.fill();

        // Elmetto
        c.fillStyle = '#6B4423';
        c.beginPath();
        c.ellipse(x, headY - 8, 36 * headScale, 22 * headScale, 0, 0, Math.PI * 2);
        c.fill();

        // Ali
        c.fillStyle = '#8B5A2B';
        c.beginPath();
        c.moveTo(x - 32, headY - 5);
        c.quadraticCurveTo(x - 72, headY - 25, x - 68, headY + 18);
        c.quadraticCurveTo(x - 55, headY + 5, x - 32, headY + 8);
        c.fill();

        c.beginPath();
        c.moveTo(x + 32, headY - 5);
        c.quadraticCurveTo(x + 72, headY - 25, x + 68, headY + 18);
        c.quadraticCurveTo(x + 55, headY + 5, x + 32, headY + 8);
        c.fill();

        c.strokeStyle = '#5C3A1E';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(x - 45, headY - 8);
        c.lineTo(x - 62, headY + 5);
        c.stroke();
        c.beginPath();
        c.moveTo(x + 45, headY - 8);
        c.lineTo(x + 62, headY + 5);
        c.stroke();

        // Macchia bianca fronte
        c.fillStyle = '#f5f5f5';
        c.beginPath();
        c.arc(x, headY - 18, 11, 0, Math.PI * 2);
        c.fill();

        // Occhi gialli arrabbiati
        c.fillStyle = '#FFD700';
        const eyeY = headY - 6;
        c.beginPath();
        c.ellipse(x - 16, eyeY, 9, 7, -0.3, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(x + 16, eyeY, 9, 7, 0.3, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = '#111';
        c.beginPath();
        c.ellipse(x - 17, eyeY - 1, 4.5, 3.5, -0.4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(x + 17, eyeY - 1, 4.5, 3.5, 0.4, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = '#111';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x - 26, eyeY - 8);
        c.lineTo(x - 8, eyeY - 3);
        c.stroke();
        c.beginPath();
        c.moveTo(x + 26, eyeY - 8);
        c.lineTo(x + 8, eyeY - 3);
        c.stroke();

        // Becco
        c.fillStyle = '#F4A460';
        c.beginPath();
        c.moveTo(x, headY + 8);
        c.lineTo(x - 14, headY + 32);
        c.lineTo(x + 14, headY + 32);
        c.closePath();
        c.fill();

        c.fillStyle = '#FFE4B5';
        c.beginPath();
        c.moveTo(x - 6, headY + 12);
        c.lineTo(x - 10, headY + 26);
        c.lineTo(x - 2, headY + 26);
        c.closePath();
        c.fill();

        c.strokeStyle = '#CD853F';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(x, headY + 8);
        c.lineTo(x, headY + 30);
        c.stroke();

        // Artigli metallici
        const clawBaseY = y + 5;
        
        c.fillStyle = '#4a5568';
        c.fillRect(x - 11, clawBaseY - 5, 22, 12);
        c.strokeStyle = '#2d3748';
        c.lineWidth = 2;
        c.strokeRect(x - 11, clawBaseY - 5, 22, 12);

        c.fillStyle = '#718096';
        c.beginPath();
        c.moveTo(x - 8, clawBaseY + 6);
        c.lineTo(x - (openOffset + 8), clawBaseY + 22);
        c.lineTo(x - (openOffset + 3), clawBaseY + 26);
        c.lineTo(x - 5, clawBaseY + 10);
        c.closePath();
        c.fill();
        c.strokeStyle = '#2d3748';
        c.stroke();

        c.beginPath();
        c.moveTo(x + 8, clawBaseY + 6);
        c.lineTo(x + (openOffset + 8), clawBaseY + 22);
        c.lineTo(x + (openOffset + 3), clawBaseY + 26);
        c.lineTo(x + 5, clawBaseY + 10);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = '#2d3748';
        c.beginPath();
        c.moveTo(x - (openOffset + 8), clawBaseY + 22);
        c.lineTo(x - (openOffset + 3), clawBaseY + 26);
        c.lineTo(x - (openOffset + 12), clawBaseY + 24);
        c.closePath();
        c.fill();
        
        c.beginPath();
        c.moveTo(x + (openOffset + 8), clawBaseY + 22);
        c.lineTo(x + (openOffset + 3), clawBaseY + 26);
        c.lineTo(x + (openOffset + 12), clawBaseY + 24);
        c.closePath();
        c.fill();
    }

    draw() {
        const c = this.ctx;

        c.fillStyle = '#0a0a12';
        c.fillRect(0, 0, this.width, this.height);

        c.fillStyle = '#0f0f1e';
        c.fillRect(45, 35, this.width - 90, this.height - 55);

        c.strokeStyle = '#3a3a5a';
        c.lineWidth = 8;
        c.strokeRect(45, 35, this.width - 90, this.height - 55);

        c.fillStyle = 'rgba(180, 200, 255, 0.06)';
        c.fillRect(52, 42, this.width - 104, this.height - 68);

        // Top verde fluffy Brawl Stars
        c.fillStyle = '#2ecc71';
        c.beginPath();
        c.moveTo(50, 38);
        c.quadraticCurveTo(this.width / 2, 8, this.width - 50, 38);
        c.lineTo(this.width - 50, 55);
        c.lineTo(50, 55);
        c.closePath();
        c.fill();

        c.fillStyle = '#58d68d';
        c.beginPath();
        c.moveTo(55, 40);
        c.quadraticCurveTo(this.width / 2, 18, this.width - 55, 40);
        c.lineTo(this.width - 55, 52);
        c.lineTo(55, 52);
        c.closePath();
        c.fill();

        // Viti
        c.strokeStyle = '#27ae60';
        c.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const vx = 80 + i * (this.width - 160) / 4;
            c.beginPath();
            c.moveTo(vx, 52);
            c.quadraticCurveTo(vx + 15, 35, vx + 30, 48);
            c.stroke();
        }

        this.prizes.forEach(p => {
            if (p.type === 'brawler') {
                this.drawBrawlerBall(p);
            } else {
                this.drawSkullBall(p);
            }
        });

        const openOffset = this.clawOpen ? 14 : 4;
        this.drawEagleClaw(this.clawX, this.clawY, openOffset);

        this.particles.forEach(p => {
            c.globalAlpha = p.life / 75;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        c.fillStyle = '#fff';
        c.font = 'bold 20px Inter, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('MACCHINA A GANCIO • BRAWL STARS', this.width / 2, 26);

        c.font = '13px Inter, system-ui, sans-serif';
        c.fillStyle = '#aaa';
        c.fillText('← → Muovi  |  SPAZIO / INVIO = Abbassa  |  ESC = Esci', this.width / 2, this.height - 14);

        if (this.message && this.messageTimer > 0) {
            c.fillStyle = this.message.includes('BRAWLER') || this.message.includes('🎉') ? '#ffd700' : '#fff';
            c.font = this.message.includes('BRAWLER') || this.message.includes('🎉') 
                ? 'bold 38px Inter, system-ui, sans-serif' 
                : 'bold 26px Inter, system-ui, sans-serif';
            c.textAlign = 'center';
            c.fillText(this.message, this.width / 2, this.height / 2 - 30);
        }

        // Barra punteggio in basso stile Brawl Stars
        c.fillStyle = 'rgba(46, 204, 113, 0.95)';
        c.fillRect(20, this.height - 52, 220, 38);
        c.strokeStyle = '#27ae60';
        c.lineWidth = 3;
        c.strokeRect(20, this.height - 52, 220, 38);

        c.fillStyle = '#fff';
        c.font = 'bold 16px Inter, system-ui, sans-serif';
        c.textAlign = 'left';
        c.fillText(`⚡ ${this.score}`, 35, this.height - 28);

        c.fillStyle = '#f1c40f';
        c.font = 'bold 15px Inter, system-ui, sans-serif';
        c.fillText(`☠ ${this.prizes.filter(p => p.type === 'brawler').length}`, 145, this.height - 28);
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
