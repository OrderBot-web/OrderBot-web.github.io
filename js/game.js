/**
 * GALAXY WORLD - Space Economy Arcade Game v2
 * Solar System Edition: Moons · Asteroids · Fleet · City Growth
 */

const GITHUB_REPO = 'OrderBot-web/OrderBot-web.github.io'; // owner/repo
const GITHUB_TOKEN = '';           // GitHub PAT with public_repo scope

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
        this.mapLimit = 2600;

        this.running = false;
        this.score = 0;
        this.credits = 3000;
        this.cargo = [];
        this.maxCargo = 8;
        this.hull = 3;
        this.asteroidHitCooldown = 0;
        this.activeCrises = [];
        this.particles = [];
        this.pilots = [];
        this.showHireMenu = false;
        this.stars = this._genStars(220);
        this.camera = { x: 0, y: 0, zoom: 0.7 };
        this.sun = { x: 0, y: 0, size: 28 };

        this.planets = [
            { id: 'mercurio', name: 'MERCURIO', dist: 110,  size: 5,  color: '#95a5a6', speed: 0.016,  res: 'SOLARE',      req: 'FILTRI',    deliveries: 0, crisis: null },
            { id: 'venere',   name: 'VENERE',   dist: 170,  size: 7,  color: '#e67e22', speed: 0.009,  res: 'ACIDO',       req: 'CIBO',      deliveries: 0, crisis: null },
            { id: 'terra',    name: 'TERRA',    dist: 250,  size: 9,  color: '#4facfe', speed: 0.005,  res: 'CIBO',        req: 'ELIO-3',    deliveries: 0, crisis: null },
            { id: 'marte',    name: 'MARTE',    dist: 390,  size: 8,  color: '#ff4b2b', speed: 0.004,  res: 'FERRO',       req: 'ACQUA',     deliveries: 0, crisis: null },
            { id: 'giove',    name: 'GIOVE',    dist: 620,  size: 20, color: '#f39c12', speed: 0.0012, res: 'GAS',         req: 'CHIPS',     deliveries: 0, crisis: null },
            { id: 'saturno',  name: 'SATURNO',  dist: 880,  size: 16, color: '#f1c40f', speed: 0.0008, res: 'GHIACCIO',   req: 'MEDS',      deliveries: 0, crisis: null, rings: true },
            { id: 'urano',    name: 'URANO',    dist: 1130, size: 14, color: '#a29bfe', speed: 0.0005, res: 'DIAMANTI',   req: 'GAS',       deliveries: 0, crisis: null },
            { id: 'nettuno',  name: 'NETTUNO',  dist: 1450, size: 14, color: '#0984e3', speed: 0.0003, res: 'ENERGIA',    req: 'DIAMANTI',  deliveries: 0, crisis: null },
        ];

        this.moons = [
            { id: 'luna',     name: 'LUNA',     parent: 'terra',   dist: 32, size: 4, color: '#bdc3c7', speed: 0.030, res: 'ELIO-3',     req: 'CIBO',     deliveries: 0, crisis: null },
            { id: 'phobos',   name: 'PHOBOS',   parent: 'marte',   dist: 20, size: 3, color: '#aaaaaa', speed: 0.080, res: 'ACQUA',      req: 'FERRO',    deliveries: 0, crisis: null },
            { id: 'deimos',   name: 'DEIMOS',   parent: 'marte',   dist: 36, size: 3, color: '#888888', speed: 0.040, res: 'SILICIO',    req: 'ENERGIA',  deliveries: 0, crisis: null },
            { id: 'io',       name: 'IO',       parent: 'giove',   dist: 36, size: 4, color: '#f1c40f', speed: 0.055, res: 'ZOLFO',     req: 'GAS',      deliveries: 0, crisis: null },
            { id: 'europa',   name: 'EUROPA',   parent: 'giove',   dist: 52, size: 4, color: '#dfe6e9', speed: 0.035, res: 'ACQUA',     req: 'CHIPS',    deliveries: 0, crisis: null },
            { id: 'ganimede', name: 'GANIMEDE', parent: 'giove',   dist: 70, size: 5, color: '#b2bec3', speed: 0.022, res: 'GHIACCIO',  req: 'MEDS',     deliveries: 0, crisis: null },
            { id: 'callisto', name: 'CALLISTO', parent: 'giove',   dist: 90, size: 4, color: '#636e72', speed: 0.014, res: 'MINERALI',  req: 'CIBO',     deliveries: 0, crisis: null },
            { id: 'titano',   name: 'TITANO',   parent: 'saturno', dist: 58, size: 5, color: '#fdcb6e', speed: 0.020, res: 'IDROCARBURI',req: 'FILTRI',  deliveries: 0, crisis: null },
            { id: 'encelado', name: 'ENCELADO', parent: 'saturno', dist: 38, size: 3, color: '#ecf0f1', speed: 0.040, res: 'ACQUA',     req: 'MINERALI', deliveries: 0, crisis: null },
            { id: 'titania',  name: 'TITANIA',  parent: 'urano',   dist: 48, size: 4, color: '#a29bfe', speed: 0.028, res: 'CRISTALLI', req: 'ENERGIA',  deliveries: 0, crisis: null },
            { id: 'tritone',  name: 'TRITONE',  parent: 'nettuno', dist: 42, size: 4, color: '#74b9ff', speed: 0.025, res: 'AZOTO',     req: 'DIAMANTI', deliveries: 0, crisis: null },
        ];

        this.allBodies = [...this.planets, ...this.moons];

        // Asteroid belt between Marte (390) and Giove (620)
        this.asteroids = Array.from({ length: 48 }, (_, i) => {
            const angle = (i / 48) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const dist  = 458 + Math.random() * 100;
            return {
                angle, dist,
                speed: 0.0016 + Math.random() * 0.001,
                size: 1 + Math.floor(Math.random() * 3),
                color: Math.random() > 0.5 ? '#7f8c8d' : '#95a5a6',
                x: 0, y: 0
            };
        });

        this.pilotRoster = [
            { type: 'ROOKIE',    cost: 800,  speed: 2.0, skillDodge: false, color: '#74b9ff', desc: 'Economico · vulnerabile agli asteroidi' },
            { type: 'SPERICOLATO', cost: 1500, speed: 3.8, skillDodge: false, color: '#fd79a8', desc: 'Velocissimo · ignora i rischi' },
            { type: 'VETERANO',  cost: 3000, speed: 2.8, skillDodge: true,  color: '#55efc4', desc: 'Costoso · evita la fascia' },
        ];

        // Initialise body positions so they exist before first frame
        this.planets.forEach(p => { p.angle = 0; p.x = p.dist; p.y = 0; });
        this.moons.forEach(m => {
            m.angle = 0;
            const par = this.planets.find(p => p.id === m.parent);
            m.x = (par ? par.x : 0) + m.dist;
            m.y = par ? par.y : 0;
        });
        this.asteroids.forEach(a => { a.x = Math.cos(a.angle) * a.dist; a.y = Math.sin(a.angle) * a.dist; });

        const terra = this.planets.find(p => p.id === 'terra');
        this.ship = { x: terra.x, y: terra.y, vx: 0, vy: 0, angle: -Math.PI / 2, size: 5 };
        this.launchState = 'COUNTDOWN';
        this.launchTimer = 180;

        this.init();
    }

    // ─── Setup ──────────────────────────────────────────────────────────────

    _genStars(n) {
        return Array.from({ length: n }, () => ({
            x: (Math.random() - 0.5) * 3600,
            y: (Math.random() - 0.5) * 3600,
            size: Math.random() > 0.85 ? 2 : 1,
            alpha: 0.25 + Math.random() * 0.75
        }));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width  = this.width;
        this.canvas.height = this.height;
        this.buffer.width  = Math.ceil(this.width  / this.pixelScale);
        this.buffer.height = Math.ceil(this.height / this.pixelScale);
        this.ctx.imageSmoothingEnabled  = false;
        this.bctx.imageSmoothingEnabled = false;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'KeyH') this.showHireMenu = !this.showHireMenu;
            if (this.showHireMenu) {
                if (e.code === 'Digit1') this.hireNPC(0);
                if (e.code === 'Digit2') this.hireNPC(1);
                if (e.code === 'Digit3') this.hireNPC(2);
            }
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
        this.canvas.addEventListener('touchstart', e => { this.isTouching = true;  this.handleTouch(e); }, { passive: false });
        this.canvas.addEventListener('touchmove',  e => { this.handleTouch(e); },                          { passive: false });
        this.canvas.addEventListener('touchend',   () => { this.isTouching = false; });
        this.crisisInterval = setInterval(() => { if (this.running && this.launchState === 'PLAY') this.spawnCrisis(); }, 13000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.touchPos = { x: t.clientX, y: t.clientY };
    }

    // ─── Fleet ──────────────────────────────────────────────────────────────

    hireNPC(idx) {
        const def = this.pilotRoster[idx];
        if (!def || this.credits < def.cost) return;
        const bodiesWithPos = this.allBodies.filter(b => b.x !== undefined);
        const from = bodiesWithPos[Math.floor(Math.random() * bodiesWithPos.length)];
        const rest = bodiesWithPos.filter(b => b !== from);
        const to   = rest[Math.floor(Math.random() * rest.length)];
        this.credits -= def.cost;
        this.pilots.push({
            ...def,
            x: from.x, y: from.y, vx: 0, vy: 0,
            angle: 0, hull: 2,
            state: 'pickup', cargo: null,
            fromId: from.id, toId: to.id,
        });
        this.showHireMenu = false;
    }

    // ─── Economy ────────────────────────────────────────────────────────────

    spawnCrisis() {
        const cands = this.allBodies.filter(b => !b.crisis);
        if (!cands.length) return;
        const body = cands[Math.floor(Math.random() * cands.length)];
        body.crisis = { resource: body.req, timer: 55, maxTime: 55 };
        this.activeCrises.push(body);
    }

    dock(body) {
        const resIdx = this.cargo.indexOf(body.req);
        if (resIdx !== -1) {
            this.cargo.splice(resIdx, 1);
            let reward = 1200;
            if (body.crisis) {
                body.crisis = null;
                this.activeCrises = this.activeCrises.filter(b => b !== body);
                reward += 4000;
                this.score += 4000;
            }
            this.credits += reward;
            this.score   += reward;
            body.deliveries++;
            // Brief dock flash particles
            for (let i = 0; i < 6; i++) {
                const a = Math.random() * Math.PI * 2;
                this._particle(body.x, body.y, Math.cos(a), Math.sin(a), '#f1c40f', 20);
            }
        } else if (this.cargo.length < this.maxCargo && this.credits >= 100 && body.res) {
            this.cargo.push(body.res);
            this.credits -= 100;
        }
        this.ship.vx *= -0.15;
        this.ship.vy *= -0.15;
    }

    // ─── Update ─────────────────────────────────────────────────────────────

    start() { this.running = true; this.loop(); }

    update() {
        if (!this.running) return;
        this._updateBodies();
        this._updateShip();
        if (this.launchState === 'PLAY') {
            this._updateNPCs();
            this._updateCrises();
        }
        this._updateParticles();
        this.camera.x = -this.ship.x * this.camera.zoom + this.buffer.width  / 2;
        this.camera.y = -this.ship.y * this.camera.zoom + this.buffer.height / 2;
    }

    _updateBodies() {
        this.planets.forEach(p => {
            p.angle = (p.angle || 0) + p.speed;
            p.x = Math.cos(p.angle) * p.dist;
            p.y = Math.sin(p.angle) * p.dist;
        });
        this.moons.forEach(m => {
            m.angle = (m.angle || 0) + m.speed;
            const par = this.planets.find(p => p.id === m.parent);
            if (par) { m.x = par.x + Math.cos(m.angle) * m.dist; m.y = par.y + Math.sin(m.angle) * m.dist; }
        });
        this.asteroids.forEach(a => {
            a.angle += a.speed;
            a.x = Math.cos(a.angle) * a.dist;
            a.y = Math.sin(a.angle) * a.dist;
        });
    }

    _updateShip() {
        if (this.launchState === 'COUNTDOWN') {
            this.launchTimer--;
            const terra = this.planets.find(p => p.id === 'terra');
            this.ship.x = terra.x; this.ship.y = terra.y;
            if (this.launchTimer <= 0) { this.launchState = 'BOOST'; this.launchTimer = 60; }
            return;
        }
        if (this.launchState === 'BOOST') {
            this.launchTimer--;
            this.ship.vy = -3; this.ship.angle = -Math.PI / 2;
            if (Math.random() > 0.4) this._particle(this.ship.x, this.ship.y, (Math.random()-0.5)*0.5, 2, '#ff4b2b', 28);
            if (this.launchTimer <= 0) this.launchState = 'PLAY';
            return;
        }

        // PLAY
        this.ship.mass = 1 + this.cargo.length * 0.25;
        const accel = this.baseAccel / this.ship.mass;

        if (this.keys['ArrowUp']    || this.keys['KeyW']) {
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
            this._particle(this.ship.x, this.ship.y,
                -Math.cos(this.ship.angle)*0.6 + (Math.random()-0.5)*0.4,
                -Math.sin(this.ship.angle)*0.6 + (Math.random()-0.5)*0.4,
                '#ff6b35', 18);
        }
        if (this.keys['ArrowLeft']  || this.keys['KeyA']) this.ship.angle -= 0.10;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.10;

        if (this.isTouching && this.touchPos) {
            const wx = (this.touchPos.x / this.pixelScale - this.camera.x) / this.camera.zoom;
            const wy = (this.touchPos.y / this.pixelScale - this.camera.y) / this.camera.zoom;
            let diff = Math.atan2(wy - this.ship.y, wx - this.ship.x) - this.ship.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            this.ship.angle += diff * 0.15;
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
        }

        const dSun = Math.sqrt(this.ship.x ** 2 + this.ship.y ** 2);
        if (dSun < this.sun.size + 6) { this.gameOver('BRUCIATO DAL SOLE'); return; }
        const force = this.G * 300 / (dSun ** 2);
        this.ship.vx -= (this.ship.x / dSun) * force;
        this.ship.vy -= (this.ship.y / dSun) * force;
        if (dSun > this.mapLimit) {
            this.ship.vx -= (this.ship.x / dSun) * 2;
            this.ship.vy -= (this.ship.y / dSun) * 2;
        }
        this.ship.x += this.ship.vx;
        this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction;
        this.ship.vy *= this.friction;

        // Dock check
        for (const b of this.allBodies) {
            const d = Math.sqrt((b.x - this.ship.x) ** 2 + (b.y - this.ship.y) ** 2);
            if (d < b.size + 8) { this.dock(b); break; }
        }

        // Asteroid collision
        if (this.asteroidHitCooldown > 0) { this.asteroidHitCooldown--; return; }
        for (const a of this.asteroids) {
            const d = Math.sqrt((a.x - this.ship.x) ** 2 + (a.y - this.ship.y) ** 2);
            if (d < a.size + 4) {
                this.hull--;
                if (this.cargo.length > 0) this.cargo.pop();
                this.ship.vx = (this.ship.x - a.x) * 0.35;
                this.ship.vy = (this.ship.y - a.y) * 0.35;
                for (let i = 0; i < 10; i++) this._particle(this.ship.x, this.ship.y, (Math.random()-0.5)*3, (Math.random()-0.5)*3, '#e74c3c', 30);
                this.asteroidHitCooldown = 90;
                if (this.hull <= 0) { this.gameOver('SCAFO DISTRUTTO'); return; }
                break;
            }
        }
    }

    _updateNPCs() {
        this.pilots = this.pilots.filter(pilot => {
            const targetId = pilot.state === 'pickup' ? pilot.fromId : pilot.toId;
            const target = this.allBodies.find(b => b.id === targetId);
            if (!target) return true;

            const dx = target.x - pilot.x;
            const dy = target.y - pilot.y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d > 1) pilot.angle = Math.atan2(dy, dx);

            // Steering
            if (d > target.size + 4) {
                pilot.vx += (dx / d) * pilot.speed * 0.12;
                pilot.vy += (dy / d) * pilot.speed * 0.12;
            }

            // Veteran dodges asteroids
            if (pilot.skillDodge) {
                for (const a of this.asteroids) {
                    const adx = a.x - pilot.x, ady = a.y - pilot.y;
                    const ad = Math.sqrt(adx*adx + ady*ady);
                    if (ad < 50) { pilot.vx -= (adx/ad)*0.6; pilot.vy -= (ady/ad)*0.6; }
                }
            } else {
                // Non-veteran can get hit
                for (const a of this.asteroids) {
                    const adx = a.x - pilot.x, ady = a.y - pilot.y;
                    if (Math.sqrt(adx*adx + ady*ady) < a.size + 4) {
                        pilot.hull--;
                        for (let i = 0; i < 6; i++) this._particle(pilot.x, pilot.y, (Math.random()-0.5)*2, (Math.random()-0.5)*2, '#e74c3c', 22);
                        if (pilot.hull <= 0) return false; // destroyed
                        break;
                    }
                }
            }

            pilot.x += pilot.vx; pilot.y += pilot.vy;
            pilot.vx *= 0.90;    pilot.vy *= 0.90;

            // Arrived
            if (d < target.size + 8) {
                if (pilot.state === 'pickup') {
                    pilot.cargo = target.res;
                    pilot.state = 'delivery';
                } else {
                    this.credits += 700;
                    this.score   += 700;
                    target.deliveries++;
                    if (target.crisis && target.crisis.resource === pilot.cargo) {
                        target.crisis = null;
                        this.activeCrises = this.activeCrises.filter(b => b !== target);
                        this.credits += 2000; this.score += 2000;
                    }
                    pilot.cargo  = null;
                    pilot.state  = 'pickup';
                    const others = this.allBodies.filter(b => b !== target);
                    pilot.fromId = target.id;
                    pilot.toId   = others[Math.floor(Math.random() * others.length)].id;
                }
            }
            return true;
        });
    }

    _updateCrises() {
        for (const body of this.activeCrises) {
            if (!body.crisis) continue;
            body.crisis.timer -= 1 / 60;
            if (body.crisis.timer <= 0) { this.gameOver(`${body.name} È COLLASSATA`); return; }
        }
    }

    _particle(x, y, vx, vy, color, life) {
        this.particles.push({ x, y, vx, vy, color, life, maxLife: life });
    }

    _updateParticles() {
        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    }

    // ─── Draw ───────────────────────────────────────────────────────────────

    _citySize(body) {
        const d = body.deliveries;
        if (d >= 15) return body.size + 6;
        if (d >= 7)  return body.size + 3;
        if (d >= 3)  return body.size + 1;
        return body.size;
    }

    draw() {
        const b = this.bctx;
        b.fillStyle = '#020205';
        b.fillRect(0, 0, this.buffer.width, this.buffer.height);

        b.save();
        b.translate(this.camera.x, this.camera.y);
        b.scale(this.camera.zoom, this.camera.zoom);

        // Stars
        this.stars.forEach(s => {
            b.globalAlpha = s.alpha;
            b.fillStyle = '#ffffff';
            b.fillRect(s.x, s.y, s.size, s.size);
        });
        b.globalAlpha = 1;

        // Sun — layered glow squares for pixel effect
        [
            ['rgba(255,200,50,0.04)', 7],
            ['rgba(255,215,0,0.10)',  3.5],
            ['rgba(255,215,0,0.20)',  2],
            ['#FFD700',               1],
        ].forEach(([c, m]) => {
            b.fillStyle = c;
            const s = this.sun.size * m;
            b.fillRect(-s, -s, s * 2, s * 2);
        });

        // Asteroid belt
        this.asteroids.forEach(a => {
            b.fillStyle = a.color;
            b.fillRect(a.x - a.size, a.y - a.size, a.size * 2, a.size * 2);
        });

        // Planets
        this.planets.forEach(p => this._drawBody(b, p, false));

        // Saturn rings (horizontal pixel bands)
        const sat = this.planets.find(p => p.id === 'saturno');
        if (sat) {
            const rs = sat.size;
            [
                ['rgba(241,196,15,0.12)', -4, 6],
                ['rgba(241,196,15,0.22)', -2, 2],
                ['rgba(241,196,15,0.16)',  2, 2],
                ['rgba(241,196,15,0.10)',  4, 6],
            ].forEach(([c, dy, h]) => {
                b.fillStyle = c;
                b.fillRect(sat.x - rs * 2.6, sat.y + dy, rs * 5.2, h);
            });
        }

        // Moons (smaller labels)
        this.moons.forEach(m => this._drawBody(b, m, true));

        // Particles
        this.particles.forEach(p => {
            b.globalAlpha = p.life / p.maxLife;
            b.fillStyle = p.color;
            b.fillRect(p.x, p.y, 2, 2);
        });
        b.globalAlpha = 1;

        // NPC pilots
        this.pilots.forEach(pilot => {
            b.save();
            b.translate(pilot.x, pilot.y);
            b.rotate(pilot.angle);
            b.fillStyle = pilot.color;
            b.fillRect(-2, -1, 5, 3);
            b.restore();
        });

        // Player ship
        b.save();
        b.translate(this.ship.x, this.ship.y);
        b.rotate(this.ship.angle);
        b.fillStyle = '#ffffff';
        b.fillRect(-4, -2, 8, 4);
        b.fillStyle = '#74b9ff';
        b.fillRect(1, -1, 3, 2);
        b.restore();

        // Launch overlay
        b.textAlign = 'center';
        if (this.launchState === 'COUNTDOWN') {
            b.fillStyle = '#ffffff';
            b.font = 'bold 18px monospace';
            b.fillText(Math.ceil(this.launchTimer / 60), this.ship.x, this.ship.y - 30);
        } else if (this.launchState === 'BOOST') {
            b.fillStyle = '#ff4b2b';
            b.font = 'bold 13px monospace';
            b.fillText('LANCIO!', this.ship.x, this.ship.y - 30);
        }

        b.restore();

        // Blit to screen
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.buffer, 0, 0, this.width, this.height);

        this._drawHUD();
    }

    _drawBody(b, body, isMoon) {
        const sz = this._citySize(body);

        // City glow for evolved bodies
        if (body.deliveries >= 7) {
            b.fillStyle = 'rgba(255,255,255,0.07)';
            b.fillRect(body.x - sz*2.5, body.y - sz*2.5, sz*5, sz*5);
        }
        if (body.deliveries >= 15) {
            b.fillStyle = 'rgba(255,255,255,0.05)';
            b.fillRect(body.x - sz*4, body.y - sz*4, sz*8, sz*8);
        }

        b.fillStyle = body.color;
        b.fillRect(body.x - sz, body.y - sz, sz*2, sz*2);

        // Crisis flashing border
        if (body.crisis) {
            b.strokeStyle = '#e74c3c';
            b.lineWidth = 1;
            b.strokeRect(body.x - sz - 2, body.y - sz - 2, sz*2+4, sz*2+4);
        }

        // City lights dots for metropolis
        if (body.deliveries >= 15 && !isMoon) {
            b.fillStyle = 'rgba(255,255,200,0.8)';
            for (let i = 0; i < 4; i++) {
                b.fillRect(body.x - sz + 1 + i*3, body.y - sz + 1, 1, 1);
                b.fillRect(body.x - sz + 1 + i*3, body.y + sz - 2, 1, 1);
            }
        }

        b.fillStyle = body.crisis ? '#ff6b6b' : 'rgba(255,255,255,0.85)';
        b.font = isMoon ? '5px monospace' : 'bold 7px monospace';
        b.textAlign = 'center';
        b.fillText(body.name, body.x, body.y - sz - (isMoon ? 3 : 5));
    }

    _drawHUD() {
        const c = this.ctx;
        c.fillStyle = 'rgba(2,2,5,0.75)';
        c.fillRect(0, 0, this.width, 94);

        c.textAlign = 'left';

        // Credits
        c.fillStyle = '#ffffff';
        c.font = 'bold 22px "Courier New"';
        c.fillText(`$ ${this.credits}`, 20, 34);

        // Score
        c.fillStyle = '#f1c40f';
        c.fillText(`SCORE: ${this.score}`, 210, 34);

        // Hull
        const hullColor = this.hull === 1 ? '#e74c3c' : this.hull === 2 ? '#f39c12' : '#2ecc71';
        c.fillStyle = hullColor;
        c.font = 'bold 17px "Courier New"';
        c.fillText(`SCAFO: ${'█'.repeat(this.hull)}${'░'.repeat(3-this.hull)}`, 20, 60);

        // Cargo
        c.fillStyle = '#a29bfe';
        c.font = '13px "Courier New"';
        c.fillText(`STIVA [${this.cargo.length}/${this.maxCargo}]: ${this.cargo.join(' · ') || '—'}`, 20, 82);

        // Pilots
        c.fillStyle = '#55efc4';
        c.font = '13px "Courier New"';
        c.textAlign = 'right';
        c.fillText(`PILOTI: ${this.pilots.length}   [H] ASSUMI`, this.width - 20, 34);

        // Crisis timers
        this.activeCrises.forEach((body, i) => {
            if (!body.crisis) return;
            const x   = this.width - 230;
            const y   = 50 + i * 36;
            const pct = Math.max(0, body.crisis.timer / body.crisis.maxTime);
            c.fillStyle = 'rgba(231,76,60,0.15)';
            c.fillRect(x, y, 210, 24);
            c.fillStyle = pct > 0.35 ? '#e74c3c' : '#c0392b';
            c.fillRect(x, y, 210 * pct, 24);
            c.fillStyle = '#ffffff';
            c.font = 'bold 11px "Courier New"';
            c.textAlign = 'left';
            c.fillText(`⚠ ${body.name}: ${body.crisis.resource}`, x + 5, y + 16);
        });

        // Hire menu
        if (this.showHireMenu) {
            const mw = 420, mh = 270;
            const mx = this.width/2 - mw/2, my = this.height/2 - mh/2;
            c.fillStyle = 'rgba(2,2,5,0.94)';
            c.fillRect(mx, my, mw, mh);
            c.strokeStyle = 'rgba(157,80,187,0.9)';
            c.lineWidth = 2;
            c.strokeRect(mx, my, mw, mh);
            c.textAlign = 'center';
            c.fillStyle = '#9d50bb';
            c.font = 'bold 18px "Courier New"';
            c.fillText('── ASSUMI PILOTA ──', this.width/2, my + 35);
            this.pilotRoster.forEach((p, i) => {
                const py = my + 75 + i * 65;
                const affordable = this.credits >= p.cost;
                c.fillStyle = affordable ? (i===0 ? '#74b9ff' : i===1 ? '#fd79a8' : '#55efc4') : '#555';
                c.font = `bold 15px "Courier New"`;
                c.fillText(`[${i+1}] ${p.type}  —  $ ${p.cost}`, this.width/2, py);
                c.fillStyle = '#a1a1aa';
                c.font = '12px "Courier New"';
                c.fillText(p.desc, this.width/2, py + 20);
            });
            c.fillStyle = '#555';
            c.font = '11px "Courier New"';
            c.fillText('[H] chiudi', this.width/2, my + mh - 14);
        }
    }

    // ─── Game Over ──────────────────────────────────────────────────────────

    gameOver(reason) {
        if (!this.running) return;
        this.running = false;
        clearInterval(this.crisisInterval);

        const modal = document.getElementById('game-modal');
        const h2    = modal.querySelector('h2');
        const p     = modal.querySelector('p');
        h2.textContent = 'GAME OVER';
        h2.style.color = '#e74c3c';
        if (p) p.innerHTML = `<span style="color:#aaa">${reason}</span><br>SCORE: <b style="color:#f1c40f">${this.score}</b>`;
        modal.classList.add('active');
    }

    async submitScore() {
        const nameInput = document.getElementById('player-name');
        const raw  = (nameInput.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        const name = raw.padEnd(3, '_');
        if (!raw) return;

        const btn = document.getElementById('submit-score-btn');
        btn.textContent = 'TRASMISSIONE...';
        btn.disabled = true;

        // Show transmission animation
        this._playTransmissionAnim();

        // Check local board first
        let board = [];
        try {
            const r = await fetch('leaderboard.json?_=' + Date.now());
            board = await r.json();
        } catch (_) { /* offline or first run */ }
        board.push({ name, score: this.score });
        board.sort((a, b) => b.score - a.score);
        board = board.slice(0, 10);
        const qualifies = board.some(e => e.name === name && e.score === this.score);

        if (!qualifies) {
            btn.textContent = 'NON NEL TOP 10';
            btn.disabled = false;
            return;
        }

        if (GITHUB_TOKEN) {
            try {
                const [owner, repo] = GITHUB_REPO.split('/');
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
                    method: 'POST',
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ event_type: 'submit_score', client_payload: { name, score: this.score } }),
                });
                btn.textContent = res.ok ? '✓ RECORD INVIATO!' : 'ERRORE SERVER';
            } catch (_) {
                btn.textContent = 'ERRORE CONNESSIONE';
            }
        } else {
            btn.textContent = '✓ SALVATO (LOCAL)';
        }
        btn.disabled = false;
    }

    _playTransmissionAnim() {
        const c = this.ctx;
        let f = 0;
        const tick = () => {
            if (f++ > 80) return;
            c.fillStyle = 'rgba(2,2,5,0.25)';
            c.fillRect(0, 0, this.width, this.height);
            c.fillStyle = `rgba(157,80,187,${0.3 + Math.sin(f * 0.25) * 0.25})`;
            c.font = 'bold 22px "Courier New"';
            c.textAlign = 'center';
            c.fillText('>> TRASMISSIONE DATI <<', this.width/2, this.height/2 - 20);
            c.fillStyle = '#55efc4';
            c.font = '13px "Courier New"';
            c.fillText('Connessione ai server galattici...', this.width/2, this.height/2 + 16);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ─── Secret Trigger ─────────────────────────────────────────────────────────

let _clicks = 0;
document.getElementById('secret-trigger').addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (++_clicks >= 5) {
        document.getElementById('game-container').classList.add('active');
        const game = new SpaceGame('game-canvas');
        game.start();
        _clicks = 0;
    }
});
