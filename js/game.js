/**
 * GALAXY WORLD - Space Economy Arcade Game
 * Pixel Edition + Map Border
 */

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.pixelScale = 4;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.buffer = document.createElement('canvas');
        this.bctx = this.buffer.getContext('2d');
        
        this.resize();

        this.G = 0.8; 
        this.friction = 0.992;
        this.baseAccel = 0.4;
        this.mapLimit = 2500; // Border at this distance

        this.running = false;
        this.score = 0;
        this.credits = 2500; 
        this.cargo = [];
        this.maxCargo = 6;
        this.activeCrises = [];
        this.outposts = []; 
        this.fleet = []; 

        this.camera = { x: 0, y: 0, zoom: 0.8 };
        this.ship = { x: 100, y: 0, vx: 0, vy: 0, angle: -Math.PI/2, size: 4, mass: 1 };

        this.sun = { x: 0, y: 0, size: 25, color: '#FFD700' };
        
        this.planets = [
            { id: 'mercurio', name: 'MERCURIO', dist: 80, size: 4, color: '#95a5a6', speed: 0.015, angle: Math.random()*6, resources: ['CALORE'], demands: ['GHIACCIO'] },
            { id: 'venere', name: 'VENERE', dist: 120, size: 6, color: '#e67e22', speed: 0.008, angle: Math.random()*6, resources: ['ACIDO'], demands: ['FILTRI'] },
            { id: 'terra', name: 'TERRA', dist: 180, size: 8, color: '#4facfe', speed: 0.005, angle: 0, resources: ['CIBO'], demands: ['METALLI'] },
            { id: 'luna', name: 'LUNA', parent: 'terra', dist: 25, size: 3, color: '#bdc3c7', speed: 0.03, angle: 0, resources: ['METALLI'], demands: ['CIBO'] },
            { id: 'marte', name: 'MARTE', dist: 250, size: 6, color: '#ff4b2b', speed: 0.0035, angle: 1.2, resources: ['MINERALI'], demands: ['ACQUA'] },
            { id: 'giove', name: 'GIOVE', dist: 400, size: 15, color: '#f39c12', speed: 0.0012, angle: 2.5, resources: ['GAS'], demands: ['ELETTRONICA'] },
            { id: 'saturno', name: 'SATURNO', dist: 600, size: 12, color: '#f1c40f', speed: 0.0008, angle: 4, resources: ['METANO'], demands: ['MEDICINA'], rings: true },
            { id: 'urano', name: 'URANO', dist: 850, size: 10, color: '#a29bfe', speed: 0.0005, angle: 5, resources: ['DIAMANTI'], demands: ['CALORE'] },
            { id: 'nettuno', name: 'NETTUNO', dist: 1100, size: 10, color: '#0984e3', speed: 0.0003, angle: 1, resources: ['ENERGIA'], demands: ['METANO'] }
        ];

        this.init();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.buffer.width = this.width / this.pixelScale;
        this.buffer.height = this.height / this.pixelScale;
        this.ctx.imageSmoothingEnabled = false;
        this.bctx.imageSmoothingEnabled = false;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if(e.code === 'KeyB') this.buildOutpost();
            if(e.code === 'KeyH') this.hirePilot();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.canvas.addEventListener('touchstart', (e) => { this.isTouching = true; this.handleTouch(e); });
        this.canvas.addEventListener('touchmove', (e) => { this.handleTouch(e); });
        this.canvas.addEventListener('touchend', () => { this.isTouching = false; });

        this.crisisTimer = setInterval(() => { if(this.running) this.spawnCrisis(); }, 10000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    handleTouch(e) { e.preventDefault(); const touch = e.touches[0]; this.touchPos = { x: touch.clientX, y: touch.clientY }; }

    buildOutpost() {
        if(!this.running || this.credits < 2000) return;
        this.outposts.push({ 
            id: 'op'+Date.now(), name: 'CITTÀ '+ (this.outposts.length+1), 
            x: this.ship.x, y: this.ship.y, size: 5, color: '#9b59b6', 
            resources: ['RICERCA'], demands: ['ENERGIA'], level: 1 
        });
        this.credits -= 2000;
    }

    hirePilot() {
        if(!this.running || this.credits < 5000) return;
        const target = this.planets[Math.floor(Math.random() * this.planets.length)];
        this.fleet.push({ x: 0, y: 0, targetId: target.id, progress: 0, speed: 0.005, name: "P" + (this.fleet.length + 1) });
        this.credits -= 5000;
    }

    spawnCrisis() {
        if(this.outposts.length === 0) return;
        const p = this.outposts[Math.floor(Math.random() * this.outposts.length)];
        if(this.activeCrises.find(c => c.planet === p.id)) return;
        this.activeCrises.push({ planet: p.id, resource: p.demands[0], timer: 60, maxTime: 60 });
    }

    start() { this.running = true; this.loop(); }

    update() {
        if (!this.running) return;

        this.ship.mass = 1 + (this.cargo.length * 0.4);
        let accel = this.baseAccel / this.ship.mass;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.1;

        if (this.isTouching) {
            const worldTouchX = (this.touchPos.x / this.pixelScale - this.camera.x) / this.camera.zoom;
            const worldTouchY = (this.touchPos.y / this.pixelScale - this.camera.y) / this.camera.zoom;
            const targetAngle = Math.atan2(worldTouchY - this.ship.y, worldTouchX - this.ship.x);
            let angleDiff = targetAngle - this.ship.angle;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.ship.angle += angleDiff * 0.1;
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
        }

        let distSq = this.ship.x**2 + this.ship.y**2;
        let dist = Math.sqrt(distSq);
        if (dist < this.sun.size) return this.gameOver("BRUCIATO");

        // MAP BORDER COLLISION
        if (dist > this.mapLimit) {
            this.ship.vx -= (this.ship.x / dist) * 0.5;
            this.ship.vy -= (this.ship.y / dist) * 0.5;
            this.ship.vx *= 0.9;
            this.ship.vy *= 0.9;
        }

        let force = this.G * 200 / distSq;
        this.ship.vx -= (this.ship.x / dist) * force;
        this.ship.vy -= (this.ship.y / dist) * force;

        this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction; this.ship.vy *= this.friction;

        [...this.planets, ...this.outposts].forEach(p => {
            if(p.speed) { 
                p.angle += p.speed;
                let parent = p.parent ? this.planets.find(pl => pl.id === p.parent) : this.sun;
                p.x = parent.x + Math.cos(p.angle) * p.dist;
                p.y = parent.y + Math.sin(p.angle) * p.dist;
            }
            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 3) this.dock(p);
        });

        this.fleet.forEach(pilot => {
            pilot.progress += pilot.speed;
            const target = this.planets.find(p => p.id === pilot.targetId);
            const terra = this.planets.find(p => p.id === 'terra');
            const midDist = (terra.dist + target.dist) / 2 + 50;
            const midAngle = (terra.angle + target.angle) / 2;
            if (pilot.progress < 0.5) { let p = pilot.progress * 2; pilot.x = terra.x + (Math.cos(midAngle) * midDist - terra.x) * p; pilot.y = terra.y + (Math.sin(midAngle) * midDist - terra.y) * p; }
            else { let p = (pilot.progress - 0.5) * 2; pilot.x = (Math.cos(midAngle) * midDist) + (target.x - (Math.cos(midAngle) * midDist)) * p; pilot.y = (Math.sin(midAngle) * midDist) + (target.y - (Math.sin(midAngle) * midDist)) * p; }
            if(pilot.progress >= 1) { this.credits += 1500; pilot.progress = 0; pilot.targetId = this.planets[Math.floor(Math.random() * this.planets.length)].id; }
        });

        this.activeCrises.forEach(c => { c.timer -= 1/60; if(c.timer <= 0) this.gameOver(`CITTÀ COLLASSATA`); });
        
        this.camera.x += (-this.ship.x * this.camera.zoom + this.buffer.width/2 - this.camera.x) * 0.1;
        this.camera.y += (-this.ship.y * this.camera.zoom + this.buffer.height/2 - this.camera.y) * 0.1;
    }

    dock(planet) {
        let demand = planet.demands ? planet.demands[0] : null;
        let resIdx = this.cargo.indexOf(demand);
        if(resIdx !== -1) {
            this.cargo.splice(resIdx, 1);
            let reward = 1000;
            let cIdx = this.activeCrises.findIndex(c => c.planet === planet.id);
            if(cIdx !== -1) { this.activeCrises.splice(cIdx, 1); reward += 2000; }
            this.credits += reward; this.score += reward;
        } else if(this.cargo.length < this.maxCargo && this.credits >= 100 && planet.resources) {
            this.cargo.push(planet.resources[0]);
            this.credits -= 100;
        }
        this.ship.vx *= -0.2; this.ship.vy *= -0.2;
    }

    draw() {
        this.bctx.fillStyle = '#020205';
        this.bctx.fillRect(0, 0, this.buffer.width, this.buffer.height);

        this.bctx.save();
        this.bctx.translate(this.camera.x, this.camera.y);
        this.bctx.scale(this.camera.zoom, this.camera.zoom);

        // MAP BORDER
        this.bctx.strokeStyle = 'rgba(155, 89, 182, 0.2)';
        this.bctx.lineWidth = 2;
        this.bctx.beginPath();
        this.bctx.arc(0, 0, this.mapLimit, 0, Math.PI * 2);
        this.bctx.stroke();

        // Sun
        this.bctx.fillStyle = this.sun.color;
        this.bctx.fillRect(-this.sun.size, -this.sun.size, this.sun.size*2, this.sun.size*2);

        // Planets
        this.planets.forEach(p => {
            this.bctx.fillStyle = p.color;
            this.bctx.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
        });

        // Outposts
        this.outposts.forEach(p => {
            this.bctx.fillStyle = p.color;
            this.bctx.fillRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
            this.bctx.strokeStyle = 'white';
            this.bctx.strokeRect(p.x - p.size, p.y - p.size, p.size*2, p.size*2);
        });

        // Ship
        this.bctx.save();
        this.bctx.translate(this.ship.x, this.ship.y);
        this.bctx.rotate(this.ship.angle);
        this.bctx.fillStyle = 'white';
        this.bctx.fillRect(-2, -2, 5, 4);
        this.bctx.restore();

        this.bctx.restore();

        this.ctx.clearRect(0,0,this.width,this.height);
        this.ctx.drawImage(this.buffer, 0, 0, this.width, this.height);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px "Courier New"';
        this.ctx.fillText(`$ ${this.credits} | SCORE: ${this.score}`, 30, 50);
    }

    gameOver(reason) { this.running = false; document.getElementById('game-modal').classList.add('active'); }
    async submitScore() { location.reload(); }
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
