const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "Gran combatiente, experto en el cuerpo a cuerpo." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Resistente, experto en detectar trampas." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Ágil, capaz de combinar ataques." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Sabio arcano, puede lanzar hechizos poderosos." }
};

const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, mov: 10, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icono: "👹" },
    "Fimir": { vida: 3, atk: 3, def: 3, mov: 6, icono: "🦎" },
    "Esqueleto": { vida: 1, atk: 2, def: 2, mov: 6, icono: "💀" },
    "Zombi": { vida: 2, atk: 2, def: 1, mov: 4, icono: "🧟" },
    "Momia": { vida: 3, atk: 3, def: 2, mov: 4, icono: "⚰️" },
    "Gárgola": { vida: 6, atk: 5, def: 5, mov: 6, icono: "🗿" }
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

// --- LÓGICA DE MAPA ---
function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1)); // Todo muros
    // Crear 4 salas rectangulares
    for (let i = 0; i < 4; i++) {
        let x = Math.floor(Math.random() * 10) + 2;
        let y = Math.floor(Math.random() * 15) + 2;
        for (let r = x; r < x + 4; r++) {
            for (let c = y; c < y + 4; c++) mapa[r][c] = 0;
        }
        // Poner puerta en una pared
        mapa[x + 2][y + 3] = 2;
    }
    // Conexiones (pasillos básicos)
    for (let i = 0; i < FILAS; i++) if (i % 5 === 0) for (let j = 0; j < COLS; j++) mapa[i][j] = 0;
}

function iniciarJuego(clase) {
    crearMapa();
    explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
    heroe = { ...HEROES[clase], x: 3, y: 3, mov: 0 };
    
    // Spawneo enemigos
    enemigos = [
        { nombre: "Goblin", ...BESTIARIO["Goblin"], x: 10, y: 15, vivo: true },
        { nombre: "Orco", ...BESTIARIO["Orco"], x: 15, y: 10, vivo: true }
    ];
    
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    dibujar();
}

// --- RENDERIZADO ---
function dibujar() {
    const tablero = document.getElementById('tablero');
    tablero.innerHTML = '';
    
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            // Lógica Niebla de Guerra
            if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) explorado[f][c] = true;
            
            const div = document.createElement('div');
            div.className = 'casilla';
            
            if (!explorado[f][c]) {
                div.classList.add('oscuridad');
            } else {
                div.classList.add('visible');
                if (mapa[f][c] === 1) div.classList.add('muro');
                if (mapa[f][c] === 2) div.classList.add('puerta');
                
                // Mostrar entidades
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

// --- LÓGICA DE JUEGO ---
function tirarDadosMovimiento() {
    if (turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
    document.getElementById('btn-mov').disabled = true;
    dibujar();
}

function atacarEnemigo() {
    let en = enemigos.find(e => e.vivo && Math.abs(e.x - heroe.x) <= 1 && Math.abs(e.y - heroe.y) <= 1);
    if (!en) return;
    en.vida -= 1;
    document.getElementById('log-combate').innerHTML += `<div>Atacas a ${en.nombre}. Vida: ${en.vida}</div>`;
    if (en.vida <= 0) { en.vivo = false; document.getElementById('log-combate').innerHTML += `<div>¡${en.nombre} derrotado!</div>`; }
    dibujar();
    finalizarTurno();
}

async function finalizarTurno() {
    turno = "enemigo";
    document.getElementById('log-combate').innerHTML += `<div>--- Turno Enemigo ---</div>`;
    
    for (let en of enemigos.filter(e => e.vivo)) {
        let pasos = 0;
        while (pasos < en.mov) {
            let dx = heroe.x - en.x;
            let dy = heroe.y - en.y;
            
            // Si está adyacente, para y ataca
            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) break;
            
            let mx = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
            let my = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
            
            // Regla: No cruzan puertas (2), solo suelo (0)
            if (mapa[en.x + mx][en.y] === 0) en.x += mx;
            else if (mapa[en.x][en.y + my] === 0) en.y += my;
            else break; 
            
            pasos++;
            dibujar();
            await new Promise(r => setTimeout(r, 150));
        }
    }
    
    turno = "jugador";
    heroe.mov = 0;
    document.getElementById('btn-mov').disabled = false;
    dibujar();
}

// Control teclado
window.addEventListener('keydown', (e) => {
    if (turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if (e.key === 'ArrowUp') nx--; if (e.key === 'ArrowDown') nx++;
    if (e.key === 'ArrowLeft') ny--; if (e.key === 'ArrowRight') ny++;
    
    // Lógica movimiento
    if (mapa[nx][ny] === 2) { 
        mapa[nx][ny] = 0; // Abrir puerta
        heroe.mov--; 
    } else if (mapa[nx][ny] === 0) { 
        heroe.x = nx; heroe.y = ny; heroe.mov--; 
    }
    
    dibujar();
    if (heroe.mov === 0) finalizarTurno();
});
