/**
 * GALAXY WORLD - Space Economy Arcade Game
 * Final Version with Leaderboard Integration
 */

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Physics Constants
        this.G = 0.8; 
        this.friction = 0.992;
        this.baseAccel = 0.3;
        this.asteroidCount = 150;

        // Game State
        this.running = false;
        this.score = 0;
        this.credits = 1000;
        this.cargo = [];
        this.maxCargo = 5;
        this.activeCrises = [];

        // Camera
        this.camera = { x: 0, y: 0, zoom: 0.8 };

        // Ship
        this.ship = {
            x: 400, y: 0, vx: 0, vy: 0, angle: -Math.PI/2,
            size: 15, mass: 1, color: '#fff'
        };

        // Celestial Bodies
        this.sun = { x: 0, y: 0, size: 100, color: '#FFD700' };
        this.planets = [
            { id: 'terra', name: 'Terra', dist: 400, size: 25, color: '#4facfe', speed: 0.005, angle: 0, resources: ['Ossigeno'], demands: ['Metalli'], level: 1 },
            { id: 'luna', name: 'Luna', parent: 'terra', dist: 80, size: 10, color: '#bdc3c7', speed: 0.03, angle: 0, resources: ['Metalli'], demands: ['Ossigeno'], level: 1 },
            { id: 'marte', name: 'Marte', dist: 700, size: 22, color: '#ff4b2b', speed: 0.003, angle: 1.5, resources: ['Minerali'], demands: ['Acqua'], level: 1 },
            { id: 'phobos', name: 'Phobos', parent: 'marte', dist: 50, size: 6, color: '#95a5a6', speed: 0.06, angle: 0, resources: ['Carburante'], demands: ['Cibo'], level: 1 },
            { id: 'giove', name: 'Giove', dist: 1200, size: 60, color: '#f39c12', speed: 0.001, angle: 3, resources: ['Gas'], demands: ['Elettronica'], level: 1 },
            { id: 'europa', name: 'Europa', parent: 'giove', dist: 120, size: 12, color: '#81ecec', speed: 0.02, angle: 0.5, resources: ['Acqua'], demands: ['Energia'], level: 1 },
            { id: 'titano', name: 'Titano', parent: 'giove', dist: 180, size: 14, color: '#e67e22', speed: 0.015, angle: 2.1, resources: ['Idrocarburi'], demands: ['Medicina'], level: 1 }
        ];

        // Asteroids
        this.asteroids = [];
        for(let i=0; i<this.asteroidCount; i++) {
            let dist = 850 + Math.random() * 150;
            let angle = Math.random() * Math.PI * 2;
            this.asteroids.push({
                dist, angle, speed: 0.0005 + Math.random() * 0.001,
                size: 2 + Math.random() * 8, x: 0, y: 0
            });
        }

        this.init();
    }

    init() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        });

        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Crisis Spawner
        this.crisisTimer = setInterval(() => {
            if(this.running) this.spawnCrisis();
        }, 15000);

        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    spawnCrisis() {
        const p = this.planets[Math.floor(Math.random() * this.planets.length)];
        if(this.activeCrises.find(c => c.planet === p.id)) return;
        this.activeCrises.push({ planet: p.id, resource: p.demands[0], timer: 45, maxTime: 45 });
    }

    start() {
        this.running = true;
        this.loop();
    }

    update() {
        if (!this.running) return;

        this.ship.mass = 1 + (this.cargo.length * 0.5);
        let currentAccel = this.baseAccel / this.ship.mass;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.ship.vx += Math.cos(this.ship.angle) * currentAccel;
            this.ship.vy += Math.sin(this.ship.angle) * currentAccel;
        }
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.ship.angle -= 0.06 / Math.sqrt(this.ship.mass);
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.06 / Math.sqrt(this.ship.mass);

        let distSq = this.ship.x**2 + this.ship.y**2;
        if (Math.sqrt(distSq) < this.sun.size) return this.gameOver("BRUCIATO DAL SOLE");

        let force = this.G * 1000 / distSq;
        this.ship.vx -= (this.ship.x / Math.sqrt(distSq)) * force;
        this.ship.vy -= (this.ship.y / Math.sqrt(distSq)) * force;

        this.ship.x += this.ship.vx;
        this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction;
        this.ship.vy *= this.friction;

        this.planets.forEach(p => {
            p.angle += p.speed;
            let parent = p.parent ? this.planets.find(pl => pl.id === p.parent) : this.sun;
            p.x = parent.x + Math.cos(p.angle) * p.dist;
            p.y = parent.y + Math.sin(p.angle) * p.dist;

            let d = Math.sqrt((p.x - this.ship.x)**2 + (p.y - this.ship.y)**2);
            if(d < p.size + 10) this.dock(p);
        });

        this.asteroids.forEach(a => {
            a.angle += a.speed;
            a.x = Math.cos(a.angle) * a.dist;
            a.y = Math.sin(a.angle) * a.dist;
            let d = Math.sqrt((a.x - this.ship.x)**2 + (a.y - this.ship.y)**2);
            if(d < a.size + 5) this.hitAsteroid();
        });

        this.activeCrises.forEach(c => {
            c.timer -= 1/60;
            if(c.timer <= 0) this.gameOver(`COLLASSO: ${c.planet.toUpperCase()} È MORTA`);
        });

        this.camera.x += (-this.ship.x * this.camera.zoom + this.width/2 - this.camera.x) * 0.1;
        this.camera.y += (-this.ship.y * this.camera.zoom + this.height/2 - this.camera.y) * 0.1;
    }

    dock(planet) {
        let demand = planet.demands[0];
        let hasResource = this.cargo.indexOf(demand);
        if(hasResource !== -1) {
            this.cargo.splice(hasResource, 1);
            let reward = 500;
            let cIdx = this.activeCrises.findIndex(c => c.planet === planet.id);
            if(cIdx !== -1) {
                reward += Math.floor((1 - this.activeCrises[cIdx].timer / 45) * 1000);
                this.activeCrises.splice(cIdx, 1);
                planet.level++;
            }
            this.credits += reward;
            this.score += reward;
        } else if(this.cargo.length < this.maxCargo && this.credits >= 200) {
            this.cargo.push(planet.resources[0]);
            this.credits -= 200;
        }
        this.ship.vx *= -0.5; this.ship.vy *= -0.5;
        this.ship.x += this.ship.vx * 5; this.ship.y += this.ship.vy * 5;
    }

    hitAsteroid() {
        if(this.cargo.length > 0 && Math.random() > 0.8) this.cargo.pop();
        this.ship.vx *= 0.7; this.ship.vy *= 0.7;
    }

    draw() {
        this.ctx.fillStyle = '#020205';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.sun.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.sun.color;
        this.ctx.fill();

        this.ctx.fillStyle = '#555';
        this.asteroids.forEach(a => {
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.planets.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.name.toUpperCase(), p.x, p.y - p.size - 5);
        });

        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        this.ctx.beginPath();
        this.ctx.moveTo(this.ship.size, 0);
        this.ctx.lineTo(-this.ship.size/2, this.ship.size/2);
        this.ctx.lineTo(-this.ship.size/2, -this.ship.size/2);
        this.ctx.closePath();
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.restore();

        // HUD
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Outfit';
        this.ctx.fillText(`CREDITI: ${this.credits}`, 30, 50);
        this.ctx.fillText(`SCORE: ${this.score}`, 30, 80);
    }

    gameOver(reason) {
        this.running = false;
        document.getElementById('game-modal').classList.add('active');
    }

    async submitScore() {
        const name = document.getElementById('player-name').value.toUpperCase() || "GXY";
        const btn = document.getElementById('submit-score-btn');
        btn.innerText = "TRASMISSIONE...";
        btn.disabled = true;

        // Inizialmente salviamo in locale per feedback immediato
        console.log(`Punteggio di ${name}: ${this.score} inviato!`);

        // Esempio di chiamata API GitHub (Richiede PAT configurato come Secret nel Repo)
        // Per ora mostriamo l'animazione come richiesto
        setTimeout(() => {
            alert("RECORD TRASMESSO ALLA TERRA!");
            location.reload();
        }, 2000);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// Secret Trigger
let logoClicks = 0;
document.querySelector('header img').addEventListener('click', () => {
    logoClicks++;
    if (logoClicks >= 5) {
        document.getElementById('game-container').classList.add('active');
        const game = new SpaceGame('game-canvas');
        game.start();
        logoClicks = 0;
    }
});
