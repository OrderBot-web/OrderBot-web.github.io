/**
 * GALAXY WORLD - Space Economy Arcade Game v4
 * Android 14 vector style · City founding · Moons · Asteroids · Fleet
 */

const GITHUB_REPO = 'OrderBot-web/OrderBot-web.github.io';
const GITHUB_TOKEN = '';

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx    = this.canvas.getContext('2d');
        this.resize();

        // ── Android 14 floaty physics ──────────────────────────────────────
        this.G         = 0.38;
        this.friction  = 0.997;
        this.baseAccel = 0.22;
        this.mapLimit  = 2600;

        // ── State ──────────────────────────────────────────────────────────
        this.running   = false;
        this.score     = 0;
        this.credits   = 3000;
        this.cargo     = [];
        this.maxCargo  = 8;
        this.hull      = 3;
        this.asteroidHitCooldown = 0;
        this.activeCrises  = [];
        this.particles     = [];
        this.pilots        = [];
        this.showHireMenu  = false;
        this.stars         = this._genStars(260);
        // zoom in world-units → screen pixels
        this.camera = { x: 0, y: 0, zoom: 2.8 };
        this.sun    = { x: 0, y: 0, size: 32 };

        // ── City founding ──────────────────────────────────────────────────
        this.launchState   = 'CHOOSE_CITY';
        this.launchTimer   = 0;
        this.hoveredBody   = null;
        this.selectedBody  = null;
        this.homeBody      = null;
        this.foundingTimer = 0;
        this.mousePos      = { x: 0, y: 0 };

        // ── Planets ────────────────────────────────────────────────────────
        this.planets = [
            { id: 'mercurio', name: 'MERCURIO', dist: 110,  size: 6,  color: '#b2bec3', speed: 0.016,  res: 'SOLARE',       req: 'FILTRI',    deliveries: 0, crisis: null },
            { id: 'venere',   name: 'VENERE',   dist: 170,  size: 9,  color: '#e17055', speed: 0.009,  res: 'ACIDO',        req: 'CIBO',      deliveries: 0, crisis: null },
            { id: 'terra',    name: 'TERRA',    dist: 250,  size: 11, color: '#0984e3', speed: 0.005,  res: 'CIBO',         req: 'ELIO-3',    deliveries: 0, crisis: null },
            { id: 'marte',    name: 'MARTE',    dist: 390,  size: 9,  color: '#d63031', speed: 0.004,  res: 'FERRO',        req: 'ACQUA',     deliveries: 0, crisis: null },
            { id: 'giove',    name: 'GIOVE',    dist: 620,  size: 24, color: '#e67e22', speed: 0.0012, res: 'GAS',          req: 'CHIPS',     deliveries: 0, crisis: null },
            { id: 'saturno',  name: 'SATURNO',  dist: 880,  size: 20, color: '#f9ca24', speed: 0.0008, res: 'GHIACCIO',    req: 'MEDS',      deliveries: 0, crisis: null, rings: true },
            { id: 'urano',    name: 'URANO',    dist: 1130, size: 16, color: '#81ecec', speed: 0.0005, res: 'DIAMANTI',    req: 'GAS',       deliveries: 0, crisis: null },
            { id: 'nettuno',  name: 'NETTUNO',  dist: 1450, size: 16, color: '#6c5ce7', speed: 0.0003, res: 'ENERGIA',     req: 'DIAMANTI',  deliveries: 0, crisis: null },
        ];

        this.moons = [
            { id: 'luna',     name: 'LUNA',     parent: 'terra',   dist: 32, size: 5,  color: '#dfe6e9', speed: 0.030, res: 'ELIO-3',      req: 'CIBO',     deliveries: 0, crisis: null },
            { id: 'phobos',   name: 'PHOBOS',   parent: 'marte',   dist: 22, size: 3,  color: '#b2bec3', speed: 0.080, res: 'ACQUA',       req: 'FERRO',    deliveries: 0, crisis: null },
            { id: 'deimos',   name: 'DEIMOS',   parent: 'marte',   dist: 38, size: 3,  color: '#95a5a6', speed: 0.040, res: 'SILICIO',     req: 'ENERGIA',  deliveries: 0, crisis: null },
            { id: 'io',       name: 'IO',       parent: 'giove',   dist: 40, size: 5,  color: '#f9ca24', speed: 0.055, res: 'ZOLFO',      req: 'GAS',      deliveries: 0, crisis: null },
            { id: 'europa',   name: 'EUROPA',   parent: 'giove',   dist: 56, size: 5,  color: '#dfe6e9', speed: 0.035, res: 'ACQUA',      req: 'CHIPS',    deliveries: 0, crisis: null },
            { id: 'ganimede', name: 'GANIMEDE', parent: 'giove',   dist: 74, size: 6,  color: '#636e72', speed: 0.022, res: 'GHIACCIO',   req: 'MEDS',     deliveries: 0, crisis: null },
            { id: 'callisto', name: 'CALLISTO', parent: 'giove',   dist: 94, size: 5,  color: '#2d3436', speed: 0.014, res: 'MINERALI',   req: 'CIBO',     deliveries: 0, crisis: null },
            { id: 'titano',   name: 'TITANO',   parent: 'saturno', dist: 62, size: 6,  color: '#fdcb6e', speed: 0.020, res: 'IDROCARBURI',req: 'FILTRI',   deliveries: 0, crisis: null },
            { id: 'encelado', name: 'ENCELADO', parent: 'saturno', dist: 42, size: 4,  color: '#f5f6fa', speed: 0.040, res: 'ACQUA',      req: 'MINERALI', deliveries: 0, crisis: null },
            { id: 'titania',  name: 'TITANIA',  parent: 'urano',   dist: 52, size: 5,  color: '#81ecec', speed: 0.028, res: 'CRISTALLI',  req: 'ENERGIA',  deliveries: 0, crisis: null },
            { id: 'tritone',  name: 'TRITONE',  parent: 'nettuno', dist: 46, size: 5,  color: '#74b9ff', speed: 0.025, res: 'AZOTO',      req: 'DIAMANTI', deliveries: 0, crisis: null },
        ];

        this.allBodies = [...this.planets, ...this.moons];

        // Asteroid belt between Marte (390) and Giove (620)
        this.asteroids = Array.from({ length: 52 }, (_, i) => {
            const angle = (i / 52) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const dist  = 460 + Math.random() * 100;
            return { angle, dist, speed: 0.0016 + Math.random() * 0.001,
                     size: 1.5 + Math.random() * 2.5,
                     color: Math.random() > 0.5 ? '#636e72' : '#95a5a6', x: 0, y: 0 };
        });

        this.pilotRoster = [
            { type: 'ROOKIE',      cost: 800,  speed: 2.0, skillDodge: false, color: '#74b9ff', desc: 'Economico · vulnerabile agli asteroidi' },
            { type: 'SPERICOLATO', cost: 1500, speed: 3.8, skillDodge: false, color: '#fd79a8', desc: 'Velocissimo · ignora i rischi' },
            { type: 'VETERANO',    cost: 3000, speed: 2.8, skillDodge: true,  color: '#55efc4', desc: 'Costoso · evita la fascia' },
        ];

        // Init positions
        this.planets.forEach(p => { p.angle = 0; p.x = p.dist; p.y = 0; });
        this.moons.forEach(m => {
            m.angle = 0;
            const par = this.planets.find(p => p.id === m.parent);
            m.x = (par ? par.x : 0) + m.dist; m.y = par ? par.y : 0;
        });
        this.asteroids.forEach(a => { a.x = Math.cos(a.angle) * a.dist; a.y = Math.sin(a.angle) * a.dist; });

        const terra = this.planets.find(p => p.id === 'terra');
        this.ship = { x: terra.x, y: terra.y, vx: 0, vy: 0, angle: -Math.PI / 2 };

        // Start in overview
        this.camera.zoom = 0.44;
        this.camera.x    = this.width  / 2;
        this.camera.y    = this.height / 2;

        this.init();
    }

    // ── Setup ────────────────────────────────────────────────────────────────

    _genStars(n) {
        return Array.from({ length: n }, () => ({
            x: (Math.random() - 0.5) * 3600,
            y: (Math.random() - 0.5) * 3600,
            r: Math.random() > 0.85 ? 1.2 : 0.6,
            alpha: 0.2 + Math.random() * 0.8
        }));
    }

    resize() {
        this.width  = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width  = this.width;
        this.canvas.height = this.height;
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if ((e.code === 'Enter' || e.code === 'Space') && this.launchState === 'CHOOSE_CITY' && this.selectedBody) {
                this._foundCity(this.selectedBody);
            }
            if (e.code === 'KeyH' && this.launchState === 'PLAY') this.showHireMenu = !this.showHireMenu;
            if (this.showHireMenu) {
                if (e.code === 'Digit1') this.hireNPC(0);
                if (e.code === 'Digit2') this.hireNPC(1);
                if (e.code === 'Digit3') this.hireNPC(2);
            }
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        this.canvas.addEventListener('mousemove', e => {
            this.mousePos = { x: e.clientX, y: e.clientY };
            if (this.launchState === 'CHOOSE_CITY') this.hoveredBody = this._bodyAtScreen(e.clientX, e.clientY);
        });
        this.canvas.addEventListener('click', e => {
            if (this.launchState !== 'CHOOSE_CITY') return;
            const b = this._bodyAtScreen(e.clientX, e.clientY);
            if (b && b.id !== 'terra') {
                if (this.selectedBody === b) this._foundCity(b);
                else this.selectedBody = b;
            }
        });
        this.canvas.addEventListener('touchstart', e => { this.isTouching = true; this.handleTouch(e); }, { passive: false });
        this.canvas.addEventListener('touchmove',  e => { this.handleTouch(e); },                         { passive: false });
        this.canvas.addEventListener('touchend',   e => {
            this.isTouching = false;
            if (this.launchState === 'CHOOSE_CITY' && e.changedTouches[0]) {
                const t = e.changedTouches[0];
                const b = this._bodyAtScreen(t.clientX, t.clientY);
                if (b && b.id !== 'terra') {
                    if (this.selectedBody === b) this._foundCity(b); else this.selectedBody = b;
                }
            }
        });

        this.crisisInterval = setInterval(() => { if (this.running && this.launchState === 'PLAY') this.spawnCrisis(); }, 13000);
        document.getElementById('submit-score-btn').addEventListener('click', () => this.submitScore());
    }

    handleTouch(e) {
        e.preventDefault();
        const t = e.touches[0];
        this.touchPos = { x: t.clientX, y: t.clientY };
    }

    // ── Coordinate helpers ───────────────────────────────────────────────────

    _worldFromScreen(sx, sy) {
        return {
            x: (sx - this.camera.x) / this.camera.zoom,
            y: (sy - this.camera.y) / this.camera.zoom,
        };
    }

    _bodyAtScreen(sx, sy) {
        const { x: wx, y: wy } = this._worldFromScreen(sx, sy);
        // Generous hit radius that adjusts with zoom so small planets are still clickable
        return this.allBodies.find(b => {
            const d = Math.sqrt((b.x - wx) ** 2 + (b.y - wy) ** 2);
            return d < Math.max(b.size * 3.5, 30 / this.camera.zoom);
        }) || null;
    }

    // ── City Founding ────────────────────────────────────────────────────────

    _foundCity(body) {
        body.deliveries = 3;
        body.isHome     = true;
        this.homeBody   = body;
        const bonus = Math.floor(body.dist * 2.5);
        this.credits += bonus; this.score += bonus;
        this.launchState   = 'FOUNDING';
        this.foundingTimer = 110;
        for (let i = 0; i < 55; i++) {
            const a = Math.random() * Math.PI * 2, spd = 0.5 + Math.random() * 2.5;
            this._particle(body.x, body.y, Math.cos(a)*spd, Math.sin(a)*spd,
                ['#f9ca24','#55efc4','#a29bfe','#ffffff','#fd79a8'][Math.floor(Math.random()*5)],
                70 + Math.random() * 50);
        }
    }

    // ── Fleet ────────────────────────────────────────────────────────────────

    hireNPC(idx) {
        const def = this.pilotRoster[idx];
        if (!def || this.credits < def.cost) return;
        const pool = this.allBodies.filter(b => b.x !== undefined);
        const from = pool[Math.floor(Math.random() * pool.length)];
        const to   = pool.filter(b => b !== from)[Math.floor(Math.random() * (pool.length - 1))];
        this.credits -= def.cost;
        this.pilots.push({ ...def, x: from.x, y: from.y, vx: 0, vy: 0, angle: 0, hull: 2,
                           state: 'pickup', cargo: null, fromId: from.id, toId: to.id });
        this.showHireMenu = false;
    }

    // ── Economy ──────────────────────────────────────────────────────────────

    spawnCrisis() {
        const cands = this.allBodies.filter(b => !b.crisis);
        if (!cands.length) return;
        const body = cands[Math.floor(Math.random() * cands.length)];
        body.crisis = { resource: body.req, timer: 55, maxTime: 55 };
        this.activeCrises.push(body);
    }

    dock(body) {
        const idx = this.cargo.indexOf(body.req);
        if (idx !== -1) {
            this.cargo.splice(idx, 1);
            let reward = 1200;
            if (body.crisis) {
                body.crisis = null;
                this.activeCrises = this.activeCrises.filter(b => b !== body);
                reward += 4000; this.score += 4000;
            }
            this.credits += reward; this.score += reward;
            body.deliveries++;
            for (let i = 0; i < 8; i++) {
                const a = Math.random() * Math.PI * 2;
                this._particle(body.x, body.y, Math.cos(a)*1.2, Math.sin(a)*1.2, '#f9ca24', 28);
            }
        } else if (this.cargo.length < this.maxCargo && this.credits >= 100 && body.res) {
            this.cargo.push(body.res); this.credits -= 100;
        }
        this.ship.vx *= -0.15; this.ship.vy *= -0.15;
    }

    // ── Update ───────────────────────────────────────────────────────────────

    start() { this.running = true; this.loop(); }

    update() {
        if (!this.running) return;
        this._updateBodies();

        if (this.launchState === 'CHOOSE_CITY') {
            this.camera.zoom = 0.44;
            this.camera.x    = this.width  / 2;
            this.camera.y    = this.height / 2;
            return;
        }
        if (this.launchState === 'FOUNDING') {
            this.foundingTimer--;
            if (this.homeBody) {
                this.camera.zoom = 2.4;
                this.camera.x = -this.homeBody.x * this.camera.zoom + this.width  / 2;
                this.camera.y = -this.homeBody.y * this.camera.zoom + this.height / 2;
            }
            if (this.foundingTimer <= 0) {
                this.launchState  = 'COUNTDOWN';
                this.launchTimer  = 180;
                this.camera.zoom  = 2.8;
            }
            this._updateParticles();
            return;
        }

        this._updateShip();
        if (this.launchState === 'PLAY') { this._updateNPCs(); this._updateCrises(); }
        this._updateParticles();
        this.camera.x = -this.ship.x * this.camera.zoom + this.width  / 2;
        this.camera.y = -this.ship.y * this.camera.zoom + this.height / 2;
    }

    _updateBodies() {
        this.planets.forEach(p => {
            p.angle = (p.angle || 0) + p.speed;
            p.x = Math.cos(p.angle) * p.dist; p.y = Math.sin(p.angle) * p.dist;
        });
        this.moons.forEach(m => {
            m.angle = (m.angle || 0) + m.speed;
            const par = this.planets.find(p => p.id === m.parent);
            if (par) { m.x = par.x + Math.cos(m.angle) * m.dist; m.y = par.y + Math.sin(m.angle) * m.dist; }
        });
        this.asteroids.forEach(a => { a.angle += a.speed; a.x = Math.cos(a.angle)*a.dist; a.y = Math.sin(a.angle)*a.dist; });
    }

    _updateShip() {
        if (this.launchState === 'COUNTDOWN') {
            this.launchTimer--;
            const t = this.planets.find(p => p.id === 'terra');
            this.ship.x = t.x; this.ship.y = t.y;
            if (this.launchTimer <= 0) { this.launchState = 'BOOST'; this.launchTimer = 70; }
            return;
        }
        if (this.launchState === 'BOOST') {
            this.launchTimer--;
            this.ship.vy = -1.5; this.ship.angle = -Math.PI / 2;
            if (Math.random() > 0.4) this._particle(this.ship.x, this.ship.y, (Math.random()-0.5)*0.4, 1.5, '#e17055', 28);
            if (this.launchTimer <= 0) this.launchState = 'PLAY';
            return;
        }

        // PLAY — Android 14 floaty flight
        this.ship.mass  = 1 + this.cargo.length * 0.3;
        const accel     = this.baseAccel / this.ship.mass;
        const thrusting = this.keys['ArrowUp'] || this.keys['KeyW'];

        if (thrusting) {
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
            this._particle(this.ship.x, this.ship.y,
                -Math.cos(this.ship.angle)*0.5 + (Math.random()-0.5)*0.3,
                -Math.sin(this.ship.angle)*0.5 + (Math.random()-0.5)*0.3,
                '#e17055', 16);
        }
        if (this.keys['ArrowLeft']  || this.keys['KeyA']) this.ship.angle -= 0.065;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.ship.angle += 0.065;

        if (this.isTouching && this.touchPos) {
            const wx = (this.touchPos.x - this.camera.x) / this.camera.zoom;
            const wy = (this.touchPos.y - this.camera.y) / this.camera.zoom;
            let diff = Math.atan2(wy - this.ship.y, wx - this.ship.x) - this.ship.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            this.ship.angle += diff * 0.12;
            this.ship.vx += Math.cos(this.ship.angle) * accel;
            this.ship.vy += Math.sin(this.ship.angle) * accel;
        }

        const dSun = Math.sqrt(this.ship.x**2 + this.ship.y**2);
        if (dSun < this.sun.size + 4) { this.gameOver('BRUCIATO DAL SOLE'); return; }
        const force = this.G * 300 / (dSun**2);
        this.ship.vx -= (this.ship.x/dSun)*force; this.ship.vy -= (this.ship.y/dSun)*force;
        if (dSun > this.mapLimit) { this.ship.vx -= (this.ship.x/dSun)*2; this.ship.vy -= (this.ship.y/dSun)*2; }
        this.ship.x += this.ship.vx; this.ship.y += this.ship.vy;
        this.ship.vx *= this.friction; this.ship.vy *= this.friction;

        for (const b of this.allBodies) {
            const d = Math.sqrt((b.x-this.ship.x)**2 + (b.y-this.ship.y)**2);
            if (d < b.size + 8) { this.dock(b); break; }
        }
        if (this.asteroidHitCooldown > 0) { this.asteroidHitCooldown--; return; }
        for (const a of this.asteroids) {
            const d = Math.sqrt((a.x-this.ship.x)**2 + (a.y-this.ship.y)**2);
            if (d < a.size + 5) {
                this.hull--;
                if (this.cargo.length > 0) this.cargo.pop();
                this.ship.vx = (this.ship.x-a.x)*0.35; this.ship.vy = (this.ship.y-a.y)*0.35;
                for (let i = 0; i < 12; i++) this._particle(this.ship.x, this.ship.y, (Math.random()-0.5)*3, (Math.random()-0.5)*3, '#d63031', 32);
                this.asteroidHitCooldown = 90;
                if (this.hull <= 0) { this.gameOver('SCAFO DISTRUTTO'); return; }
                break;
            }
        }
    }

    _updateNPCs() {
        this.pilots = this.pilots.filter(pilot => {
            const tid    = pilot.state === 'pickup' ? pilot.fromId : pilot.toId;
            const target = this.allBodies.find(b => b.id === tid);
            if (!target) return true;
            const dx = target.x-pilot.x, dy = target.y-pilot.y;
            const d  = Math.sqrt(dx*dx+dy*dy);
            if (d > 1) pilot.angle = Math.atan2(dy,dx);
            if (d > target.size+4) { pilot.vx += (dx/d)*pilot.speed*0.12; pilot.vy += (dy/d)*pilot.speed*0.12; }
            if (pilot.skillDodge) {
                for (const a of this.asteroids) {
                    const adx=a.x-pilot.x, ady=a.y-pilot.y, ad=Math.sqrt(adx*adx+ady*ady);
                    if (ad < 50) { pilot.vx -= (adx/ad)*0.6; pilot.vy -= (ady/ad)*0.6; }
                }
            } else {
                for (const a of this.asteroids) {
                    const adx=a.x-pilot.x, ady=a.y-pilot.y;
                    if (Math.sqrt(adx*adx+ady*ady) < a.size+5) {
                        pilot.hull--;
                        for (let i = 0; i < 6; i++) this._particle(pilot.x, pilot.y, (Math.random()-0.5)*2, (Math.random()-0.5)*2, '#d63031', 20);
                        if (pilot.hull <= 0) return false;
                        break;
                    }
                }
            }
            pilot.x += pilot.vx; pilot.y += pilot.vy;
            pilot.vx *= 0.90; pilot.vy *= 0.90;
            if (d < target.size+8) {
                if (pilot.state === 'pickup') { pilot.cargo = target.res; pilot.state = 'delivery'; }
                else {
                    this.credits += 700; this.score += 700; target.deliveries++;
                    if (target.crisis && target.crisis.resource === pilot.cargo) {
                        target.crisis = null; this.activeCrises = this.activeCrises.filter(b=>b!==target);
                        this.credits += 2000; this.score += 2000;
                    }
                    pilot.cargo = null; pilot.state = 'pickup';
                    const others = this.allBodies.filter(b=>b!==target);
                    pilot.fromId = target.id; pilot.toId = others[Math.floor(Math.random()*others.length)].id;
                }
            }
            return true;
        });
    }

    _updateCrises() {
        for (const body of this.activeCrises) {
            if (!body.crisis) continue;
            body.crisis.timer -= 1/60;
            if (body.crisis.timer <= 0) { this.gameOver(`${body.name} È COLLASSATA`); return; }
        }
    }

    _particle(x, y, vx, vy, color, life) {
        this.particles.push({ x, y, vx, vy, color, life, maxLife: life });
    }

    _updateParticles() {
        this.particles = this.particles.filter(p => { p.x+=p.vx; p.y+=p.vy; p.life--; return p.life>0; });
    }

    // ── Draw ─────────────────────────────────────────────────────────────────

    _citySize(body) {
        const d = body.deliveries;
        if (d >= 15) return body.size + 7;
        if (d >= 7)  return body.size + 3.5;
        if (d >= 3)  return body.size + 1.5;
        return body.size;
    }

    draw() {
        const c = this.ctx;
        // Deep space background
        c.fillStyle = '#06070f';
        c.fillRect(0, 0, this.width, this.height);

        c.save();
        c.translate(this.camera.x, this.camera.y);
        c.scale(this.camera.zoom, this.camera.zoom);

        // Stars
        this.stars.forEach(s => {
            c.globalAlpha = s.alpha;
            c.fillStyle = '#ffffff';
            c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI*2); c.fill();
        });
        c.globalAlpha = 1;

        // Orbit rings (always visible, more prominent during CHOOSE_CITY)
        const orbitAlpha = this.launchState === 'CHOOSE_CITY' ? 0.12 : 0.04;
        this.planets.forEach(p => {
            c.strokeStyle = `rgba(255,255,255,${orbitAlpha})`;
            c.lineWidth = 0.5;
            c.beginPath(); c.arc(0, 0, p.dist, 0, Math.PI*2); c.stroke();
        });

        // Sun — radial gradient
        const sunGrad = c.createRadialGradient(0, 0, 0, 0, 0, this.sun.size * 6);
        sunGrad.addColorStop(0,    'rgba(255,255,220,1)');
        sunGrad.addColorStop(0.15, 'rgba(255,215, 0, 1)');
        sunGrad.addColorStop(0.45, 'rgba(255,160, 0, 0.5)');
        sunGrad.addColorStop(1,    'rgba(255,100, 0, 0)');
        c.beginPath(); c.arc(0, 0, this.sun.size*6, 0, Math.PI*2);
        c.fillStyle = sunGrad; c.fill();
        // Hard center
        c.beginPath(); c.arc(0, 0, this.sun.size, 0, Math.PI*2);
        c.fillStyle = '#fffde7'; c.fill();

        // Asteroid belt
        this.asteroids.forEach(a => {
            c.globalAlpha = 0.7;
            c.fillStyle = a.color;
            c.beginPath(); c.arc(a.x, a.y, a.size, 0, Math.PI*2); c.fill();
        });
        c.globalAlpha = 1;

        // Planets
        this.planets.forEach(p => this._drawBody(c, p, false));

        // Saturn rings — smooth ellipse
        const sat = this.planets.find(p => p.id === 'saturno');
        if (sat) {
            const sz = this._citySize(sat);
            c.save(); c.translate(sat.x, sat.y);
            [[sz*2.6, 0.28, 'rgba(249,202,36,0.35)'], [sz*3.1, 0.22, 'rgba(249,202,36,0.20)'], [sz*3.6, 0.18, 'rgba(249,202,36,0.12)']].forEach(([r,b,col]) => {
                c.strokeStyle = col; c.lineWidth = sz*0.38;
                c.beginPath(); c.ellipse(0, 0, r, r*b, 0.12, 0, Math.PI*2); c.stroke();
            });
            c.restore();
        }

        // Moons
        this.moons.forEach(m => this._drawBody(c, m, true));

        // Hover / selected highlight (CHOOSE_CITY)
        if (this.launchState === 'CHOOSE_CITY') {
            if (this.hoveredBody && this.hoveredBody.id !== 'terra') {
                const h = this.hoveredBody, sz = this._citySize(h);
                c.strokeStyle = 'rgba(255,255,255,0.55)';
                c.lineWidth = 1.5;
                c.setLineDash([4, 4]);
                c.beginPath(); c.arc(h.x, h.y, sz*2.2, 0, Math.PI*2); c.stroke();
                c.setLineDash([]);
            }
            if (this.selectedBody) {
                const s = this.selectedBody, sz = this._citySize(s);
                const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
                // Outer glow
                const sg = c.createRadialGradient(s.x, s.y, sz, s.x, s.y, sz*4.5);
                sg.addColorStop(0, `rgba(249,202,36,${0.22*pulse})`);
                sg.addColorStop(1, 'rgba(249,202,36,0)');
                c.beginPath(); c.arc(s.x, s.y, sz*4.5, 0, Math.PI*2);
                c.fillStyle = sg; c.fill();
                // Ring
                c.strokeStyle = `rgba(249,202,36,${0.7+0.3*pulse})`;
                c.lineWidth = 2;
                c.beginPath(); c.arc(s.x, s.y, sz*2.2, 0, Math.PI*2); c.stroke();
            }
        }

        // Founding glow
        if (this.launchState === 'FOUNDING' && this.homeBody) {
            const h  = this.homeBody, sz = this._citySize(h);
            const pct = this.foundingTimer / 110;
            const fg = c.createRadialGradient(h.x, h.y, sz, h.x, h.y, sz*7*pct);
            fg.addColorStop(0, `rgba(249,202,36,${0.25*pct})`);
            fg.addColorStop(1, 'rgba(249,202,36,0)');
            c.beginPath(); c.arc(h.x, h.y, sz*7, 0, Math.PI*2);
            c.fillStyle = fg; c.fill();
        }

        // Particles
        this.particles.forEach(p => {
            c.globalAlpha = (p.life / p.maxLife) * 0.9;
            c.fillStyle = p.color;
            c.beginPath(); c.arc(p.x, p.y, 1.2, 0, Math.PI*2); c.fill();
        });
        c.globalAlpha = 1;

        // NPC pilots — small colored triangles
        this.pilots.forEach(pilot => {
            c.save(); c.translate(pilot.x, pilot.y); c.rotate(pilot.angle);
            c.fillStyle = pilot.color;
            c.beginPath(); c.moveTo(5,0); c.lineTo(-3,-3); c.lineTo(-3,3); c.closePath(); c.fill();
            c.restore();
        });

        // Player ship — clean angular triangle (hidden during CHOOSE_CITY)
        if (this.launchState !== 'CHOOSE_CITY') {
            c.save(); c.translate(this.ship.x, this.ship.y); c.rotate(this.ship.angle);
            // Body
            c.fillStyle = '#ffffff';
            c.beginPath(); c.moveTo(10,0); c.lineTo(-6,-5); c.lineTo(-4,0); c.lineTo(-6,5); c.closePath(); c.fill();
            // Cockpit window
            c.fillStyle = '#74b9ff';
            c.beginPath(); c.arc(3, 0, 2.5, 0, Math.PI*2); c.fill();
            c.restore();
        }

        // Launch text (world-space so it sticks to ship)
        if (this.launchState === 'COUNTDOWN') {
            c.fillStyle = 'rgba(255,255,255,0.9)';
            c.font = 'bold 14px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText(Math.ceil(this.launchTimer/60), this.ship.x, this.ship.y - 22);
        } else if (this.launchState === 'BOOST') {
            c.fillStyle = '#e17055';
            c.font = 'bold 11px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText('LANCIO!', this.ship.x, this.ship.y - 22);
        }

        c.restore(); // end world transform

        // Overlay HUDs (screen space)
        if      (this.launchState === 'CHOOSE_CITY') this._drawChooseCityHUD();
        else if (this.launchState === 'FOUNDING')    this._drawFoundingHUD();
        else                                          this._drawHUD();
    }

    _drawBody(c, body, isMoon) {
        const sz = this._citySize(body);

        // City growth glow
        if (body.deliveries >= 3) {
            const glow = c.createRadialGradient(body.x, body.y, sz*0.5, body.x, body.y, sz * (body.deliveries >= 15 ? 5 : body.deliveries >= 7 ? 3.5 : 2.2));
            glow.addColorStop(0, body.color.replace(')', ',0.25)').replace('rgb', 'rgba') || `rgba(255,255,255,0.12)`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            c.beginPath(); c.arc(body.x, body.y, sz * (body.deliveries >= 15 ? 5 : 3), 0, Math.PI*2);
            c.globalAlpha = 0.6; c.fillStyle = glow; c.fill(); c.globalAlpha = 1;
        }

        // Home city beacon ring
        if (body.isHome) {
            const pulse = 0.5 + 0.5*Math.sin(Date.now()*0.004);
            c.strokeStyle = `rgba(249,202,36,${0.5+0.4*pulse})`;
            c.lineWidth = 1.5;
            c.beginPath(); c.arc(body.x, body.y, sz*2, 0, Math.PI*2); c.stroke();
        }

        // Planet fill with sphere highlight
        c.beginPath(); c.arc(body.x, body.y, sz, 0, Math.PI*2);
        c.fillStyle = body.color; c.fill();
        // Highlight
        c.beginPath(); c.arc(body.x - sz*0.28, body.y - sz*0.28, sz*0.45, 0, Math.PI*2);
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill();

        // Crisis ring — pulsing red
        if (body.crisis) {
            const pulse = 0.5 + 0.5*Math.sin(Date.now()*0.01);
            c.strokeStyle = `rgba(214,48,49,${0.6+0.4*pulse})`;
            c.lineWidth = 2;
            c.beginPath(); c.arc(body.x, body.y, sz*1.6, 0, Math.PI*2); c.stroke();
        }

        // City lights dots for metropolis (small bright specks around equator)
        if (body.deliveries >= 15) {
            for (let i = 0; i < 8; i++) {
                const a = (i/8)*Math.PI*2;
                c.fillStyle = 'rgba(255,255,200,0.7)';
                c.beginPath(); c.arc(body.x + Math.cos(a)*(sz+1.5), body.y + Math.sin(a)*(sz+1.5), 0.8, 0, Math.PI*2); c.fill();
            }
        }

        // Label
        const lbl = (this.launchState === 'CHOOSE_CITY' && body.id === 'terra') ? 'PARTENZA' : body.name;
        c.fillStyle = body.id === 'terra' && this.launchState === 'CHOOSE_CITY' ? '#74b9ff'
                    : body.crisis ? '#ff7675' : 'rgba(255,255,255,0.82)';
        c.font = isMoon ? '9px "Inter",sans-serif' : 'bold 11px "Inter",sans-serif';
        c.textAlign = 'center';
        c.fillText(lbl, body.x, body.y - sz - (isMoon ? 4 : 7));

        // Resource hint (only during CHOOSE_CITY)
        if (this.launchState === 'CHOOSE_CITY' && !isMoon) {
            c.fillStyle = 'rgba(255,255,255,0.45)';
            c.font = '8px "Inter",sans-serif';
            c.fillText(`${body.res} · ${body.req}`, body.x, body.y + sz + 12);
        }
    }

    _drawChooseCityHUD() {
        const c = this.ctx;
        // Top banner
        const bh = 115;
        c.fillStyle = 'rgba(6,7,15,0.88)';
        c.fillRect(0, 0, this.width, bh);
        // Separator line
        c.strokeStyle = 'rgba(249,202,36,0.3)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, bh); c.lineTo(this.width, bh); c.stroke();

        c.textAlign = 'center';
        c.fillStyle = '#f9ca24';
        c.font = 'bold 28px "Inter",sans-serif';
        c.fillText('DOVE FONDERAI LA TUA PRIMA CITTÀ?', this.width/2, 44);
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.font = '14px "Inter",sans-serif';
        c.fillText('Clicca un pianeta o luna  ·  doppio click o ENTER per confermare', this.width/2, 72);
        c.fillStyle = '#0984e3';
        c.font = '12px "Inter",sans-serif';
        c.fillText('La Terra è il tuo punto di partenza e non può essere fondata', this.width/2, 98);

        if (!this.selectedBody) return;

        // Bottom info card
        const s  = this.selectedBody;
        const bonus = Math.floor(s.dist * 2.5);
        const cw = 460, ch = 112, cx = this.width/2 - cw/2, cy = this.height - ch - 24;
        c.fillStyle = 'rgba(6,7,15,0.92)';
        c.fillRect(cx, cy, cw, ch);
        c.strokeStyle = '#f9ca24'; c.lineWidth = 1.5;
        c.strokeRect(cx, cy, cw, ch);

        c.fillStyle = s.color || '#fff';
        c.font = 'bold 22px "Inter",sans-serif';
        c.fillText(s.name, this.width/2, cy + 34);

        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.font = '13px "Inter",sans-serif';
        c.fillText(`Produce: ${s.res}   ·   Richiede: ${s.req}`, this.width/2, cy + 60);

        c.fillStyle = '#55efc4';
        c.font = 'bold 14px "Inter",sans-serif';
        c.fillText(`Bonus di fondazione: +$ ${bonus}   ·   [ ENTER / doppio click ]`, this.width/2, cy + 88);
    }

    _drawFoundingHUD() {
        const c   = this.ctx;
        const pct = 1 - this.foundingTimer / 110;
        c.fillStyle = 'rgba(6,7,15,0.72)';
        c.fillRect(0, 0, this.width, 85);
        c.textAlign = 'center';
        const pulse = 0.5 + 0.5*Math.sin(Date.now()*0.01);
        c.fillStyle = `rgba(249,202,36,${0.75+0.25*pulse})`;
        c.font = 'bold 30px "Inter",sans-serif';
        c.fillText(`★  COLONIA FONDATA: ${this.homeBody ? this.homeBody.name : ''}  ★`, this.width/2, 50);
        // Progress bar
        c.fillStyle = 'rgba(255,255,255,0.1)';
        c.fillRect(this.width/2-160, 63, 320, 8);
        c.fillStyle = '#f9ca24';
        c.fillRect(this.width/2-160, 63, 320*pct, 8);
    }

    _drawHUD() {
        const c = this.ctx;
        // Top bar with blur-like gradient
        c.fillStyle = 'rgba(6,7,15,0.82)';
        c.fillRect(0, 0, this.width, 98);
        c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0,98); c.lineTo(this.width,98); c.stroke();
        c.textAlign = 'left';

        // Credits
        c.fillStyle = '#ffffff'; c.font = 'bold 22px "Inter",sans-serif';
        c.fillText(`$ ${this.credits}`, 22, 36);
        c.fillStyle = '#f9ca24';
        c.fillText(`SCORE: ${this.score}`, 220, 36);

        // Hull
        const hc = this.hull===1 ? '#d63031' : this.hull===2 ? '#e67e22' : '#00b894';
        c.fillStyle = hc; c.font = 'bold 16px "Inter",sans-serif';
        c.fillText(`SCAFO  ${'█'.repeat(this.hull)}${'░'.repeat(3-this.hull)}`, 22, 62);

        // Cargo
        c.fillStyle = '#a29bfe'; c.font = '13px "Inter",sans-serif';
        c.fillText(`STIVA [${this.cargo.length}/${this.maxCargo}]:  ${this.cargo.join('  ·  ') || '—'}`, 22, 84);

        // Right side
        c.textAlign = 'right';
        c.fillStyle = '#55efc4'; c.font = '13px "Inter",sans-serif';
        c.fillText(`PILOTI: ${this.pilots.length}   [H] ASSUMI`, this.width-22, 36);
        if (this.homeBody) { c.fillStyle = '#f9ca24'; c.font = '12px "Inter",sans-serif'; c.fillText(`⬡ ${this.homeBody.name}`, this.width-22, 58); }

        // Crisis bars
        this.activeCrises.forEach((body, i) => {
            if (!body.crisis) return;
            const x=this.width-235, y=64+i*38;
            const pct=Math.max(0, body.crisis.timer/body.crisis.maxTime);
            c.fillStyle='rgba(214,48,49,0.15)'; c.fillRect(x,y,215,26);
            c.fillStyle=pct>0.35?'#d63031':'#c0392b'; c.fillRect(x,y,215*pct,26);
            c.fillStyle='#fff'; c.font='bold 11px "Inter",sans-serif'; c.textAlign='left';
            c.fillText(`⚠  ${body.name}: ${body.crisis.resource}`, x+6, y+17);
        });

        // Hire menu
        if (this.showHireMenu) {
            const mw=440, mh=282, mx=this.width/2-mw/2, my=this.height/2-mh/2;
            c.fillStyle='rgba(6,7,15,0.96)'; c.fillRect(mx,my,mw,mh);
            c.strokeStyle='rgba(157,80,187,0.9)'; c.lineWidth=1.5; c.strokeRect(mx,my,mw,mh);
            c.textAlign='center'; c.fillStyle='#a29bfe'; c.font='bold 18px "Inter",sans-serif';
            c.fillText('── ASSUMI PILOTA ──', this.width/2, my+38);
            this.pilotRoster.forEach((p,i) => {
                const py=my+78+i*66;
                const ok=this.credits>=p.cost;
                c.fillStyle=ok?(i===0?'#74b9ff':i===1?'#fd79a8':'#55efc4'):'#555';
                c.font='bold 15px "Inter",sans-serif';
                c.fillText(`[${i+1}]  ${p.type}  —  $ ${p.cost}`, this.width/2, py);
                c.fillStyle='rgba(255,255,255,0.42)'; c.font='12px "Inter",sans-serif';
                c.fillText(p.desc, this.width/2, py+22);
            });
            c.fillStyle='rgba(255,255,255,0.25)'; c.font='11px "Inter",sans-serif';
            c.fillText('[H] chiudi', this.width/2, my+mh-16);
        }
    }

    // ── Game Over ────────────────────────────────────────────────────────────

    gameOver(reason) {
        if (!this.running) return;
        this.running = false;
        clearInterval(this.crisisInterval);
        const modal=document.getElementById('game-modal');
        const h2=modal.querySelector('h2'), p=modal.querySelector('p');
        h2.textContent='GAME OVER'; h2.style.color='#d63031';
        if (p) p.innerHTML=`<span style="color:#a1a1aa">${reason}</span><br>SCORE: <b style="color:#f9ca24">${this.score}</b>`;
        modal.classList.add('active');
    }

    async submitScore() {
        const raw=(document.getElementById('player-name').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
        const name=raw.padEnd(3,'_');
        if (!raw) return;
        const btn=document.getElementById('submit-score-btn');
        btn.textContent='TRASMISSIONE...'; btn.disabled=true;
        this._playTransmissionAnim();
        let board=[];
        try { const r=await fetch('leaderboard.json?_='+Date.now()); board=await r.json(); } catch(_){}
        board.push({name,score:this.score}); board.sort((a,b)=>b.score-a.score); board=board.slice(0,10);
        if (!board.some(e=>e.name===name&&e.score===this.score)) { btn.textContent='NON NEL TOP 10'; btn.disabled=false; return; }
        if (GITHUB_TOKEN) {
            try {
                const [owner,repo]=GITHUB_REPO.split('/');
                const res=await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`,{
                    method:'POST',
                    headers:{Authorization:`token ${GITHUB_TOKEN}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},
                    body:JSON.stringify({event_type:'submit_score',client_payload:{name,score:this.score}}),
                });
                btn.textContent=res.ok?'✓ RECORD INVIATO!':'ERRORE SERVER';
            } catch(_){ btn.textContent='ERRORE CONNESSIONE'; }
        } else { btn.textContent='✓ SALVATO (LOCAL)'; }
        btn.disabled=false;
    }

    _playTransmissionAnim() {
        const c=this.ctx; let f=0;
        const tick=()=>{
            if (f++>80) return;
            c.fillStyle='rgba(6,7,15,0.25)'; c.fillRect(0,0,this.width,this.height);
            c.fillStyle=`rgba(162,155,254,${0.3+Math.sin(f*0.25)*0.25})`;
            c.font='bold 22px "Inter",sans-serif'; c.textAlign='center';
            c.fillText('>> TRASMISSIONE DATI <<',this.width/2,this.height/2-20);
            c.fillStyle='#55efc4'; c.font='13px "Inter",sans-serif';
            c.fillText('Connessione ai server galattici...',this.width/2,this.height/2+16);
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    loop() {
        if (!this.running) return;
        this.update(); this.draw();
        requestAnimationFrame(()=>this.loop());
    }
}

// ── Secret Trigger ────────────────────────────────────────────────────────────

let _clicks = 0;
document.getElementById('secret-trigger').addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (++_clicks >= 5) {
        document.getElementById('game-container').classList.add('active');
        new SpaceGame('game-canvas').start();
        _clicks = 0;
    }
});
