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

        // ── Game State ─────────────────────────────────────────────────────
        this.running = false;
        this.credits = 1200;
        this.score = 0;
        this.totalWon = 0;
        this.plays = 0;
        this.message = '';
        this.messageTimer = 0;
        this.showGuide = false;

        // ── Claw Machine Physics & State ──────────────────────────────────
        this.claw = {
            x: 0,
            y: 80,
            targetX: 0,
            speed: 4.2,
            state: 'IDLE',        // IDLE, MOVING, DROPPING, GRABBING, RETRACTING, RELEASING
            dropSpeed: 5.5,
            retractSpeed: 3.8,
            grabOffset: 0,
            angle: 0
        };
        this.armLength = 0;
        this.maxArmLength = 210;

        this.prizes = [];
        this.particles = [];
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.mobileKeys = {};
        this.keys = {};

        // ── Machine dimensions (relative) ─────────────────────────────────
        this.machine = {
            width: 620,
            height: 520,
            left: 90,
            top: 60,
            glassLeft: 110,
            glassTop: 95,
            glassW: 580,
            glassH: 380
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
            { name: 'Pelouche Blu',   value: 25,  color: '#74b9ff', r: 18, rare: false },
            { name: 'Pelouche Verde', value: 30,  color: '#55efc4', r: 17, rare: false },
            { name: 'Pelouche Rosa',  value: 35,  color: '#fd79a8', r: 19, rare: false },
            { name: 'Moneta Oro',     value: 50,  color: '#f9ca24', r: 14, rare: false },
            { name: 'Pelouche Raro',  value: 80,  color: '#a29bfe', r: 20, rare: true },
            { name: 'Tesoro',         value: 120, color: '#e17055', r: 16, rare: true },
        ];

        // Scatter prizes nicely inside the glass area
        for (let i = 0; i < 22; i++) {
            const t = types[Math.floor(Math.random() * types.length)];
            const px = this.machine.glassLeft + 40 + Math.random() * (this.machine.glassW - 80);
            const py = this.machine.glassTop + 120 + Math.random() * (this.machine.glassH - 160);
            this.prizes.push({
                ...t,
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.6,
                grabbed: false,
                grabTime: 0,
                id: i
            });
        }
    }

    _initControls() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Slash' || e.key === '?') { this.showGuide = !this.showGuide; }
            if (e.code === 'Escape') { this.showGuide = false; }
            if ((e.code === 'Space' || e.code === 'Enter') && this.claw.state === 'IDLE') {
                this._startDrop();
            }
            if (e.code === 'KeyR' && this.claw.state === 'IDLE') {
                this._resetMachine();
            }
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // Mouse / Touch
        this.canvas.addEventListener('mousedown', e => this._handlePointer(e));
        this.canvas.addEventListener('touchstart', e => this._handlePointer(e), { passive: false });

        window.addEventListener('resize', () => this.resize());
    }

    _handlePointer(e) {
        if (!this.running) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const my = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        // Big drop button area (bottom right)
        const btnX = this.width - 220, btnY = this.height - 140;
        if (mx > btnX && mx < btnX + 180 && my > btnY && my < btnY + 70) {
            if (this.claw.state === 'IDLE') this._startDrop();
            return;
        }

        // Left / Right zones on screen for mobile feel
        if (this.claw.state === 'IDLE') {
            if (mx < this.width * 0.25) {
                this.mobileKeys['left'] = true;
                setTimeout(() => { this.mobileKeys['left'] = false; }, 180);
            } else if (mx > this.width * 0.75) {
                this.mobileKeys['right'] = true;
                setTimeout(() => { this.mobileKeys['right'] = false; }, 180);
            } else {
                // tap in middle = drop
                this._startDrop();
            }
        }
    }

    _startDrop() {
        if (this.credits < 200 || this.claw.state !== 'IDLE') return;
        this.credits -= 200;
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

        const mk = this.mobileKeys;

        // Claw horizontal movement
        if (this.claw.state === 'IDLE' || this.claw.state === 'MOVING') {
            let move = 0;
            if (this.keys['ArrowLeft'] || this.keys['KeyA'] || mk['left']) move -= 1;
            if (this.keys['ArrowRight'] || this.keys['KeyD'] || mk['right']) move += 1;

            if (move !== 0) {
                this.claw.state = 'MOVING';
                this.claw.targetX = Math.max(
                    this.machine.glassLeft + 30,
                    Math.min(this.machine.glassLeft + this.machine.glassW - 30, this.claw.x + move * this.claw.speed)
                );
            } else if (this.claw.state === 'MOVING') {
                this.claw.state = 'IDLE';
            }
        }

        // Smooth claw X movement
        if (this.claw.state === 'IDLE' || this.claw.state === 'MOVING') {
            this.claw.x += (this.claw.targetX - this.claw.x) * 0.18;
            if (Math.abs(this.claw.targetX - this.claw.x) < 0.8) this.claw.x = this.claw.targetX;
        }

        // State machine for claw
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
                if (this.claw.grabOffset <= 0) {
                    this.claw.state = 'RETRACTING';
                }
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

        // Update grabbed prizes
        this.prizes.forEach(p => {
            if (p.grabbed) {
                p.x = this.claw.x;
                p.y = this.machine.top + 70 + this.armLength - 10;
                p.vx *= 0.6;
                p.vy = 0;
            } else {
                // Gentle floating / physics for loose prizes
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.035; // gravity
                if (p.y > this.machine.glassTop + this.machine.glassH - 25) {
                    p.y = this.machine.glassTop + this.machine.glassH - 25;
                    p.vy *= -0.35;
                }
                if (p.x < this.machine.glassLeft + 25) { p.x = this.machine.glassLeft + 25; p.vx *= -0.6; }
                if (p.x > this.machine.glassLeft + this.machine.glassW - 25) { p.x = this.machine.glassLeft + this.machine.glassW - 25; p.vx *= -0.6; }
                p.vx *= 0.985;
                p.vy *= 0.985;
            }
        });

        this._updateParticles();

        // Message timer
        if (this.messageTimer > 0) this.messageTimer--;
        if (this.messageTimer <= 0) this.message = '';
    }

    _tryGrab() {
        // Find closest prize under the claw
        let closest = null;
        let minDist = 999;

        const clawX = this.claw.x;
        const clawY = this.machine.top + 70 + this.armLength;

        this.prizes.forEach(p => {
            if (p.grabbed) return;
            const dx = p.x - clawX;
            const dy = p.y - clawY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < minDist && dist < p.r + 28) {
                minDist = dist;
                closest = p;
            }
        });

        if (closest) {
            closest.grabbed = true;
            closest.grabTime = Date.now();
            this._winPrize(closest);
        } else {
            // Miss animation
            this._particle(this.claw.x, this.machine.top + 70 + this.armLength, 0, 2, '#888', 18);
        }
    }

    _winPrize(prize) {
        const isSpecial = prize.rare && Math.random() < 0.35; // 35% chance on rare prize to trigger special

        let winAmount = prize.value;
        let prizeMsg = `Hai vinto: ${prize.name} (+${winAmount} coins)`;

        if (isSpecial || (Math.random() < 0.06)) { 
            // 6% base chance or special rare
            winAmount = 220;
            prizeMsg = '🎉 HAI VINTO IL RUOLO CUSTOM! +220 coins';
            this._sendWebhookLog(prize.name);
        }

        this.credits += winAmount;
        this.score += Math.floor(winAmount * 0.7);
        this.totalWon += winAmount;

        this.message = prizeMsg;
        this.messageTimer = 140;

        // Celebration particles
        const col = isSpecial ? '#f9ca24' : prize.color;
        for (let i = 0; i < (isSpecial ? 45 : 22); i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 3.5;
            this._particle(
                this.claw.x + (Math.random()-0.5)*30,
                this.machine.top + 90 + this.armLength,
                Math.cos(a) * spd,
                Math.sin(a) * spd - 1.5,
                col,
                40 + Math.random() * 35
            );
        }

        // Remove the grabbed prize after short delay
        setTimeout(() => {
            this.prizes = this.prizes.filter(pr => pr.id !== prize.id);
            // Respawn a couple new prizes if machine gets empty
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
                grabTime: 0,
                id: Date.now() + i
            });
        }
    }

    _releasePrize() {
        // If still holding something when fully retracted, drop it back
        this.prizes.forEach(p => {
            if (p.grabbed) {
                p.grabbed = false;
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = -1.5;
            }
        });
    }

    _particle(x, y, vx, vy, color, life) {
        this.particles.push({ x, y, vx, vy, color, life, maxLife: life });
    }

    _updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life--;
            return p.life > 0;
        });
    }

    async _sendWebhookLog(prizeName) {
        if (!DISCORD_WEBHOOK_URL) return;
        try {
            const playerName = (document.getElementById('player-name')?.value || 'GIOCATORE').toUpperCase().slice(0,12);
            const payload = {
                content: `🎰 **${playerName}** ha trovato nella **MACCHINA A GANCIO** il **RUOLO CUSTOM** vincendo **${prizeName}**!`,
                embeds: [{
                    title: '🎁 VINCITA SPECIALE - RUOLO CUSTOM',
                    description: `**${playerName}**\nPremio: **${prizeName}**\nCrediti attuali: ${this.credits}\nPartite totali: ${this.plays}`,
                    color: 0xf9ca24,
                    timestamp: new Date().toISOString()
                }]
            };
            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.log('%c[Macchina a Gancio] Webhook error (non bloccante)', 'color:#f66');
        }
    }

    draw() {
        const c = this.ctx;
        c.fillStyle = '#0a0c14';
        c.fillRect(0, 0, this.width, this.height);

        // Cabinet background (arcade style)
        c.fillStyle = '#1f2533';
        c.fillRect(this.machine.left - 20, this.machine.top - 30, this.machine.width + 40, this.machine.height + 80);
        c.strokeStyle = '#f9ca24';
        c.lineWidth = 6;
        c.strokeRect(this.machine.left - 20, this.machine.top - 30, this.machine.width + 40, this.machine.height + 80);

        // Glass area
        c.fillStyle = 'rgba(20, 25, 40, 0.35)';
        c.fillRect(this.machine.glassLeft, this.machine.glassTop, this.machine.glassW, this.machine.glassH);
        c.strokeStyle = 'rgba(249,202,36,0.6)';
        c.lineWidth = 3;
        c.strokeRect(this.machine.glassLeft, this.machine.glassTop, this.machine.glassW, this.machine.glassH);

        // Prize area floor
        c.fillStyle = '#2d3446';
        c.fillRect(this.machine.glassLeft + 8, this.machine.glassTop + this.machine.glassH - 35, this.machine.glassW - 16, 30);

        // Draw prizes
        this.prizes.forEach(p => {
            c.save();
            c.translate(p.x, p.y);
            if (p.grabbed) c.rotate(Math.sin(Date.now()/180) * 0.08);

            // Shadow
            c.fillStyle = 'rgba(0,0,0,0.35)';
            c.beginPath();
            c.ellipse(4, p.r + 6, p.r * 0.9, 6, 0, 0, Math.PI * 2);
            c.fill();

            // Main body
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(0, 0, p.r, 0, Math.PI * 2);
            c.fill();

            // Highlight
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.beginPath();
            c.arc(-p.r * 0.35, -p.r * 0.35, p.r * 0.45, 0, Math.PI * 2);
            c.fill();

            // Cute face / detail
            c.fillStyle = '#111';
            c.fillRect(-5, -3, 3, 3);
            c.fillRect(2, -3, 3, 3);
            c.strokeStyle = '#111';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(0, 4, 5, 0.2, Math.PI - 0.2);
            c.stroke();

            c.restore();
        });

        // Claw arm + mechanism
        const clawBaseY = this.machine.top + 55;
        const clawX = this.claw.x;

        // Top rail
        c.fillStyle = '#3a4255';
        c.fillRect(this.machine.glassLeft, clawBaseY - 18, this.machine.glassW, 22);
        c.strokeStyle = '#f9ca24';
        c.lineWidth = 2;
        c.strokeRect(this.machine.glassLeft, clawBaseY - 18, this.machine.glassW, 22);

        // Vertical arm
        c.strokeStyle = '#e0e0e0';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(clawX, clawBaseY);
        c.lineTo(clawX, clawBaseY + this.armLength);
        c.stroke();

        c.strokeStyle = '#888';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(clawX - 4, clawBaseY);
        c.lineTo(clawX - 4, clawBaseY + this.armLength);
        c.stroke();

        // Claw head
        const clawY = clawBaseY + this.armLength;
        c.fillStyle = '#f9ca24';
        c.beginPath();
        c.rect(clawX - 18, clawY - 8, 36, 16);
        c.fill();
        c.strokeStyle = '#c9a227';
        c.lineWidth = 2;
        c.stroke();

        // Claw fingers
        const open = this.claw.state === 'GRABBING' ? this.claw.grabOffset : 0;
        c.strokeStyle = '#ddd';
        c.lineWidth = 5;
        // Left finger
        c.beginPath();
        c.moveTo(clawX - 12, clawY + 6);
        c.lineTo(clawX - 22 - open, clawY + 28);
        c.stroke();
        // Right finger
        c.beginPath();
        c.moveTo(clawX + 12, clawY + 6);
        c.lineTo(clawX + 22 + open, clawY + 28);
        c.stroke();

        // Particles
        this.particles.forEach(p => {
            c.globalAlpha = Math.max(0.1, p.life / p.maxLife);
            c.fillStyle = p.color;
            c.beginPath();
            c.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            c.fill();
        });
        c.globalAlpha = 1;

        // HUD
        this._drawHUD(c);

        // Win message toast
        if (this.message && this.messageTimer > 0) {
            const alpha = Math.min(1, this.messageTimer / 35);
            const isSpecial = this.message.includes('RUOLO CUSTOM');
            c.fillStyle = `rgba(10,12,20,${0.92 * alpha})`;
            c.fillRect(this.width/2 - 320, 85, 640, 78);
            c.strokeStyle = isSpecial ? '#f9ca24' : '#55efc4';
            c.lineWidth = 4;
            c.strokeRect(this.width/2 - 320, 85, 640, 78);

            c.fillStyle = isSpecial ? '#f9ca24' : '#fff';
            c.font = isSpecial ? 'bold 26px "Inter", system-ui' : 'bold 22px "Inter", system-ui';
            c.textAlign = 'center';
            c.fillText(this.message, this.width/2, 125);

            if (isSpecial) {
                c.fillStyle = 'rgba(255,255,255,0.7)';
                c.font = '15px "Inter", system-ui';
                c.fillText('✨ Log inviato su Discord!', this.width/2, 148);
            }
        }

        // Guide overlay
        if (this.showGuide) this._drawGuide(c);
    }

    _drawHUD(c) {
        // Top bar
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
        c.textAlign = 'left';
        c.fillText('🎰  MACCHINA A GANCIO', 30, 42);

        c.fillStyle = '#55efc4';
        c.font = 'bold 20px "Inter", system-ui';
        c.fillText(`$ ${this.credits}`, this.width - 280, 42);

        c.fillStyle = 'rgba(255,255,255,0.6)';
        c.font = '15px "Inter", system-ui';
        c.fillText(`SCORE: ${this.score}   •   Vinto totale: ${this.totalWon}`, this.width - 280, 60);

        // Big PLAY button
        const btnX = this.width - 220, btnY = this.height - 140;
        const canPlay = this.credits >= 200 && this.claw.state === 'IDLE';
        c.fillStyle = canPlay ? '#f9ca24' : '#444';
        c.fillRect(btnX, btnY, 180, 70);
        c.strokeStyle = canPlay ? '#fff' : '#666';
        c.lineWidth = 3;
        c.strokeRect(btnX, btnY, 180, 70);

        c.fillStyle = canPlay ? '#111' : '#aaa';
        c.font = 'bold 18px "Inter", system-ui';
        c.textAlign = 'center';
        c.fillText(canPlay ? 'PREMI SPAZIO' : 'CREDITI BASSI', btnX + 90, btnY + 32);
        c.font = '13px "Inter", system-ui';
        c.fillText('o tocca qui', btnX + 90, btnY + 52);

        // Instructions line
        c.fillStyle = 'rgba(255,255,255,0.45)';
        c.font = '13px "Inter", system-ui';
        c.textAlign = 'center';
        c.fillText('← →  Muovi il gancio   •   SPAZIO / TAP  =  Lancia   •   R = Ricarica   •   ? = Guida', this.width/2, this.height - 25);
    }

    _drawGuide(c) {
        const gw = 620, gh = 380;
        const gx = this.width/2 - gw/2;
        const gy = this.height/2 - gh/2;

        c.fillStyle = 'rgba(10,12,20,0.96)';
        c.fillRect(gx, gy, gw, gh);
        c.strokeStyle = '#a29bfe';
        c.lineWidth = 3;
        c.strokeRect(gx, gy, gw, gh);

        c.fillStyle = '#a29bfe';
        c.font = 'bold 24px "Inter", system-ui';
        c.textAlign = 'center';
        c.fillText('COME SI GIOCA', this.width/2, gy + 42);

        c.strokeStyle = 'rgba(162,155,254,0.3)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(gx + 40, gy + 58);
        c.lineTo(gx + gw - 40, gy + 58);
        c.stroke();

        const lines = [
            'Muovi il gancio con ← →  (o tocca sinistra/destra dello schermo)',
            '',
            'Premi SPAZIO o tocca il pulsante giallo per LANCIARE il gancio',
            '',
            'Quando il gancio scende, si chiude automaticamente',
            'Se afferra un pelouche o moneta → vinci i coins!',
            '',
            'Premi R per ricaricare la macchina con nuovi premi',
            '',
            '6% di chance base + premi rari = possibilità di vincere',
            'il RUOLO CUSTOM (log inviato automaticamente su Discord)',
            '',
            'Ogni tentativo costa 200 crediti'
        ];

        c.fillStyle = 'rgba(255,255,255,0.85)';
        c.font = '16px "Inter", system-ui';
        c.textAlign = 'left';
        lines.forEach((line, i) => {
            c.fillText(line, gx + 55, gy + 95 + i * 24);
        });

        c.fillStyle = 'rgba(255,255,255,0.4)';
        c.font = '14px "Inter", system-ui';
        c.textAlign = 'center';
        c.fillText('[ ? ] o [ ESC ] per chiudere la guida', this.width/2, gy + gh - 28);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.running = true;
        // Initial claw position
        this.claw.x = this.machine.glassLeft + this.machine.glassW / 2;
        this.claw.targetX = this.claw.x;
        this.loop();
    }
}

// ── Boot ────────────────────────────────────────────────────────────────
let gameInstance = null;

function startGame() {
    const container = document.getElementById('game-container');
    if (container) container.classList.add('active');
    if (!gameInstance) {
        gameInstance = new ClawMachineGame('game-canvas');
    }
}

// Auto-start or secret trigger (same pattern as before)
const secret = document.getElementById('secret-trigger');
if (secret) {
    let clicks = 0;
    secret.addEventListener('click', e => {
        e.preventDefault();
        if (++clicks >= 5) {
            startGame();
            clicks = 0;
        }
    });
}

// Also allow direct start if canvas exists
window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    if (canvas && !gameInstance) {
        // Uncomment next line if you want auto-start without clicking logo 5 times
        // startGame();
    }
});
