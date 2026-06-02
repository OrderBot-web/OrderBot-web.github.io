/**
 * MACCHINA A GANCIO ARCADE v1
 * Claw Machine Game - Vinci coins e RUOLI CUSTOM!
 * Canvas · Touch/Mouse · Webhook Discord · Stile arcade retrò
 */

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/v10/webhooks/1511405598489575657/kfAincCiahPdZJjkF48XjUFPoeMlc9IhR6V575DS6eWllmXgXH7iWfZ1PnYxja1kgl5T';

class ClawMachineGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.resize();

        this.running = false;
        this.credits = 1200;
        this.score = 0;
        this.totalWon = 0;
        this.plays = 0;
        this.attemptsLeft = 5;
        this.message = '';
        this.messageTimer = 0;
        this.showGuide = false;
        this._btnPressed = false;

        this.claw = {
            x: 0,
            targetX: 0,
            speed: 4.2,
            state: 'IDLE',
            dropSpeed: 5.5,
            retractSpeed: 3.8,
            grabOffset: 0
        };
        this.armLength = 0;
        this.maxArmLength = 210;

        this.prizes = [];
        this.particles = [];
        this.keys = {};
        this.mobileKeys = {};

        // Macchina più grande e centrata
        const mw = Math.min(720, this.width * 0.88);
        this.machine = {
            width: mw,
            height: Math.min(580, this.height * 0.75),
            left: (this.width - mw) / 2,
            top: 85,
            glassLeft: (this.width - mw) / 2 + 12,
            glassTop: 125,
            glassW: mw - 24,
            glassH: Math.min(430, this.height * 0.58)
        };

        this._genPrizes();
        this._initControls();
        this.start();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    _genPrizes() {
        this.prizes = [];
        const types = [
            { name: 'Pelouche Blu', value: 25, color: '#74b9ff', r: 18, rare: false },
            { name: 'Pelouche Verde', value: 30, color: '#55efc4', r: 17, rare: false },
            { name: 'Pelouche Rosa', value: 35, color: '#fd79a8', r: 19, rare: false },
            { name: 'Moneta Oro', value: 50, color: '#f9ca24', r: 14, rare: false },
            { name: 'Pelouche Raro', value: 80, color: '#a29bfe', r: 20, rare: true },
            { name: 'Tesoro', value: 120, color: '#e17055', r: 16, rare: true },
        ];

        for (let i = 0; i < 22; i++) {
            const t = types[Math.floor(Math.random() * types.length)];
            this.prizes.push({
                ...t,
                x: this.machine.glassLeft + 40 + Math.random() * (this.machine.glassW - 80),
                y: this.machine.glassTop + 120 + Math.random() * (this.machine.glassH - 160),
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.6,
                grabbed: false,
                id: i
            });
        }
    }

    _initControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Slash' || e.key === '?') this.showGuide = !this.showGuide;
            if (e.code === 'Escape') this.showGuide = false;
            if ((e.code === 'Space' || e.code === 'Enter') && this.claw.state === 'IDLE') this._startDrop();
            if (e.code === 'KeyR' && this.claw.state === 'IDLE') this._resetMachine();
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.canvas.addEventListener('mousedown', e => this._handlePointer(e));
        this.canvas.addEventListener('touchstart', e => this._handlePointer(e), { passive: false });
        window.addEventListener('resize', () => this.resize());
    }

    _handlePointer(e) {
        if (!this.running) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const my = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        const btnX = this.width - 240, btnY = this.height - 155;
        if (mx > btnX && mx < btnX + 210 && my > btnY && my < btnY + 85) {
            this._btnPressed = true;
            setTimeout(() => this._btnPressed = false, 120);
            if (this.claw.state === 'IDLE') this._startDrop();
            return;
        }

        const rX = btnX - 130, rY = btnY + 15;
        if (mx > rX && mx < rX + 110 && my > rY && my < rY + 55) {
            this._resetMachine();
            return;
        }

        const closeW = Math.min(190, this.width * 0.45);
        if (mx > 20 && mx < 20 + closeW && my > this.height - 88 && my < this.height - 36) {
            const container = document.getElementById('game-container');
            if (container) container.classList.remove('active');
            this.running = false;
            return;
        }

        if (this.claw.state === 'IDLE') {
            if (mx < this.width * 0.22) {
                this.mobileKeys['left'] = true;
                setTimeout(() => this.mobileKeys['left'] = false, 160);
            } else if (mx > this.width * 0.78) {
                this.mobileKeys['right'] = true;
                setTimeout(() => this.mobileKeys['right'] = false, 160);
            } else if (my > this.height * 0.65) {
                this._startDrop();
            }
        }
    }

    _startDrop() {
        if (this.claw.state !== 'IDLE') return;

        if (this.attemptsLeft > 0) {
            this.attemptsLeft--;
        } else {
            if (this.credits < 150) {
                this.message = 'Crediti insufficienti (150 coins)';
                this.messageTimer = 90;
                return;
            }
            this.credits -= 150;
        }

        this.plays++;
        this.claw.state = 'DROPPING';
        this.armLength = 40;
        this.claw.grabOffset = 0;
    }

    _resetMachine() {
        if (this.claw.state !== 'IDLE') return;
        this._genPrizes();
        this.message = 'Macchina ricaricata!';
        this.messageTimer = 90;
    }

    update() {
        if (!this.running) return;

        let move = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.mobileKeys['left']) move -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.mobileKeys['right']) move += 1;

        if (move !== 0 && (this.claw.state === 'IDLE' || this.claw.state === 'MOVING')) {
            this.claw.state = 'MOVING';
            this.claw.targetX = Math.max(this.machine.glassLeft + 30, Math.min(this.machine.glassLeft + this.machine.glassW - 30, this.claw.x + move * this.claw.speed));
        } else if (move === 0 && this.claw.state === 'MOVING') {
            this.claw.state = 'IDLE';
        }

        this.claw.x += (this.claw.targetX - this.claw.x) * 0.18;

        switch (this.claw.state) {
            case 'DROPPING':
                this.armLength += this.claw.dropSpeed;
                if (this.armLength >= this.maxArmLength) {
                    this.armLength = this.maxArmLength;
                    this.claw.state = 'GRABBING';
                    this.claw.grabOffset = 12;
                    setTimeout(() => this._tryGrab(), 180);
                }
                break;
            case 'GRABBING':
                this.claw.grabOffset = Math.max(0, this.claw.grabOffset - 1.2);
                if (this.claw.grabOffset <= 0) this.claw.state = 'RETRACTING';
                break;
            case 'RETRACTING':
                this.armLength -= this.claw.retractSpeed;
                if (this.armLength <= 40) {
                    this.armLength = 40;
                    this._releasePrize();
                    this.claw.state = 'IDLE';
                }
                break;
        }

        this.prizes.forEach(p => {
            if (p.grabbed) {
                p.x = this.claw.x;
                p.y = this.machine.glassTop + 70 + this.armLength - 10;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.035;
                if (p.y > this.machine.glassTop + this.machine.glassH - 25) { p.y = this.machine.glassTop + this.machine.glassH - 25; p.vy *= -0.35; }
                if (p.x < this.machine.glassLeft + 25) { p.x = this.machine.glassLeft + 25; p.vx *= -0.6; }
                if (p.x > this.machine.glassLeft + this.machine.glassW - 25) { p.x = this.machine.glassLeft + this.machine.glassW - 25; p.vx *= -0.6; }
                p.vx *= 0.985;
                p.vy *= 0.985;
            }
        });

        this._updateParticles();
        if (this.messageTimer > 0) this.messageTimer--;
        if (this.messageTimer <= 0) this.message = '';
    }

    _tryGrab() {
        let closest = null, minDist = 999;
        const cx = this.claw.x, cy = this.machine.glassTop + 70 + this.armLength;

        this.prizes.forEach(p => {
            if (p.grabbed) return;
            const d = Math.hypot(p.x - cx, p.y - cy);
            if (d < minDist && d < p.r + 28) { minDist = d; closest = p; }
        });

        if (closest) {
            closest.grabbed = true;
            this._winPrize(closest);
        }
    }

    _winPrize(prize) {
        const isSpecial = prize.rare && Math.random() < 0.35;
        let amount = prize.value;
        let msg = `Hai vinto: ${prize.name} (+${amount} coins)`;

        if (isSpecial || Math.random() < 0.06) {
            amount = 220;
            msg = '🎉 HAI VINTO IL RUOLO CUSTOM! +220 coins';
            this._sendWebhookLog(prize.name);
        }

        this.credits += amount;
        this.score += Math.floor(amount * 0.7);
        this.totalWon += amount;
        this.message = msg;
        this.messageTimer = 140;

        const col = isSpecial ? '#f9ca24' : prize.color;
        for (let i = 0; i < (isSpecial ? 45 : 22); i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1.5 + Math.random() * 3.5;
            this._particle(this.claw.x, this.machine.glassTop + 90 + this.armLength, Math.cos(a) * s, Math.sin(a) * s - 1.5, col, 40);
        }

        setTimeout(() => {
            this.prizes = this.prizes.filter(pr => pr.id !== prize.id);
            if (this.prizes.length < 8) this._spawnNewPrizes(4);
        }, 650);
    }

    _spawnNewPrizes(n) {
        const types = [
            { name: 'Pelouche Blu', value: 25, color: '#74b9ff', r: 18, rare: false },
            { name: 'Pelouche Verde', value: 30, color: '#55efc4', r: 17, rare: false },
            { name: 'Moneta Oro', value: 50, color: '#f9ca24', r: 14, rare: false },
            { name: 'Pelouche Raro', value: 80, color: '#a29bfe', r: 20, rare: true },
        ];
        for (let i = 0; i < n; i++) {
            const t = types[Math.floor(Math.random() * types.length)];
            this.prizes.push({
                ...t,
                x: this.machine.glassLeft + 50 + Math.random() * (this.machine.glassW - 100),
                y: this.machine.glassTop + 140 + Math.random() * 180,
                vx: (Math.random()-0.5)*1.2,
                vy: (Math.random()-0.5)*0.8,
                grabbed: false,
                id: Date.now() + i
            });
        }
    }

    _releasePrize() {
        this.prizes.forEach(p => { if (p.grabbed) { p.grabbed = false; p.vx = (Math.random()-0.5)*3; p.vy = -1.5; } });
    }

    _particle(x, y, vx, vy, color, life) {
        this.particles.push({ x, y, vx, vy, color, life, maxLife: life });
    }

    _updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--;
            return p.life > 0;
        });
    }

    async _sendWebhookLog(prizeName) {
        if (!DISCORD_WEBHOOK_URL) return;
        try {
            const name = (document.getElementById('player-name')?.value || 'GIOCATORE').toUpperCase().slice(0,12);
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `🎰 **${name}** ha vinto il **RUOLO CUSTOM** nella Macchina a Gancio!`,
                    embeds: [{ title: '🎁 Vincita Ruolo Custom', description: `Premio: ${prizeName}`, color: 0xf9ca24 }]
                })
            });
        } catch (_) {}
    }

    draw() {
        const c = this.ctx;
        c.fillStyle = '#0a0c14';
        c.fillRect(0, 0, this.width, this.height);

        c.fillStyle = '#1f2533';
        c.fillRect(this.machine.left, this.machine.top, this.machine.width, this.machine.height);
        c.strokeStyle = '#f9ca24';
        c.lineWidth = 6;
        c.strokeRect(this.machine.left, this.machine.top, this.machine.width, this.machine.height);

        c.fillStyle = 'rgba(20,25,40,0.35)';
        c.fillRect(this.machine.glassLeft, this.machine.glassTop, this.machine.glassW, this.machine.glassH);
        c.strokeStyle = 'rgba(249,202,36,0.6)';
        c.lineWidth = 3;
        c.strokeRect(this.machine.glassLeft, this.machine.glassTop, this.machine.glassW, this.machine.glassH);

        this.prizes.forEach(p => {
            c.save();
            c.translate(p.x, p.y);
            if (p.grabbed) c.rotate(Math.sin(Date.now() / 180) * 0.08);
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(0, 0, p.r, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.beginPath();
            c.arc(-p.r * 0.3, -p.r * 0.3, p.r * 0.4, 0, Math.PI * 2);
            c.fill();
            c.restore();
        });

        const baseY = this.machine.glassTop - 25;
        const cx = this.claw.x;
        c.strokeStyle = '#e0e0e0';
        c.lineWidth = 8;
        c.beginPath();
        c.moveTo(cx, baseY);
        c.lineTo(cx, baseY + this.armLength);
        c.stroke();

        const cy = baseY + this.armLength;
        c.fillStyle = '#f9ca24';
        c.fillRect(cx - 18, cy - 8, 36, 16);

        const open = this.claw.state === 'GRABBING' ? this.claw.grabOffset : 0;
        c.strokeStyle = '#ddd';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(cx - 12, cy + 6);
        c.lineTo(cx - 22 - open, cy + 28);
        c.stroke();
        c.beginPath();
        c.moveTo(cx + 12, cy + 6);
        c.lineTo(cx + 22 + open, cy + 28);
        c.stroke();

        this.particles.forEach(p => {
            c.globalAlpha = p.life / p.maxLife;
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        this._drawHUD(c);

        if (this.message && this.messageTimer > 0) {
            const alpha = Math.min(1, this.messageTimer / 35);
            c.fillStyle = `rgba(10,12,20,${0.92 * alpha})`;
            c.fillRect(this.width/2 - 320, 85, 640, 78);
            c.strokeStyle = this.message.includes('RUOLO CUSTOM') ? '#f9ca24' : '#55efc4';
            c.lineWidth = 4;
            c.strokeRect(this.width/2 - 320, 85, 640, 78);
            c.fillStyle = this.message.includes('RUOLO CUSTOM') ? '#f9ca24' : '#fff';
            c.font = 'bold 24px "Inter", system-ui';
            c.textAlign = 'center';
            c.fillText(this.message, this.width/2, 125);
        }

        if (this.showGuide) this._drawGuide(c);
    }

    _drawHUD(c) {
        c.fillStyle = 'rgba(15,18,28,0.95)';
        c.fillRect(0, 0, this.width, 68);
        c.strokeStyle = 'rgba(249,202,36,0.3)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, 68);
        c.lineTo(this.width, 68);
        c.stroke();

        c.fillStyle = '#f9ca24';
        c.font = 'bold 28px "Inter", system-ui';
        c.textAlign = 'center';
        c.fillText('                                                                                 🎰  MACCHINA A GANCIO', this.width / 2, 45);
        c.textAlign = 'left';

        c.fillStyle = '#55efc4';
        c.font = 'bold 20px "Inter", system-ui';
        c.fillText(`$ ${this.credits}`, this.width - 300, 42);

        c.fillStyle = 'rgba(255,255,255,0.6)';
        c.font = '14px "Inter", system-ui';
        c.fillText(`SCORE: ${this.score}  •  Vinto: ${this.totalWon}`, this.width - 300, 78);

        const bx = this.width - 240, by = this.height - 155;
        const canPlay = this.claw.state === 'IDLE' && (this.attemptsLeft > 0 || this.credits >= 150);
        c.fillStyle = canPlay ? '#f9ca24' : '#555';
        c.beginPath();
        c.roundRect(bx, by, 210, 85, 18);
        c.fill();
        c.strokeStyle = canPlay ? '#fff' : '#777';
        c.lineWidth = 4;
        c.stroke();

        c.fillStyle = canPlay ? '#111' : '#aaa';
        c.font = 'bold 18px "Inter", system-ui';
        c.textAlign = 'center';

        let btnText = 'LANCIA IL GANCIO';
        if (this.attemptsLeft === 0 && this.credits >= 150) btnText = 'COMPRA TIRO (150$)';
        if (!canPlay && this.attemptsLeft === 0 && this.credits < 150) btnText = 'CREDITI BASSI';
        c.fillText(btnText, bx + 105, by + 38);

        c.font = '13px "Inter", system-ui';
        c.fillText(canPlay ? 'SPAZIO o TAP qui' : '', bx + 105, by + 60);

        // Pulsante Torna alla HUB - rotondo
        const closeW = Math.min(190, this.width * 0.45);
        c.fillStyle = 'rgba(35,35,45,0.92)';
        c.beginPath();
        c.roundRect(20, this.height - 88, closeW, 52, 16);
        c.fill();
        c.strokeStyle = '#ff6b6b';
        c.lineWidth = 3;
        c.stroke();

        c.fillStyle = '#ff6b6b';
        c.font = `bold ${closeW > 150 ? 15 : 13}px "Inter", system-ui`;
        c.textAlign = 'center';
        c.fillText('✕ TORNA ALLA HUB', 20 + closeW/2, this.height - 55);

        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.font = '12px "Inter", system-ui';
        c.fillText('← → Muovi  •  SPAZIO/TAP = Lancia  •  R = Ricarica  •  ? = Guida', this.width/2, this.height - 22);
    }

    _drawGuide(c) {
        c.fillStyle = 'rgba(10,12,20,0.95)';
        c.fillRect(this.width/2 - 310, this.height/2 - 190, 620, 380);
        c.strokeStyle = '#a29bfe';
        c.lineWidth = 3;
        c.strokeRect(this.width/2 - 310, this.height/2 - 190, 620, 380);
        c.fillStyle = '#a29bfe';
        c.font = 'bold 24px "Inter", system-ui';
        c.fillText('COME SI GIOCA', this.width/2, this.height/2 - 150);
        c.fillStyle = '#fff';
        c.font = '16px "Inter", system-ui';
        c.fillText('← → = Muovi il gancio    SPAZIO = Lancia', this.width/2, this.height/2 - 100);
        c.fillText('R = Ricarica    ? = Chiudi guida', this.width/2, this.height/2 - 70);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.running = true;
        this.claw.x = this.machine.glassLeft + this.machine.glassW / 2;
        this.claw.targetX = this.claw.x;
        this.loop();
    }
}

// Boot
let gameInstance = null;

function startGame() {
    const container = document.getElementById('game-container');
    if (container) container.classList.add('active');
    if (!gameInstance) gameInstance = new ClawMachineGame('game-canvas');
}

window.startMinigame = startGame;
window.startGame = startGame;

class SpaceGame extends ClawMachineGame {
    constructor(canvasId) {
        super(canvasId);
    }
}
