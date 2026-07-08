const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "Gran combatiente físico." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Experto en explorar trampas." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Ágil y preciso." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Sabio de las artes arcanas." }
};

const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, mov: 10, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icono: "👹" },
    "Fimir": { vida: 3, atk: 3, def: 3, mov: 6, icono: "🦎" },
    "Esqueleto": { vida: 1, atk: 2, def: 2, mov: 6, icono: "💀" },
    "Guerrero del Caos": { vida: 4, atk: 4, def: 4, mov: 6, icono: "⚔️" }
};

let heroe, FILAS = 19, COLS = 26, mapa = [], explorado = [], enemigos = [], turno = "jugador";

// 1. REPARACIÓN: Generador de mapa con habitaciones conectadas
function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
    let salas = [];
    for (let i = 0; i < 5; i++) {
        let w = 4, h = 4;
        let x = Math.floor(Math.random() * (FILAS - 6)) + 2;
        let y = Math.floor(Math.random() * (COLS - 6)) + 2;
        for (let r = x; r < x + h; r++) for (let c = y; c < y + w; c++) mapa[r][c] = 0;
        salas.push({ x, y, w, h });
    }
    // Conectar salas con túneles
    for (let i = 0; i < salas.length - 1; i++) {
        let x1 = salas[i].x, y1 = salas[i].y, x2 = salas[i+1].x, y2 = salas[i+1].y;
        for (let r = Math.min(x1, x2); r <= Math.max(x1, x2); r++) mapa[r][y1] = 0;
        for (let c = Math.min(y1, y2); c <= Math.max(y1, y2); c++) mapa[x2][c] = 0;
    }
    // Añadir puertas (2) al azar en los bordes de los pasillos o salas
    for(let i=0; i<3; i++) mapa[Math.floor(Math.random()*FILAS)][Math.floor(Math.random()*COLS)] = 2;
}

// 2. REPARACIÓN: Selector con descripciones
document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('selector');
    for (let name in HEROES) {
        let div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${HEROES[name].icono} ${name}</h3><p>${HEROES[name].desc}</p>`;
        div.onclick = () => iniciarJuego(name);
        sel.appendChild(div);
    }
});

function iniciarJuego(clase) {
    crearMapa();
    explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
    heroe = { ...HEROES[clase], x: 5, y: 5, mov: 0 };
    enemigos = [{nombre: "Orco", ...BESTIARIO["Orco"], x: 10, y: 10, vivo: true}];
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    dibujar();
}

// 3. REPARACIÓN: Niebla de guerra en dibujar()
function dibujar() {
    const tab = document.getElementById('tablero'); tab.innerHTML = '';
    for(let f=0; f<FILAS; f++) for(let c=0; c<COLS; c++) {
        let div = document.createElement('div');
        // Visibilidad
        if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) explorado[f][c] = true;
        
        div.className = 'casilla';
        if (!explorado[f][c]) {
            div.classList.add('oscuridad');
        } else {
            div.classList.add('visible');
            if(mapa[f][c] === 1) div.classList.add('muro');
            if(mapa[f][c] === 2) div.classList.add('puerta');
            if(f===heroe.x && c===heroe.y) div.innerText = heroe.icono;
            let en = enemigos.find(e => e.vivo && e.x===f && e.y===c);
            if(en) div.innerText = en.icono;
        }
        tab.appendChild(div);
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

// 4. LÓGICA MOVIMIENTO ENEMIGO (Mantiene la tuya)
async function finalizarTurno() {
    turno = "enemigo";
    for(let en of enemigos.filter(e => e.vivo)) {
        let pasos = 0;
        while(pasos < en.mov) {
            let dx = heroe.x - en.x, dy = heroe.y - en.y;
            if(Math.abs(dx)<=1 && Math.abs(dy)<=1) break; // Adyacente = atacar
            let mx = dx!==0 ? (dx>0?1:-1) : 0;
            let my = dy!==0 ? (dy>0?1:-1) : 0;
            
            // Comprobación de colisiones (Puertas (2) son muros para enemigos)
            if(mapa[en.x+mx][en.y] === 0) en.x += mx;
            else if(mapa[en.x][en.y+my] === 0) en.y += my;
            else break;
            
            pasos++;
            dibujar();
            await new Promise(r => setTimeout(r, 100));
        }
    }
    turno = "jugador";
    heroe.mov = 0;
    dibujar();
}

// (Resto de funciones: tirarDadosMovimiento, atacarEnemigo, etc, permanecen igual)
function tirarDadosMovimiento() {
    if(turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    document.getElementById('btn-mov').disabled = true;
    document.getElementById('btn-atk').disabled = false;
    dibujar();
}

function atacarEnemigo() {
    let en = enemigos.find(e => e.vivo && Math.abs(e.x-heroe.x)<=1 && Math.abs(e.y-heroe.y)<=1);
    if(en) { en.vida -= 1; if(en.vida <= 0) en.vivo = false; dibujar(); finalizarTurno(); }
}

window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    if(mapa[nx][ny] === 2) { mapa[nx][ny] = 0; heroe.mov--; } // Abrir puerta
    else if(mapa[nx][ny] === 0) { heroe.x = nx; heroe.y = ny; heroe.mov--; }
    
    dibujar();
    if(heroe.mov === 0) finalizarTurno();
});
