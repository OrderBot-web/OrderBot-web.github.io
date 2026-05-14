/**
 * GALAXY WORLD - Space Economy Arcade Game
 * Fleet & Automation Update
 */

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.G = 0.8; 
        this.friction = 0.992;
        this.baseAccel = 0.35;
        this.asteroidCount = 200;

        this.running = false;
        this.score = 0;
        this.credits = 1000;
        this.cargo = [];
        this.maxCargo = 6;
        this.activeCrises = [];
        this.outposts = []; 
        this.fleet = []; // PNG Pilots

        this.camera = { x: 0, y: 0, zoom: 0.6 };
        this.ship = { x: 450, y: 0, vx: 0, vy: 0, angle: -Math.PI/2, size: 14, mass: 1, color: '#fff' };

        this.sun = { x: 0, y: 0, size: 110, color: '#FFD700' };
        
        this.planets = [
            { id: 'mercurio', name: 'Mercurio', dist: 220, size: 12, color: '#95a5a6', speed: 0.015, angle: Math.random()*6, resources: ['Calore'], demands: ['Ghiaccio'], level: 1 },
            { id: 'venere', name: 'Venere', dist: 320, size: 22, color: '#e67e22', speed: 0.008, angle: Math.random()*6, resources: ['Acido'], demands: ['Filtri'], level: 1 },
            { id: 'terra', name: 'Terra', dist: 450, size: 25, color: '#4facfe', speed: 0.005, angle: 0, resources: ['Cibo'], demands: ['Metalli'], level: 1 },
            { id: 'luna', name: 'Luna', parent: 'terra', dist: 80, size: 10, color: '#bdc3c7', speed: 0.03, angle: 0, resources: ['Metalli'], demands: ['Cibo'], level: 1 },
            { id: 'marte', name: 'Marte', dist: 650, size: 20, color: '#ff4b2b', speed: 0.0035, angle: 1.2, resources: ['Minerali'], demands: ['Acqua'], level: 1 },
            { id: 'phobos', name: 'Phobos', parent: 'marte', dist: 45, size: 5, color: '#7f8c8d', speed: 0.08, angle: 0, resources: ['Carburante'], demands: ['Minerali'], level: 1 },
            { id: 'giove', name: 'Giove', dist: 1300, size: 65, color: '#f39c12', speed: 0.0012, angle: 2.5, resources: ['Idrogeno'], demands: ['Elettronica'], level: 1 },
            { id: 'europa', name: 'Europa', parent: 'giove', dist: 120, size: 12, color: '#81ecec', speed: 0.02, angle: 0.5, resources: ['Ghiaccio'], demands: ['Energia'], level: 1 },
            { id: 'io', name: 'Io', parent: 'giove', dist: 90, size: 11, color: '#f1c40f', speed: 0.04, angle: 1.8, resources: ['Zolfo'], demands: ['Sonda'], level: 1 },
            { id: 'saturno', name: 'Saturno', dist: 1900, size: 55, color: '#f1c40f', speed: 0.0008, angle: 4, resources: ['Gas'], demands: ['Filtri'], level: 1, rings: true },
            { id: 'titano', name: 'Titano', parent: 'saturno', dist: 140, size: 15, color: '#d35400', speed: 0.012, angle: 0.8, resources: ['Metano'], demands: ['Medicina'], level: 1 },
            { id: 'encelado', name: 'Encelado', parent: 'saturno', dist: 100, size: 8, color: '#ecf0f1', speed: 0.025, angle: 3.1, resources: ['Acqua'], demands: ['Energia'], level: 1 },
            { id: 'urano', name: 'Urano', dist: 2600, size: 35, color: '#a29bfe', speed: 0.0005, angle: 5, resources: ['Diamanti'], demands: ['Calore'], level: 1 },
            { id: 'nettuno', name: 'Nettuno', dist: 3200, size: 34, color: '#0984e3', speed: 0.0003, angle: 1, resources: ['Energia'], demands: ['Metano'], level: 1 }
        ];

        this.asteroids = [];
        for(let i=0; i<this.asteroidCount; i++) {
            let dist = 850 + Math.random() * 250;
            let angle = Math.random() * Math.PI * 2;
            this.asteroids.push({ dist, angle, speed: 0.0004 + Math.random() * 0.001, size: 3 + Math.random() * 10, x: 0, y: 0 });
        }

        this.init();
    }

    init() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth; this.height = window.innerHeight;
            this.canvas.width = this.width; this.canvas.height = this.height;
        });
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if(e.code === 'KeyB') this.buildOutpost();
            if(e.code === 'KeyH') this.hirePilot();
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.crisisTimer = setInterval(() => { if(this.running) this.spawnCrisis(); }, 12000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    buildOutpost() {
        if(!this.running || this.credits < 2000) return;
        let nearPlanet = this.planets.find(p => Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2) < p.size + 150);
        if(!nearPlanet) {
            this.outposts.push({ id: 'op'+Date.now(), name: 'STAZIONE '+ (this.outposts.length+1), x: this.ship.x, y: this.ship.y, size: 15, color: '#9b59b6', resources: ['Ricerca'], demands: ['Energia'], level: 1 });
            this.credits -= 2000;
        }
    }

    hirePilot() {
        if(!this.running || this.credits < 5000) return;
        // Hiring a pilot that moves from Terra to a random planet
        const target = this.planets[Math.floor(Math.random() * this.planets.length)];
        this.fleet.push({
            x: 0, y: 0, targetId: target.id, progress: 0, speed: 0.005,
            name: "PILOTA " + (this.fleet.length + 1)
        });
        this.credits -= 5000;
        alert("PILOTA ASSUNTO! Sta consegnando verso " + target.name);
    }

    spawnCrisis() {
        const candidates = [...this.planets, ...this.outposts].filter(p => !p.parent);
        const p = candidates[Math.floor(Math.random() * candidates.length)];
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
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.07 / Math.sqrt(this.ship.mass);
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.07 / Math.sqrt(this.ship.mass);

        let distSq = this.ship.x**2 + this.ship.y**2;
        let dist = Math.sqrt(distSq);
        if (dist < this.sun.size) return this.gameOver("BRUCIATO DAL SOLE");

        let force = this.G * 1500 / distSq;
        this.ship.vx -= (this.ship.x / dist) * force;
        this.ship.vy -= (this.ship.y / dist) * force;

        this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction; this.ship.vy *= this.friction;

        // Planets & Outposts
        [...this.planets, ...this.outposts].forEach(p => {
            if(p.speed) { // It's a planet
                p.angle += p.speed;
                let parent = p.parent ? this.planets.find(pl => pl.id === p.parent) : this.sun;
                p.x = parent.x + Math.cos(p.angle) * p.dist;
                p.y = parent.y + Math.sin(p.angle) * p.dist;
            }
            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 12) this.dock(p);
        });

        // Asteroids
        this.asteroids.forEach(a => {
            a.angle += a.speed; a.x = Math.cos(a.angle) * a.dist; a.y = Math.sin(a.angle) * a.dist;
            let d = Math.sqrt((a.x - this.ship.x)**2 + (a.y - this.ship.y)**2);
            if(d < a.size + 5) this.hitAsteroid();
        });

        // Fleet Automation
        this.fleet.forEach((pilot, idx) => {
            pilot.progress += pilot.speed;
            const target = this.planets.find(p => p.id === pilot.targetId);
            const terra = this.planets.find(p => p.id === 'terra');
            
            // Linear interpolation between Terra and Target
            pilot.x = terra.x + (target.x - terra.x) * pilot.progress;
            pilot.y = terra.y + (target.y - terra.y) * pilot.progress;

            if(pilot.progress >= 1) {
                this.credits += 1500;
                this.score += 1000;
                // Re-route
                pilot.progress = 0;
                pilot.targetId = this.planets[Math.floor(Math.random() * this.planets.length)].id;
            }
        });

        this.activeCrises.forEach(c => {
            c.timer -= 1/60;
            if(c.timer <= 0) this.gameOver(`COLLASSO: ${c.planet.toUpperCase()} È MORTA`);
        });

        this.camera.x += (-this.ship.x * this.camera.zoom + this.width/2 - this.camera.x) * 0.08;
        this.camera.y += (-this.ship.y * this.camera.zoom + this.height/2 - this.camera.y) * 0.08;
    }

    dock(planet) {
        let demand = planet.demands[0];
        let resIdx = this.cargo.indexOf(demand);
        if(resIdx !== -1) {
            this.cargo.splice(resIdx, 1);
            let reward = 600;
            let cIdx = this.activeCrises.findIndex(c => c.planet === planet.id);
            if(cIdx !== -1) {
                reward += Math.floor((1 - this.activeCrises[cIdx].timer / 60) * 1500);
                this.activeCrises.splice(cIdx, 1);
                planet.level++;
            }
            this.credits += reward; this.score += reward;
        } else if(this.cargo.length < this.maxCargo && this.credits >= 150) {
            this.cargo.push(planet.resources[0]);
            this.credits -= 150;
        }
        this.ship.vx *= -0.3; this.ship.vy *= -0.3;
        this.ship.x += this.ship.vx * 8; this.ship.y += this.ship.vy * 8;
    }

    hitAsteroid() {
        if(this.cargo.length > 0 && Math.random() > 0.8) this.cargo.pop();
        this.ship.vx *= 0.6; this.ship.vy *= 0.6;
    }

    draw() {
        this.ctx.fillStyle = '#020205';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Sun
        this.ctx.beginPath(); this.ctx.arc(0, 0, this.sun.size, 0, Math.PI * 2); this.ctx.fillStyle = this.sun.color; this.ctx.fill();

        // Planets, Outposts, Asteroids...
        this.planets.forEach(p => {
            if(p.rings) { this.ctx.strokeStyle = 'rgba(255,255,255,0.1)'; this.ctx.lineWidth = 10; this.ctx.beginPath(); this.ctx.ellipse(p.x, p.y, p.size * 2, p.size * 0.8, p.angle, 0, Math.PI*2); this.ctx.stroke(); }
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fillStyle = p.color; this.ctx.fill();
        });

        this.outposts.forEach(p => {
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fillStyle = p.color; this.ctx.fill();
            this.ctx.strokeStyle = 'white'; this.ctx.lineWidth = 2; this.ctx.stroke();
        });

        // Fleet (Pilots)
        this.fleet.forEach(p => {
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
            this.ctx.font = '8px Inter';
            this.ctx.fillText(p.name, p.x, p.y - 10);
        });

        // Ship
        this.ctx.save(); this.ctx.translate(this.ship.x, this.ship.y); this.ctx.rotate(this.ship.angle);
        this.ctx.beginPath(); this.ctx.moveTo(this.ship.size, 0); this.ctx.lineTo(-this.ship.size/2, this.ship.size/2); this.ctx.lineTo(-this.ship.size/2, -this.ship.size/2); this.ctx.closePath();
        this.ctx.fillStyle = 'white'; this.ctx.fill(); this.ctx.restore();

        this.ctx.restore();

        // HUD
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 22px Outfit';
        this.ctx.fillText(`$ ${this.credits}`, 40, 60);
        this.ctx.font = '11px Inter';
        this.ctx.fillText(`B: COSTRUISCI (2000) | H: ASSUMI PILOTA (5000)`, 40, 85);
        this.ctx.fillText(`FLOTTA: ${this.fleet.length} NAVI PNG`, 40, 105);
        this.ctx.fillText(`STIVA: ${this.cargo.join(', ')}`, 40, 125);

        this.activeCrises.forEach((c, idx) => {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(this.width - 260, 30 + idx*70, 230, 60);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`CRISI: ${c.planet.toUpperCase()}`, this.width - 250, 55 + idx*70);
            this.ctx.fillStyle = '#ff4b2b';
            this.ctx.fillRect(this.width - 250, 65 + idx*70, (c.timer/c.maxTime) * 210, 6);
        });
    }

    gameOver(reason) { this.running = false; document.getElementById('game-modal').classList.add('active'); document.querySelector('#game-modal h2').innerText = reason; }

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
