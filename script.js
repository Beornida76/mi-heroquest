const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "Gran combatiente físico." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Experto en explorar trampas." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Ágil y preciso." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Sabio de las artes arcanas." }
};

const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, mov: 10, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icono: "👹" }
};

let heroe, mapa = [], explorado = [], enemigos = [], turno = "jugador";
const FILAS = 19, COLS = 26;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('selector');
    for (let nombre in HEROES) {
        let div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${HEROES[nombre].icono} ${nombre}</h3><p>${HEROES[nombre].desc}</p>`;
        div.onclick = () => iniciarJuego(nombre);
        selector.appendChild(div);
    }
});

function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
    // Crear habitaciones seguras
    for (let i = 0; i < 5; i++) {
        let x = Math.floor(Math.random() * (FILAS - 6)) + 2;
        let y = Math.floor(Math.random() * (COLS - 6)) + 2;
        for (let r = x; r < x + 4; r++) for (let c = y; c < y + 4; c++) mapa[r][c] = 0;
        mapa[x+2][y+3] = 2; // Puerta
    }
}

function iniciarJuego(clase) {
    crearMapa();
    // BUSCAR POSICIÓN VÁLIDA
    let startX = 0, startY = 0;
    let encontrada = false;
    while(!encontrada) {
        startX = Math.floor(Math.random() * FILAS);
        startY = Math.floor(Math.random() * COLS);
        if(mapa[startX][startY] === 0) encontrada = true;
    }
    
    explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
    heroe = { ...HEROES[clase], x: startX, y: startY, mov: 0 };
    
    enemigos = [{ nombre: "Orco", ...BESTIARIO["Orco"], x: startX+2, y: startY+2, vivo: true }];
    
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    dibujar();
}

function dibujar() {
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = '';
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) explorado[f][c] = true;
            const div = document.createElement('div');
            div.className = 'casilla';
            if (!explorado[f][c]) {
                div.classList.add('oscuridad');
            } else {
                div.classList.add('visible');
                if (mapa[f][c] === 1) div.classList.add('muro');
                if (mapa[f][c] === 2) div.classList.add('puerta');
                if (f === heroe.x && c === heroe.y) div.innerText = heroe.icono;
                else {
                    let en = enemigos.find(e => e.vivo && e.x === f && e.y === c);
                    if (en) div.innerText = en.icono;
                }
            }
            tablero.appendChild(div);
        }
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

function tirarDadosMovimiento() {
    if (turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    document.getElementById('btn-mov').disabled = true;
    dibujar();
    console.log("Movimiento tirado: " + heroe.mov);
}

function atacarEnemigo() {
    let en = enemigos.find(e => e.vivo && Math.abs(e.x - heroe.x) <= 1 && Math.abs(e.y - heroe.y) <= 1);
    if (!en) return;
    en.vida -= 1;
    if (en.vida <= 0) en.vivo = false;
    dibujar();
    finalizarTurno();
}

async function finalizarTurno() {
    turno = "enemigo";
    for (let en of enemigos.filter(e => e.vivo)) {
        let pasos = 0;
        while (pasos < en.mov) {
            let dx = heroe.x - en.x;
            let dy = heroe.y - en.y;
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) break;
            let mx = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
            let my = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
            if (mapa[en.x + mx][en.y] === 0) en.x += mx;
            else if (mapa[en.x][en.y + my] === 0) en.y += my;
            else break;
            pasos++;
            dibujar();
            await new Promise(r => setTimeout(r, 100));
        }
    }
    turno = "jugador";
    heroe.mov = 0;
    document.getElementById('btn-mov').disabled = false;
    dibujar();
}

// CONTROL DE TECLADO CON DEBUG
window.addEventListener('keydown', (e) => {
    if (turno !== "jugador") { console.log("Bloqueado: Turno enemigo"); return; }
    if (heroe.mov <= 0) { console.log("Bloqueado: No tienes puntos de movimiento. Tira los dados."); return; }
    
    let nx = heroe.x, ny = heroe.y;
    if (e.key === 'ArrowUp') nx--; if (e.key === 'ArrowDown') nx++;
    if (e.key === 'ArrowLeft') ny--; if (e.key === 'ArrowRight') ny++;
    
    if (mapa[nx][ny] === 2) { 
        mapa[nx][ny] = 0; // Abrir puerta
        heroe.mov--; 
        console.log("Puerta abierta");
    } else if (mapa[nx][ny] === 0) { 
        heroe.x = nx; heroe.y = ny; heroe.mov--; 
        console.log("Movimiento a: " + nx + "," + ny);
    } else {
        console.log("Bloqueado: Muro o elemento en " + nx + "," + ny);
    }
    
    dibujar();
    if (heroe.mov === 0) finalizarTurno();
});
