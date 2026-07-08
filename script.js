const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️" },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️" },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹" },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙" }
};

const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, mov: 10, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icono: "👹" },
    "Fimir": { vida: 3, atk: 3, def: 3, mov: 6, icono: "🦎" },
    "Esqueleto": { vida: 1, atk: 2, def: 2, mov: 6, icono: "💀" },
    "Zombi": { vida: 2, atk: 2, def: 1, mov: 4, icono: "🧟" },
    "Momia": { vida: 3, atk: 3, def: 2, mov: 4, icono: "⚰️" },
    "Guerrero del Caos": { vida: 4, atk: 4, def: 4, mov: 6, icono: "⚔️" },
    "Gárgola": { vida: 6, atk: 5, def: 5, mov: 6, icono: "🗿" }
};

let heroe, FILAS = 19, COLS = 26, mapa = [], explorado = [], enemigos = [], turno = "jugador";

// Inicializar Selector al cargar
document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('selector');
    for (let name in HEROES) {
        let div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${HEROES[name].icono} ${name}</h3>`;
        div.onclick = () => iniciarJuego(name);
        sel.appendChild(div);
    }
});

function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
    for(let i=0; i<5; i++) {
        let x = Math.floor(Math.random()*10)+1, y = Math.floor(Math.random()*10)+1;
        for(let r=x; r<x+4; r++) for(let c=y; c<y+4; c++) mapa[r][c] = 0;
        mapa[x+2][y+3] = 2; // Puerta
    }
}

function iniciarJuego(clase) {
    crearMapa();
    explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
    heroe = { ...HEROES[clase], x: 5, y: 5, mov: 0 };
    enemigos = [{nombre: "Orco", ...BESTIARIO["Orco"], x: 10, y: 10, vivo: true}];
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    dibujar();
}

function dibujar() {
    const tab = document.getElementById('tablero'); tab.innerHTML = '';
    for(let f=0; f<FILAS; f++) for(let c=0; c<COLS; c++) {
        let div = document.createElement('div');
        div.className = 'casilla ' + (mapa[f][c]===1 ? 'muro' : '') + (mapa[f][c]===2 ? 'puerta' : '');
        if(f===heroe.x && c===heroe.y) div.innerText = heroe.icono;
        let en = enemigos.find(e => e.vivo && e.x===f && e.y===c);
        if(en) div.innerText = en.icono;
        tab.appendChild(div);
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

function tirarDadosMovimiento() {
    if(turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    dibujar();
}

function atacarEnemigo() {
    let en = enemigos.find(e => e.vivo && Math.abs(e.x-heroe.x)<=1 && Math.abs(e.y-heroe.y)<=1);
    if(en) {
        en.vida -= 1;
        if(en.vida <= 0) en.vivo = false;
        document.getElementById('log-combate').innerHTML += "<div>Atacaste al monstruo!</div>";
        dibujar();
        finalizarTurno();
    }
}

async function finalizarTurno() {
    turno = "enemigo";
    for(let en of enemigos.filter(e => e.vivo)) {
        // Regla: No cruzan puertas, no atraviesan heroes
        let pasos = 0;
        while(pasos < en.mov) {
            let dx = heroe.x - en.x, dy = heroe.y - en.y;
            if(Math.abs(dx)<=1 && Math.abs(dy)<=1) break; // Adyacente = atacar
            let mx = dx!==0 ? (dx>0?1:-1) : 0;
            let my = dy!==0 ? (dy>0?1:-1) : 0;
            
            // Comprobación de colisiones (Puertas son muros para enemigos)
            if(mapa[en.x+mx][en.y] === 0) en.x += mx;
            else if(mapa[en.x][en.y+my] === 0) en.y += my;
            else break;
            
            pasos++;
            dibujar();
            await new Promise(r => setTimeout(r, 200));
        }
    }
    turno = "jugador";
    heroe.mov = 0;
    dibujar();
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
