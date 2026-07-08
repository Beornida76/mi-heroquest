const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "El Guerrero es el pilar de cualquier grupo." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Descendiente de las antiguas estirpes." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Guerrero de gracia sobrenatural." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Poseedor de los secretos arcanos." }
};

// Bestiario con valores de movimiento correctos según HeroQuest
const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, mov: 10, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icono: "👹" },
    "Fimir": { vida: 3, atk: 3, def: 3, mov: 6, icono: "🦎" },
    "Esqueleto": { vida: 1, atk: 2, def: 2, mov: 6, icono: "💀" },
    "Zombi": { vida: 2, atk: 2, def: 1, mov: 4, icono: "🧟" },
    "Momia": { vida: 3, atk: 3, def: 2, mov: 4, icono: "⚰️" },
    "Guerrero del Caos": { vida: 4, atk: 4, def: 4, mov: 6, icono: "⚔️" },
    "Gárgola": { vida: 6, atk: 5, def: 5, mov: 6, icono: "🗿" },
    "Señor de los Brujos": { vida: 6, atk: 5, def: 5, mov: 6, icono: "🧙‍♂️" }
};

let heroe, FILAS = 19, COLS = 26, mapa = [], explorado = [], enemigos = [], turno = "jugador";

// --- FUNCIONES DE ACCESO ---
function esPosicionValidaParaEnemigo(x, y) {
    if (x < 0 || x >= FILAS || y < 0 || y >= COLS) return false;
    if (mapa[x][y] === 1 || mapa[x][y] === 2) return false; // Muros y puertas cerradas son bloqueos
    if (x === heroe.x && y === heroe.y) return false; // Héroe es obstáculo
    if (!explorado[x][y]) return false; // Solo se mueven por lo descubierto
    return true;
}

// --- LÓGICA DE TURNO ---
async function finalizarTurno() {
    if (turno !== "jugador") return;
    turno = "enemigo";
    document.getElementById('log-combate').innerHTML += `<div>--- Turno Enemigo ---</div>`;
    dibujar();
    
    // Procesar cada enemigo uno a uno
    for (let en of enemigos) {
        if (!en.vivo) continue;
        await procesarTurnoEnemigo(en);
    }
    
    turno = "jugador";
    heroe.mov = 0;
    document.getElementById('log-combate').innerHTML += `<div>--- Turno Jugador ---</div>`;
    dibujar();
}

async function procesarTurnoEnemigo(en) {
    // 1. Intentar moverse
    let pasos = 0;
    while (pasos < en.mov) {
        let dx = heroe.x - en.x;
        let dy = heroe.y - en.y;
        
        // Si está adyacente, dejar de mover y atacar
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) break;

        // Calcular dirección
        let mx = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
        let my = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

        // Intentar mover (prioridad X o Y)
        if (esPosicionValidaParaEnemigo(en.x + mx, en.y)) {
            en.x += mx;
        } else if (esPosicionValidaParaEnemigo(en.x, en.y + my)) {
            en.y += my;
        } else {
            break; // Bloqueado
        }
        pasos++;
        dibujar();
        await new Promise(r => setTimeout(r, 100)); // Efecto visual
    }

    // 2. Intentar Atacar si está adyacente
    let dx = heroe.x - en.x;
    let dy = heroe.y - en.y;
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
        let atk = Math.floor(Math.random() * 6) + 1;
        let def = Math.floor(Math.random() * 6) + 1;
        if (atk > def) {
            heroe.vida--;
            document.getElementById('log-combate').innerHTML += `<div>¡${en.nombre} ataca y hiere!</div>`;
        } else {
            document.getElementById('log-combate').innerHTML += `<div>${en.nombre} falla su ataque.</div>`;
        }
        dibujar();
    }
}

// --- GESTIÓN DE MAPA Y JUEGO ---
function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
    let puertas = [];
    for(let i=0; i<5; i++) {
        let w = Math.floor(Math.random() * 4) + 4;
        let h = Math.floor(Math.random() * 3) + 4;
        let x = Math.floor(Math.random() * (FILAS - h - 2)) + 1;
        let y = Math.floor(Math.random() * (COLS - w - 2)) + 1;
        for(let r=x; r<x+h; r++) for(let c=y; c<y+w; c++) mapa[r][c] = 0;
        let px = x + Math.floor(h/2); let py = y + w - 1;
        mapa[px][py] = 2; // Puerta cerrada
        puertas.push({x: px, y: py});
    }
    // Pasillos (asegurar que conectan)
    for(let i=0; i < puertas.length - 1; i++) {
        let p1 = puertas[i], p2 = puertas[i+1];
        let r = p1.x; let c = p1.y;
        while(c !== p2.y) { c += (p2.y > c ? 1 : -1); if(mapa[r][c] === 1) mapa[r][c] = 0; }
        while(r !== p2.x) { r += (p2.x > r ? 1 : -1); if(mapa[r][c] === 1) mapa[r][c] = 0; }
    }
}

function iniciarJuego(clase) {
    explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
    crearMapa();
    // Colocación inicial
    let suelos = []; for(let i=0; i<FILAS; i++) for(let j=0; j<COLS; j++) if(mapa[i][j] === 0) suelos.push({x: i, y: j});
    let start = suelos[Math.floor(Math.random() * suelos.length)];
    heroe = { ...HEROES[clase], nombre: clase, x: start.x, y: start.y, mov: 0 };
    
    // Spawn enemigos
    enemigos = [];
    for(let i=0; i<4; i++) { 
        let pos = suelos[Math.floor(Math.random() * suelos.length)];
        let tipo = Object.keys(BESTIARIO)[Math.floor(Math.random() * Object.keys(BESTIARIO).length)];
        enemigos.push({nombre: tipo, ...BESTIARIO[tipo], x: pos.x, y: pos.y, vivo: true});
    }
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    dibujar();
}

// [MANTENER las funciones dibujar, atacarEnemigo y Event Listeners que tenías, 
// solo actualiza el flujo de teclado para respetar el turno]
window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    if(mapa[nx][ny] === 2) { mapa[nx][ny] = 3; heroe.mov--; } // Abre puerta
    else if(mapa[nx][ny] === 0 || mapa[nx][ny] === 3) { heroe.x = nx; heroe.y = ny; heroe.mov--; }
    
    dibujar();
    if(heroe.mov <= 0) {
        document.getElementById('log-combate').innerHTML += `<div>Turno agotado.</div>`;
        finalizarTurno();
    }
});
