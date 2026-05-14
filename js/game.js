/**
 * GALAXY WORLD - Space Economy Arcade Game
 * ULTRA PIXEL EDITION - Final Logic
 */

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // HIGHER SCALE FOR EXTREME PIXELS
        this.pixelScale = 8; 
        this.buffer = document.createElement('canvas');
        this.bctx = this.buffer.getContext('2d');
        
        this.resize();

        this.G = 1.0; 
        this.friction = 0.99;
        this.baseAccel = 0.5;
        this.mapLimit = 3000; 

        this.running = false;
        this.score = 0;
        this.credits = 3000; 
        this.cargo = [];
        this.maxCargo = 8;
        this.activeCrises = [];
        this.outposts = []; 
        this.fleet = []; 

        this.camera = { x: 0, y: 0, zoom: 1.0 };
        this.ship = { x: 120, y: 0, vx: 0, vy: 0, angle: -Math.PI/2, size: 3 };

        this.sun = { x: 0, y: 0, size: 20, color: '#FFD700' };
        
        // Diversified Resources (Foods/Materials)
        this.planets = [
            { id: 'mercurio', name: 'MERCURIO', dist: 90, size: 4, color: '#95a5a6', speed: 0.015, res: 'VAPORE', req: 'GHIACCIO' },
            { id: 'venere', name: 'VENERE', dist: 140, size: 6, color: '#e67e22', speed: 0.008, res: 'ZOLFO', req: 'FILTRI' },
            { id: 'terra', name: 'TERRA', dist: 200, size: 8, color: '#4facfe', speed: 0.005, res: 'CEREALI', req: 'METALLI' },
            { id: 'luna', name: 'LUNA', parent: 'terra', dist: 30, size: 3, color: '#bdc3c7', speed: 0.03, res: 'METALLI', req: 'CEREALI' },
            { id: 'marte', name: 'MARTE', dist: 300, size: 7, color: '#ff4b2b', speed: 0.0035, res: 'MINERALI', req: 'ACQUA' },
            { id: 'giove', name: 'GIOVE', dist: 450, size: 15, color: '#f39c12', speed: 0.0012, res: 'GAS', req: 'CHIPS' },
            { id: 'saturno', name: 'SATURNO', dist: 650, size: 12, color: '#f1c40f', speed: 0.0008, res: 'IDROGENO', req: 'MEDS', rings: true },
            { id: 'urano', name: 'URANO', dist: 900, size: 10, color: '#a29bfe', speed: 0.0005, res: 'DIAMANTI', req: 'VAPORE' },
            { id: 'nettuno', name: 'NETTUNO', dist: 1200, size: 10, color: '#0984e3', speed: 0.0003, res: 'ACQUA', req: 'GAS' }
        ];

        this.init();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.buffer.width = Math.ceil(this.width / this.pixelScale);
        this.buffer.height = Math.ceil(this.height / this.pixelScale);
        this.ctx.imageSmoothingEnabled = false;
        this.bctx.imageSmoothingEnabled = false;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if(e.code === 'KeyB') this.buildOutpost();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Crisis Loop - Frequency increases with city count
        this.crisisLoop = setInterval(() => { if(this.running) this.spawnCrisis(); }, 8000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    buildOutpost() {
        if(!this.running || this.credits < 2000) return;
        this.outposts.push({ 
            id: 'op'+Date.now(), name: 'BASE '+(this.outposts.length+1), 
            x: this.ship.x, y: this.ship.y, size: 5, color: '#9b59b6', 
            res: 'CHIPS', req: 'METALLI', level: 1 
        });
        this.credits -= 2000;
    }

    spawnCrisis() {
        // ONLY ON USER CITIES
        if(this.outposts.length === 0) return;
        const p = this.outposts[Math.floor(Math.random() * this.outposts.length)];
        if(this.activeCrises.find(c => c.planet === p.id)) return;
        this.activeCrises.push({ planet: p.id, resource: p.req, timer: 45, maxTime: 45 });
    }

    start() { this.running = true; this.loop(); }

    update() {
        if (!this.running) return;

        this.ship.mass = 1 + (this.cargo.length * 0.3);
        let accel = this.baseAccel / this.ship.mass;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) { this.ship.vx += Math.cos(this.ship.angle) * accel; this.ship.vy += Math.sin(this.ship.angle) * accel; }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.15;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.15;

        let dSun = Math.sqrt(this.ship.x**2 + this.ship.y**2);
        if (dSun < this.sun.size) return this.gameOver();
        if (dSun > this.mapLimit) { this.ship.vx -= (this.ship.x / dSun) * 1.5; this.ship.vy -= (this.ship.y / dSun) * 1.5; }

        let force = this.G * 400 / (dSun**2);
        this.ship.vx -= (this.ship.x / dSun) * force;
        this.ship.vy -= (this.ship.y / dSun) * force;

        this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction; this.ship.vy *= this.friction;

        [...this.planets, ...this.outposts].forEach(p => {
            if(p.speed) { p.angle += p.speed; let parent = p.parent ? this.planets.find(pl => pl.id === p.parent) : this.sun; p.x = parent.x + Math.cos(p.angle) * p.dist; p.y = parent.y + Math.sin(p.angle) * p.dist; }
            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 4) this.dock(p);
        });

        this.activeCrises.forEach(c => { c.timer -= 1/60; if(c.timer <= 0) this.gameOver(); });
        this.camera.x += (-this.ship.x * this.camera.zoom + this.buffer.width/2 - this.camera.x) * 0.1;
        this.camera.y += (-this.ship.y * this.camera.zoom + this.buffer.height/2 - this.camera.y) * 0.1;
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
        this.bctx.fillStyle = '#020205';
        this.bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);
        this.bctx.save();
        this.bctx.translate(this.camera.x, this.camera.y);

        // Sun (Big Pixel Block)
        this.bctx.fillStyle = this.sun.color;
        this.bctx.fillRect(Math.floor(-this.sun.size), Math.floor(-this.sun.size), this.sun.size*2, this.sun.size*2);

        // Planets
        this.planets.forEach(p => {
            this.bctx.fillStyle = p.color;
            this.bctx.fillRect(Math.floor(p.x - p.size), Math.floor(p.y - p.size), p.size*2, p.size*2);
            this.bctx.fillStyle = 'white';
            this.bctx.font = '4px "Courier New"';
            this.bctx.textAlign = 'center';
            this.bctx.fillText(p.name, Math.floor(p.x), Math.floor(p.y - p.size - 2));
        });

        // Cities
        this.outposts.forEach(p => {
            this.bctx.fillStyle = p.color;
            this.bctx.fillRect(Math.floor(p.x - p.size), Math.floor(p.y - p.size), p.size*2, p.size*2);
            this.bctx.strokeStyle = 'white'; this.bctx.lineWidth = 1;
            this.bctx.strokeRect(Math.floor(p.x - p.size), Math.floor(p.y - p.size), p.size*2, p.size*2);
        });

        // Ship
        this.bctx.save();
        this.bctx.translate(Math.floor(this.ship.x), Math.floor(this.ship.y));
        this.bctx.rotate(this.ship.angle);
        this.bctx.fillStyle = 'white';
        this.bctx.fillRect(-2, -1, 4, 2);
        this.bctx.restore();

        this.bctx.restore();

        this.ctx.clearRect(0,0,this.width,this.height);
        this.ctx.drawImage(this.buffer, 0, 0, this.width, this.height);

        // HUD
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.fillText(`CASH: $${this.credits} | SCORE: ${this.score}`, 20, 40);
        this.ctx.fillText(`CARGO: ${this.cargo.join(',')}`, 20, 65);
        
        this.activeCrises.forEach((c, idx) => {
            this.ctx.fillStyle = '#f00';
            this.ctx.fillRect(this.width - 150, 20 + idx*30, (c.timer/45)*130, 15);
        });
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
