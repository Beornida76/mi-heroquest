const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "El Guerrero es el pilar de cualquier grupo. Adiestrado en las artes de la guerra desde su juventud, su capacidad para infligir daño físico y resistir los ataques más brutales lo convierte en un combatiente temido en el frente de batalla." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Descendiente de las antiguas estirpes de las montañas, el Enano es un experto en el arte de la exploración. Posee una habilidad innata para detectar trampas y puertas secretas, además de una resistencia natural a los peligros de las mazmorras." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Un guerrero de gracia sobrenatural, el Elfo es un maestro de la agilidad. Capaz de realizar movimientos rápidos y precisos, puede alcanzar a sus enemigos antes de que estos logren reaccionar. Combina el combate físico con una pizca de magia arcana." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Aunque su fragilidad física es evidente, el Mago es el poseedor de los secretos arcanos. Su sabiduría y sus poderosos conjuros pueden alterar el curso de la batalla en un instante, desintegrando hordas de enemigos con una sola palabra de poder." }
};

const BESTIARIO = {
    "Goblin": { vida: 1, atk: 2, def: 1, icono: "👺" },
    "Orco": { vida: 2, atk: 3, def: 2, icono: "👹" },
    "Fimir": { vida: 3, atk: 3, def: 3, icono: "🦎" },
    "Guerrero del Caos": { vida: 4, atk: 4, def: 4, icono: "💀" },
    "Gárgola": { vida: 6, atk: 5, def: 5, icono: "🗿" }
};

let heroe, FILAS = 19, COLS = 26;
let mapa = []; // 0:Suelo, 1:Muro, 2:PuertaCerrada, 3:PuertaAbierta
let explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
let enemigos = [];
let turno = "jugador";

function renderizarDados(cantidad) { return `<span class="dice-icon">${'🎲'.repeat(cantidad)}</span>`; }

const selector = document.getElementById('selector');
for (let nombre in HEROES) {
    let h = HEROES[nombre];
    let div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h2>${h.icono} ${nombre}</h2><div class="stats-container"><span>Atk: ${renderizarDados(h.atk)}</span><span>Def: ${renderizarDados(h.def)}</span></div><p style="font-size: 0.9em; margin-top:10px;">${h.desc}</p>`;
    div.onclick = () => iniciarJuego(nombre);
    selector.appendChild(div);
}

function iniciarJuego(clase) {
    crearMapa();
    let suelos = [];
    for(let i=0; i<FILAS; i++) for(let j=0; j<COLS; j++) if(mapa[i][j] === 0) suelos.push({x: i, y: j});
    let start = suelos[Math.floor(Math.random() * suelos.length)];
    heroe = { ...HEROES[clase], nombre: clase, x: start.x, y: start.y, mov: 0 };
    enemigos = [];
    let tipos = Object.keys(BESTIARIO);
    for(let i=0; i<4; i++) { 
        let pos = suelos[Math.floor(Math.random() * suelos.length)];
        let tipoNombre = tipos[Math.floor(Math.random() * tipos.length)];
        if(Math.abs(pos.x - heroe.x) > 3) enemigos.push({nombre: tipoNombre, ...BESTIARIO[tipoNombre], x: pos.x, y: pos.y, vivo: true});
    }
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = heroe.nombre;
    dibujar();
}

function crearMapa() {
    mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
    let salas = [];
    for(let i=0; i<7; i++) {
        let w = Math.floor(Math.random() * 4) + 3;
        let h = Math.floor(Math.random() * 3) + 3;
        let x = Math.floor(Math.random() * (FILAS - h - 2)) + 1;
        let y = Math.floor(Math.random() * (COLS - w - 2)) + 1;
        for(let r=x; r<x+h; r++) for(let c=y; c<y+w; c++) mapa[r][c] = 0;
        salas.push({x: Math.floor(x + h/2), y: Math.floor(y + w/2)});
    }
    for(let i=0; i<salas.length - 1; i++) {
        let s1 = salas[i], s2 = salas[i+1];
        for(let c=Math.min(s1.y, s2.y); c <= Math.max(s1.y, s2.y); c++) mapa[s1.x][c] = 0;
        for(let r=Math.min(s1.x, s2.x); r <= Math.max(s1.x, s2.x); r++) mapa[r][s2.y] = 0;
        mapa[s2.x][s2.y] = 2; // Colocar puerta en entrada de sala
    }
}

function hayEnemigoEn(x, y) { return enemigos.find(en => en.vivo && en.x === x && en.y === y); }
function hayJugadorEn(x, y) { return heroe.x === x && heroe.y === y; }

function lanzarDadosCombate(cantidad, tipo) {
    let aciertos = 0;
    for(let i=0; i<cantidad; i++) {
        let cara = Math.floor(Math.random() * 6) + 1;
        if (tipo === 'ataque' && cara <= 3) aciertos++;
        else if (tipo === 'defensa_heroe' && (cara === 4 || cara === 5)) aciertos++;
        else if (tipo === 'defensa_monstruo' && cara === 6) aciertos++;
    }
    return aciertos;
}

function dibujar() {
    const tablero = document.getElementById('tablero'); tablero.innerHTML = '';
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) explorado[f][c] = true;
            const el = document.createElement('div');
            el.className = 'casilla';
            if (explorado[f][c]) {
                el.classList.add('visible');
                if (mapa[f][c] === 1) el.classList.add('muro');
                if (mapa[f][c] === 2) { el.classList.add('puerta'); el.innerText = "🚪"; }
                if (mapa[f][c] === 3) { /* Puerta abierta es suelo */ }
                let en = hayEnemigoEn(f, c);
                if (en) el.innerText = en.icono;
            }
            if (f === heroe.x && c === heroe.y) el.innerText = heroe.icono;
            tablero.appendChild(el);
        }
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
    document.getElementById('btn-atk').disabled = (turno !== "jugador" || !enemigos.some(en => en.vivo && Math.abs(en.x - heroe.x) <= 1 && Math.abs(en.y - heroe.y) <= 1 && !(en.x === heroe.x && en.y === heroe.y)));
    document.getElementById('btn-mov').disabled = (turno !== "jugador" || heroe.mov > 0);
}

function atacarEnemigo() {
    let en = enemigos.find(en => en.vivo && Math.abs(en.x - heroe.x) <= 1 && Math.abs(en.y - heroe.y) <= 1 && !(en.x === heroe.x && en.y === heroe.y));
    if (!en) return;
    let ataque = lanzarDadosCombate(heroe.atk, 'ataque');
    let defensa = lanzarDadosCombate(en.def, 'defensa_monstruo');
    let dano = Math.max(0, ataque - defensa);
    en.vida -= dano;
    document.getElementById('log-combate').innerHTML += `<div>Atacas a ${en.nombre}: ${ataque} vs ${dano > 0 ? defensa + ' (Daño: ' + dano + ')' : 'bloqueado'}</div>`;
    if (en.vida <= 0) { en.vivo = false; document.getElementById('log-combate').innerHTML += `<div>¡${en.nombre} derrotado!</div>`; }
    dibujar();
    setTimeout(finalizarTurno, 1000); 
}

function finalizarTurno() {
    if (turno !== "jugador") return;
    turno = "enemigo";
    document.getElementById('log-combate').innerHTML += `<div>--- Turno Enemigo ---</div>`;
    dibujar();
    setTimeout(ejecutarTurnoEnemigo, 800);
}

function ejecutarTurnoEnemigo() {
    enemigos.forEach(en => {
        if (!en.vivo) return;
        let distX = heroe.x - en.x;
        let distY = heroe.y - en.y;
        if (Math.abs(distX) <= 1 && Math.abs(distY) <= 1) {
            let ataque = lanzarDadosCombate(en.atk, 'ataque');
            let defensa = lanzarDadosCombate(heroe.def, 'defensa_heroe');
            let dano = Math.max(0, ataque - defensa);
            heroe.vida -= dano;
            document.getElementById('log-combate').innerHTML += `<div>${en.nombre} ataca: ${ataque} vs ${dano > 0 ? defensa + ' (Daño: ' + dano + ')' : 'bloqueado'}</div>`;
        } else {
            let movX = distX !== 0 ? (distX > 0 ? 1 : -1) : 0;
            let movY = distY !== 0 ? (distY > 0 ? 1 : -1) : 0;
            if (mapa[en.x + movX][en.y] === 0 && !hayJugadorEn(en.x + movX, en.y) && !hayEnemigoEn(en.x + movX, en.y)) en.x += movX;
            else if (mapa[en.x][en.y + movY] === 0 && !hayJugadorEn(en.x, en.y + movY) && !hayEnemigoEn(en.x, en.y + movY)) en.y += movY;
        }
    });
    if (heroe.vida <= 0) {
        document.getElementById('juego-contenedor').style.display = 'none';
        document.getElementById('pantalla-derrota').style.display = 'flex';
        return;
    }
    turno = "jugador";
    heroe.mov = 0;
    document.getElementById('log-combate').innerHTML += `<div>--- Turno Jugador ---</div>`;
    dibujar();
}

function tirarDadosMovimiento() {
    if (turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    dibujar();
}

window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    if(nx>=0 && nx<FILAS && ny>=0 && ny<COLS) {
        if (mapa[nx][ny] === 2) { mapa[nx][ny] = 3; heroe.mov--; dibujar(); }
        else if ((mapa[nx][ny] === 0 || mapa[nx][ny] === 3) && !hayEnemigoEn(nx, ny)) { heroe.x = nx; heroe.y = ny; heroe.mov--; dibujar(); }
    }
});
