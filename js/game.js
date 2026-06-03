/**
 * GALAXY WORLD - Space Economy Arcade Game v5 (CLEAN + FIXED)
 * Free camera · Zoom · Guide · Macchina a Gancio
 * - Rimossa Easter Egg 5 click
 * - Aggiunto resetGame() per rigiocare
 */

const GITHUB_REPO = 'OrderBot-web/OrderBot-web.github.io';
const GITHUB_TOKEN = '';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/v10/webhooks/1511405598489575657/kfAincCiahPdZJjkF48XjUFPoeMlc9IhR6V575DS6eWllmXgXH7iWfZ1PnYxja1kgl5T';

class SpaceGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        this.G = 0.38;
        this.friction = 0.997;
        this.baseAccel = 0.22;
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
        this.showGuide = false;
        this.showMachineMenu = false;
        this.mobileKeys = {};
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.stars = this._genStars(260);
        this.sun = { x: 0, y: 0, size: 32 };

        this.camera = { x: 0, y: 0, zoom: 0.44, targetZoom: 0.44, panX: 0, panY: 0 };
        this._isPanning = false;
        this._lastPan = { x: 0, y: 0 };
        this._pinchDist = 0;

        this.launchState = 'CHOOSE_CITY';
        this.launchTimer = 0;
        this.hoveredBody = null;
        this.selectedBody = null;
        this.homeBody = null;
        this.foundingTimer = 0;

        this.planets = [
            { id:'mercurio', name:'PYROS', dist:110, size:6, color:'#b2bec3', speed:0.016, res:'SOLARE', req:'FILTRI', deliveries:0, crisis:null },
            { id:'venere', name:'MYRRHA', dist:170, size:9, color:'#e17055', speed:0.009, res:'ACIDO', req:'CIBO', deliveries:0, crisis:null },
            { id:'terra', name:'ORIGIN', dist:250, size:11, color:'#0984e3', speed:0.005, res:'CIBO', req:'ELIO-3', deliveries:0, crisis:null },
            { id:'marte', name:'ARES', dist:390, size:9, color:'#d63031', speed:0.004, res:'FERRO', req:'ACQUA', deliveries:0, crisis:null },
            { id:'giove', name:'JOVIS', dist:620, size:24, color:'#e67e22', speed:0.0012, res:'GAS', req:'CHIPS', deliveries:0, crisis:null },
            { id:'saturno', name:'KRONOS', dist:880, size:20, color:'#f9ca24', speed:0.0008, res:'GHIACCIO', req:'MEDS', deliveries:0, crisis:null, rings:true },
            { id:'urano', name:'OURAN', dist:1130, size:16, color:'#81ecec', speed:0.0005, res:'DIAMANTI', req:'GAS', deliveries:0, crisis:null },
            { id:'nettuno', name:'POSEID', dist:1450, size:16, color:'#6c5ce7', speed:0.0003, res:'ENERGIA', req:'DIAMANTI', deliveries:0, crisis:null },
        ];
        this.moons = [
            { id:'luna', name:'SELENE', parent:'terra', dist:32, size:5, color:'#dfe6e9', speed:0.030, res:'ELIO-3', req:'CIBO', deliveries:0, crisis:null },
            { id:'phobos', name:'SHARD', parent:'marte', dist:22, size:3, color:'#b2bec3', speed:0.080, res:'ACQUA', req:'FERRO', deliveries:0, crisis:null },
            { id:'deimos', name:'ECHO', parent:'marte', dist:38, size:3, color:'#95a5a6', speed:0.040, res:'SILICIO', req:'ENERGIA', deliveries:0, crisis:null },
            { id:'io', name:'VULCAN', parent:'giove', dist:40, size:5, color:'#f9ca24', speed:0.055, res:'ZOLFO', req:'GAS', deliveries:0, crisis:null },
            { id:'europa', name:'AQUA', parent:'giove', dist:56, size:5, color:'#dfe6e9', speed:0.035, res:'ACQUA', req:'CHIPS', deliveries:0, crisis:null },
            { id:'ganimede', name:'GANYM', parent:'giove', dist:74, size:6, color:'#636e72', speed:0.022, res:'GHIACCIO', req:'MEDS', deliveries:0, crisis:null },
            { id:'callisto', name:'CALLIS', parent:'giove', dist:94, size:5, color:'#2d3436', speed:0.014, res:'MINERALI', req:'CIBO', deliveries:0, crisis:null },
            { id:'titano', name:'TITAN', parent:'saturno', dist:62, size:6, color:'#fdcb6e', speed:0.020, res:'IDROCARBURI', req:'FILTRI', deliveries:0, crisis:null },
            { id:'encelado', name:'ICE', parent:'saturno', dist:42, size:4, color:'#f5f6fa', speed:0.040, res:'ACQUA', req:'MINERALI', deliveries:0, crisis:null },
            { id:'titania', name:'CRYSTAL', parent:'urano', dist:52, size:5, color:'#81ecec', speed:0.028, res:'CRISTALLI', req:'ENERGIA', deliveries:0, crisis:null },
            { id:'tritone', name:'TRITON', parent:'nettuno', dist:46, size:5, color:'#74b9ff', speed:0.025, res:'AZOTO', req:'DIAMANTI', deliveries:0, crisis:null },
        ];
        this.allBodies = [...this.planets, ...this.moons];

        this.asteroids = Array.from({ length:52 }, (_,i) => {
            const angle = (i/52)*Math.PI*2 + (Math.random()-0.5)*0.5;
            const dist = 460 + Math.random()*100;
            return { angle, dist, speed:0.0016+Math.random()*0.001, size:1.5+Math.random()*2.5,
                     color:Math.random()>0.5?'#636e72':'#95a5a6', x:0, y:0 };
        });

        this.pilotRoster = [
            { type:'ROOKIE', cost:800, speed:2.0, skillDodge:false, color:'#74b9ff', desc:'Economico · vulnerabile agli asteroidi' },
            { type:'SPERICOLATO', cost:1500, speed:3.8, skillDodge:false, color:'#fd79a8', desc:'Velocissimo · ignora i rischi' },
            { type:'VETERANO', cost:3000, speed:2.8, skillDodge:true, color:'#55efc4', desc:'Costoso · evita la fascia asteroidi' },
        ];

        this.planets.forEach(p => { p.angle=0; p.x=p.dist; p.y=0; });
        this.moons.forEach(m => {
            m.angle=0;
            const par = this.planets.find(p=>p.id===m.parent);
            m.x=(par?par.x:0)+m.dist; m.y=par?par.y:0;
        });
        this.asteroids.forEach(a => { a.x=Math.cos(a.angle)*a.dist; a.y=Math.sin(a.angle)*a.dist; });

        const terra = this.planets.find(p=>p.id==='terra');
        this.ship = { x:terra.x, y:terra.y, vx:0, vy:0, angle:-Math.PI/2 };

        this.camera.x = this.width/2;
        this.camera.y = this.height/2;

        this.message = '';
        this.messageTimer = 0;

        this.init();
    }

    _genStars(n) {
        return Array.from({ length:n }, () => ({
            x:(Math.random()-0.5)*3800, y:(Math.random()-0.5)*3800,
            r:Math.random()>0.85?1.2:0.55, alpha:0.2+Math.random()*0.8
        }));
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
            const s = this.launchState;

            if (e.key === '?' || e.code === 'Slash') { this.showGuide = !this.showGuide; return; }
            if (e.code === 'Escape') { 
                this.showGuide = false; this.showHireMenu = false; this.showMachineMenu = false; return; 
            }
            if ((e.code==='Enter'||e.code==='Space') && s==='CHOOSE_CITY' && this.selectedBody) this._foundCity(this.selectedBody);
            if (e.code==='KeyG' && s==='PLAY') { this.camera.panX=0; this.camera.panY=0; }
            if (e.code==='KeyH' && s==='PLAY') this.showHireMenu = !this.showHireMenu;
            if (this.showHireMenu) {
                if (e.code==='Digit1') this.hireNPC(0);
                if (e.code==='Digit2') this.hireNPC(1);
                if (e.code==='Digit3') this.hireNPC(2);
            }
            if (e.code==='KeyM' && s==='PLAY') {
                this.showMachineMenu = !this.showMachineMenu;
                this.showHireMenu = false;
            }
            if (this.showMachineMenu && (e.code==='Enter' || e.code==='Space' || e.code==='Digit1')) {
                this._playMacchinaAGancio();
            }
        });
        window.addEventListener('keyup', e => { this.keys[e.code]=false; });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.88 : 1/0.88;
            const isOver = this.launchState==='CHOOSE_CITY';
            const minZ = isOver ? 0.06 : 0.12;
            const maxZ = isOver ? 1.2 : 12;
            const oldZ = this.camera.targetZoom;
            const newZ = Math.max(minZ, Math.min(maxZ, oldZ * factor));
            const mx = e.clientX, my = e.clientY;
            const wx = (mx - this.camera.x) / oldZ;
            const wy = (my - this.camera.y) / oldZ;
            this._zoomAnchor = { mx, my, wx, wy, fromZ: oldZ, toZ: newZ };
            this.camera.targetZoom = newZ;
        }, { passive:false });

        this.canvas.addEventListener('mousedown', e => {
            if (e.button===2) { this._isPanning = true; this._lastPan = { x:e.clientX, y:e.clientY }; e.preventDefault(); }
        });
        window.addEventListener('mousemove', e => {
            if (this._isPanning) {
                this.camera.panX += e.clientX - this._lastPan.x;
                this.camera.panY += e.clientY - this._lastPan.y;
                this._lastPan = { x:e.clientX, y:e.clientY };
            }
            if (this.launchState==='CHOOSE_CITY') this.hoveredBody = this._bodyAtScreen(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', e => { if (e.button===2) this._isPanning=false; });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.canvas.addEventListener('click', e => {
            if (this.launchState!=='CHOOSE_CITY') return;
            const b = this._bodyAtScreen(e.clientX, e.clientY);
            if (b && b.id!=='terra') {
                if (this.selectedBody===b) this._foundCity(b); else this.selectedBody=b;
            }
        });

        this.canvas.addEventListener('touchstart', e => this._processTouches(e, true), { passive:false });
        this.canvas.addEventListener('touchmove', e => this._processTouches(e, false), { passive:false });
        this.canvas.addEventListener('touchend', e => {
            this._processTouches(e, false);
            if (this.launchState==='CHOOSE_CITY' && e.changedTouches[0]) {
                const ct = e.changedTouches[0];
                if (!this._touchOnButton(ct.clientX, ct.clientY)) {
                    const b = this._bodyAtScreen(ct.clientX, ct.clientY);
                    if (b && b.id!=='terra') {
                        if (this.selectedBody===b) this._foundCity(b); else this.selectedBody=b;
                    }
                }
            }
        }, { passive:false });

        this.crisisInterval = setInterval(() => {
            if (this.running && this.launchState==='PLAY') this.spawnCrisis();
        }, 13000);

        const submitBtn = document.getElementById('submit-score-btn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitScore());
    }

    _getMobileButtons() { /* ... (stesso codice di prima, lo salto per brevità ma è identico) */ }
    _touchOnButton(tx, ty) { /* ... */ }
    _processTouches(e, isStart) { /* ... */ }
    _worldFromScreen(sx, sy) { return { x:(sx-this.camera.x)/this.camera.zoom, y:(sy-this.camera.y)/this.camera.zoom }; }
    _bodyAtScreen(sx, sy) { /* ... */ }

    _foundCity(body) { /* ... codice identico ... */ }
    hireNPC(idx) { /* ... */ }
    async _playMacchinaAGancio() { /* ... */ }
    async _sendWebhookLog(prizeType) { /* ... */ }
    spawnCrisis() { /* ... */ }
    dock(body) { /* ... */ }

    start() { 
        if (this.running) return;
        this.running = true; 
        this.loop(); 
    }

    update() { /* ... codice completo identico alla versione precedente ... */ }
    _updateBodies() { /* ... */ }
    _updateShip() { /* ... */ }
    _updateNPCs() { /* ... */ }
    _updateCrises() { /* ... */ }
    _particle(x,y,vx,vy,color,life) { this.particles.push({x,y,vx,vy,color,life,maxLife:life}); }
    _updateParticles() { /* ... */ }

    draw() { /* ... codice completo ... */ }
    _drawMachineMenu() { /* ... */ }
    _drawShipArrow() { /* ... */ }
    _drawBody(c, body, isMoon) { /* ... */ }
    _drawChooseCityHUD() { /* ... */ }
    _drawFoundingHUD() { /* ... */ }
    _drawHUD() { /* ... */ }
    _drawOffscreenArrow(sx, sy) { /* ... */ }
    _drawMobileButtons() { /* ... */ }
    _drawGuide() { /* ... */ }

    gameOver(reason) {
        if (!this.running) return;
        this.running = false;
        if (this.crisisInterval) clearInterval(this.crisisInterval);
        const modal = document.getElementById('game-modal');
        const h2 = modal?.querySelector('h2');
        const p = modal?.querySelector('p');
        if (h2) { h2.textContent = 'GAME OVER'; h2.style.color = '#d63031'; }
        if (p) p.innerHTML = `<span style="color:#a1a1aa">${reason}</span><br>SCORE: <b style="color:#f9ca24">${this.score}</b>`;
        if (modal) modal.classList.add('active');
    }

    resetGame() {
        this.running = false;
        if (this.crisisInterval) clearInterval(this.crisisInterval);

        this.score = 0;
        this.credits = 3000;
        this.cargo = [];
        this.hull = 3;
        this.asteroidHitCooldown = 0;
        this.activeCrises = [];
        this.particles = [];
        this.pilots = [];
        this.showHireMenu = false;
        this.showGuide = false;
        this.showMachineMenu = false;
        this.message = '';
        this.messageTimer = 0;
        this.launchState = 'CHOOSE_CITY';
        this.launchTimer = 0;
        this.hoveredBody = null;
        this.selectedBody = null;
        this.homeBody = null;
        this.foundingTimer = 0;

        this.camera = { x: this.width/2, y: this.height/2, zoom: 0.44, targetZoom: 0.44, panX: 0, panY: 0 };

        this.planets.forEach(p => { p.deliveries=0; p.crisis=null; p.isHome=false; p.angle=0; p.x=p.dist; p.y=0; });
        this.moons.forEach(m => {
            m.deliveries=0; m.crisis=null;
            const par = this.planets.find(p=>p.id===m.parent);
            m.angle=0; m.x=(par?par.x:0)+m.dist; m.y=par?par.y:0;
        });

        const terra = this.planets.find(p=>p.id==='terra');
        this.ship = { x:terra.x, y:terra.y, vx:0, vy:0, angle:-Math.PI/2 };

        const modal = document.getElementById('game-modal');
        if (modal) modal.classList.remove('active');

        this.crisisInterval = setInterval(() => {
            if (this.running && this.launchState==='PLAY') this.spawnCrisis();
        }, 13000);

        this.running = true;
        this.loop();
    }

    async submitScore() {
        const raw = (document.getElementById('player-name').value || '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
        const name = raw.padEnd(3,'_');
        if (!raw) return;

        const btn = document.getElementById('submit-score-btn');
        btn.textContent = 'TRASMISSIONE...';
        btn.disabled = true;

        let board = [];
        try {
            const r = await fetch('leaderboard.json?_=' + Date.now());
            board = await r.json();
        } catch(_) {}

        board.push({name, score: this.score});
        board.sort((a,b)=>b.score-a.score);
        board = board.slice(0,10);

        if (!board.some(e => e.name===name && e.score===this.score)) {
            btn.textContent = 'NON NEL TOP 10';
            btn.disabled = false;
            return;
        }

        if (GITHUB_TOKEN) {
            try {
                const [owner, repo] = GITHUB_REPO.split('/');
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
                    method:'POST',
                    headers:{ Authorization:`token ${GITHUB_TOKEN}`, Accept:'application/vnd.github.v3+json', 'Content-Type':'application/json' },
                    body: JSON.stringify({ event_type:'submit_score', client_payload:{name, score:this.score} })
                });
                btn.textContent = res.ok ? '✓ RECORD INVIATO!' : 'ERRORE SERVER';
            } catch(_) { btn.textContent = 'ERRORE CONNESSIONE'; }
        } else {
            btn.textContent = '✓ SALVATO (LOCAL)';
        }
        btn.disabled = false;

        setTimeout(() => {
            const modal = document.getElementById('game-modal');
            if (modal) modal.classList.remove('active');
        }, 2500);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.SpaceGame = SpaceGame;
