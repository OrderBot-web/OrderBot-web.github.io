/**
 * GALAXY WORLD - Space Economy Arcade Game
 * Cinematic Earth Launch Edition
 */

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.pixelScale = 4; 
        this.buffer = document.createElement('canvas');
        this.bctx = this.buffer.getContext('2d');
        
        this.resize();

        this.G = 0.5; 
        this.friction = 0.994;
        this.baseAccel = 0.5;
        this.mapLimit = 3000; 

        this.running = false;
        this.score = 0;
        this.credits = 3000; 
        this.cargo = [];
        this.maxCargo = 8;
        this.activeCrises = [];
        this.outposts = []; 
        this.particles = [];

        this.camera = { x: 0, y: 0, zoom: 0.8 };
        
        this.planets = [
            { id: 'mercurio', name: 'MERCURIO', dist: 120, size: 6, color: '#95a5a6', speed: 0.015, res: 'SOLARE', req: 'GHIACCIO', spec: 'RELOAD VELOCE' },
            { id: 'venere', name: 'VENERE', dist: 180, size: 8, color: '#e67e22', speed: 0.008, res: 'ACIDO', req: 'FILTRI', spec: 'CORROSIONE' },
            { id: 'terra', name: 'TERRA', dist: 260, size: 10, color: '#4facfe', speed: 0.005, res: 'CIBO', req: 'METALLI', spec: 'HUB CENTRALE' },
            { id: 'luna', name: 'LUNA', parent: 'terra', dist: 35, size: 5, color: '#bdc3c7', speed: 0.03, res: 'ELIO-3', req: 'CIBO', spec: 'BASSA GRAVITÀ' },
            { id: 'marte', name: 'MARTE', dist: 400, size: 9, color: '#ff4b2b', speed: 0.0035, res: 'FERRO', req: 'ACQUA', spec: 'MINIERA ROSSA' },
            { id: 'giove', name: 'GIOVE', dist: 600, size: 20, color: '#f39c12', speed: 0.0012, res: 'GAS', req: 'CHIPS', spec: 'TEMPESTA ROSSA' },
            { id: 'saturno', name: 'SATURNO', dist: 850, size: 16, color: '#f1c40f', speed: 0.0008, res: 'GHIACCIO', req: 'MEDS', spec: 'ANELLI RARI', rings: true },
            { id: 'urano', name: 'URANO', dist: 1100, size: 14, color: '#a29bfe', speed: 0.0005, res: 'DIAMANTI', req: 'GAS', spec: 'VENTI GELIDI' },
            { id: 'nettuno', name: 'NETTUNO', dist: 1400, size: 14, color: '#0984e3', speed: 0.0003, res: 'ENERGIA', req: 'DIAMANTI', spec: 'ABISSO BLU' }
        ];

        // INITIAL POSITION
        const terra = this.planets.find(p => p.id === 'terra');
        this.ship = { x: terra.dist, y: 0, vx: 0, vy: 0, angle: -Math.PI/2, size: 5 };
        
        this.sun = { x: 0, y: 0, size: 25, color: '#FFD700' };
        
        this.launchState = 'COUNTDOWN'; // COUNTDOWN -> BOOST -> PLAY
        this.launchTimer = 180; // 3 seconds at 60fps

        this.init();
    }

    resize() {
        this.width = window.innerWidth; this.height = window.innerHeight;
        this.canvas.width = this.width; this.canvas.height = this.height;
        this.buffer.width = Math.ceil(this.width / this.pixelScale);
        this.buffer.height = Math.ceil(this.height / this.pixelScale);
        this.ctx.imageSmoothingEnabled = false; this.bctx.imageSmoothingEnabled = false;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.keys = {};
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; if(e.code === 'KeyB') this.buildOutpost(); });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        this.canvas.addEventListener('touchstart', (e) => { this.isTouching = true; this.handleTouch(e); });
        this.canvas.addEventListener('touchmove', (e) => { this.handleTouch(e); });
        this.canvas.addEventListener('touchend', () => { this.isTouching = false; });
        this.crisisLoop = setInterval(() => { if(this.running) this.spawnCrisis(); }, 9000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    handleTouch(e) { e.preventDefault(); const touch = e.touches[0]; this.touchPos = { x: touch.clientX, y: touch.clientY }; }

    buildOutpost() {
        if(!this.running || this.credits < 2000) return;
        this.outposts.push({ id: 'op'+Date.now(), name: 'BASE '+(this.outposts.length+1), x: this.ship.x, y: this.ship.y, size: 7, color: '#9b59b6', res: 'CHIPS', req: 'FERRO', level: 1 });
        this.credits -= 2000;
    }

    spawnCrisis() {
        if(this.outposts.length === 0) return;
        const p = this.outposts[Math.floor(Math.random() * this.outposts.length)];
        if(this.activeCrises.find(c => c.planet === p.id)) return;
        this.activeCrises.push({ planet: p.id, resource: p.req, timer: 45, maxTime: 45 });
    }

    start() { this.running = true; this.loop(); }

    update() {
        if (!this.running) return;

        // LAUNCH ANIMATION LOGIC
        if (this.launchState === 'COUNTDOWN') {
            this.launchTimer--;
            const terra = this.planets.find(p => p.id === 'terra');
            this.ship.x = terra.x; this.ship.y = terra.y; // Stay locked to Terra
            if (this.launchTimer <= 0) { this.launchState = 'BOOST'; this.launchTimer = 60; }
            return;
        } else if (this.launchState === 'BOOST') {
            this.launchTimer--;
            this.ship.vy = -3; // Launch velocity
            this.ship.angle = -Math.PI/2;
            // Particles
            if(Math.random() > 0.5) this.particles.push({ x: this.ship.x, y: this.ship.y, vx: (Math.random()-0.5), vy: 2, life: 30, color: '#ff4b2b' });
            if (this.launchTimer <= 0) { this.launchState = 'PLAY'; }
        }

        this.ship.mass = 1 + (this.cargo.length * 0.2);
        let accel = this.baseAccel / this.ship.mass;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) { this.ship.vx += Math.cos(this.ship.angle) * accel; this.ship.vy += Math.sin(this.ship.angle) * accel; }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.12;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.12;
        
        if (this.isTouching) {
            const worldTouchX = (this.touchPos.x / this.pixelScale - this.camera.x) / this.camera.zoom;
            const worldTouchY = (this.touchPos.y / this.pixelScale - this.camera.y) / this.camera.zoom;
            const targetAngle = Math.atan2(worldTouchY - this.ship.y, worldTouchX - this.ship.x);
            let angleDiff = targetAngle - this.ship.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.ship.angle += angleDiff * 0.15;
            this.ship.vx += Math.cos(this.ship.angle) * accel; this.ship.vy += Math.sin(this.ship.angle) * accel;
        }

        let dSun = Math.sqrt(this.ship.x**2 + this.ship.y**2);
        if (dSun < this.sun.size) return this.gameOver();
        if (dSun > this.mapLimit) { this.ship.vx -= (this.ship.x / dSun) * 1.2; this.ship.vy -= (this.ship.y / dSun) * 1.2; }
        let force = this.G * 250 / (dSun**2);
        this.ship.vx -= (this.ship.x / dSun) * force; this.ship.vy -= (this.ship.y / dSun) * force;
        this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction; this.ship.vy *= this.friction;

        // Particles Update
        this.particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life--; if(p.life <= 0) this.particles.splice(i, 1); });

        // Update Planets
        this.planets.forEach(p => {
            p.angle = (p.angle || 0) + p.speed;
            let parent = p.parent ? this.planets.find(pl => pl.id === p.parent) : this.sun;
            p.x = parent.x + Math.cos(p.angle) * p.dist;
            p.y = parent.y + Math.sin(p.angle) * p.dist;
            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 6 && this.launchState === 'PLAY') this.dock(p);
        });

        this.outposts.forEach(p => {
            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 6 && this.launchState === 'PLAY') this.dock(p);
        });

        this.activeCrises.forEach(c => { c.timer -= 1/60; if(c.timer <= 0) this.gameOver(); });
        this.camera.x = -this.ship.x * this.camera.zoom + this.buffer.width/2;
        this.camera.y = -this.ship.y * this.camera.zoom + this.buffer.height/2;
    }

    dock(p) {
        let resIdx = this.cargo.indexOf(p.req);
        if(resIdx !== -1) {
            this.cargo.splice(resIdx, 1);
            let reward = 1000;
            let cIdx = this.activeCrises.findIndex(c => c.planet === p.id);
            if(cIdx !== -1) { this.activeCrises.splice(cIdx, 1); reward += 3000; p.level++; }
            this.credits += reward; this.score += reward;
        } else if(this.cargo.length < this.maxCargo && this.credits >= 100 && p.res) {
            this.cargo.push(p.res); this.credits -= 100;
        }
        this.ship.vx *= -0.2; this.ship.vy *= -0.2;
    }

    draw() {
        this.bctx.fillStyle = '#020205'; this.bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);
        this.bctx.save();
        this.bctx.translate(this.camera.x, this.camera.y);
        this.bctx.scale(this.camera.zoom, this.camera.zoom);

        // Sun
        this.bctx.fillStyle = this.sun.color; this.bctx.fillRect(-this.sun.size, -this.sun.size, this.sun.size*2, this.sun.size*2);

        // Planets
        this.planets.forEach(p => {
            this.bctx.fillStyle = p.color; this.bctx.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
            this.bctx.fillStyle = 'white'; this.bctx.font = '5px monospace'; this.bctx.textAlign = 'center';
            this.bctx.fillText(p.name, p.x, p.y - p.size - 4);
        });

        // Particles
        this.particles.forEach(p => { this.bctx.fillStyle = p.color; this.bctx.fillRect(p.x, p.y, 2, 2); });

        // Cities
        this.outposts.forEach(p => {
            this.bctx.fillStyle = p.color; this.bctx.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
            this.bctx.strokeStyle = 'white'; this.bctx.strokeRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
        });

        // Ship
        this.bctx.save(); this.bctx.translate(this.ship.x, this.ship.y); this.bctx.rotate(this.ship.angle);
        this.bctx.fillStyle = 'white'; this.bctx.fillRect(-3, -2, 6, 4); this.bctx.restore();
        
        // Launch UI
        if(this.launchState === 'COUNTDOWN') {
            this.bctx.fillStyle = 'white'; this.bctx.font = 'bold 12px monospace';
            const count = Math.ceil(this.launchTimer / 60);
            this.bctx.fillText(count, this.ship.x, this.ship.y - 20);
        } else if(this.launchState === 'BOOST') {
            this.bctx.fillStyle = '#ff4b2b'; this.bctx.font = 'bold 10px monospace';
            this.bctx.fillText("LANCIO!", this.ship.x, this.ship.y - 20);
        }

        this.bctx.restore();

        this.ctx.clearRect(0,0,this.width,this.height);
        this.ctx.drawImage(this.buffer, 0, 0, this.width, this.height);

        // HUD
        this.ctx.fillStyle = 'white'; this.ctx.font = 'bold 18px monospace';
        this.ctx.fillText(`CASH: $${this.credits} | SCORE: ${this.score}`, 20, 40);
    }

    gameOver() { this.running = false; location.reload(); }
    loop() { if (!this.running) return; this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }
}

// Secret Trigger
let logoClicks = 0;
document.getElementById('secret-trigger').addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    logoClicks++;
    if (logoClicks >= 5) {
        document.getElementById('game-container').classList.add('active');
        const game = new SpaceGame('game-canvas');
        game.start();
        logoClicks = 0;
    }
});
