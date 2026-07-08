const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "El Guerrero es el pilar de cualquier grupo. Adiestrado en las artes de la guerra, su capacidad para infligir daño físico y resistir los ataques lo convierte en un combatiente temido.", info: "Atacante robusto." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Descendiente de las antiguas estirpes, el Enano es un experto en el arte de la exploración. Posee una habilidad innata para detectar trampas y puertas secretas.", info: "Especialista en trampas." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Un guerrero de gracia sobrenatural, el Elfo es un maestro de la agilidad. Capaz de realizar movimientos rápidos y precisos antes de que el enemigo reaccione.", info: "Rápido y equilibrado." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Poseedor de los secretos arcanos. Su sabiduría y sus poderosos conjuros pueden alterar el curso de la batalla en un instante.", info: "Maestro arcano." }
};

let heroe, FILAS = 19, COLS = 26;
let mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
let explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
let enemigos = [{nombre: "Orco", vida: 2, atk: 3, def: 1, icono: "👹", x: 4, y: 4, vivo: true}];
let turno = "jugador";

function renderizarDados(cantidad) { return `<span class="dice-icon">${'🎲'.repeat(cantidad)}</span>`; }

// Inicializar Selector
const selector = document.getElementById('selector');
for (let nombre in HEROES) {
    let h = HEROES[nombre];
    let div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h2>${h.icono} ${nombre}</h2><div class="stats-container"><span>Atk: ${renderizarDados(h.atk)}</span><span>Def: ${renderizarDados(h.def)}</span></div><div class="desc">${h.desc}</div>`;
    div.onclick = () => iniciarJuego(nombre);
    selector.appendChild(div);
}

function iniciarJuego(clase) {
    heroe = { ...HEROES[clase], nombre: clase, x: 2, y: 2, mov: 0 };
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = heroe.nombre;
    crearMapa(); dibujar();
}

function crearMapa() {
    [{x: 1, y: 1, w: 5, h: 5}, {x: 10, y: 1, w: 5, h: 5}].forEach(q => {
        for(let i=q.y; i<q.y+q.h; i++) for(let j=q.x; j<q.x+q.w; j++) mapa[i][j] = 0;
    });
    for(let i=1; i<7; i++) mapa[i][6] = 0;
}

function hayEnemigoEn(x, y) { return enemigos.find(en => en.vivo && en.x === x && en.y === y); }
function hayJugadorEn(x, y) { return heroe.x === x && heroe.y === y; }

function lanzarDadosCombate(cantidad, tipo) {
    let aciertos = 0;
    for(let i=0; i<cantidad; i++) {
        let cara = Math.floor(Math.random() * 6) + 1;
        if (tipo === 'ataque' && cara <= 3) aciertos++; // Calavera
        else if (tipo === 'defensa_heroe' && (cara === 4 || cara === 5)) aciertos++; // Escudo Blanco
        else if (tipo === 'defensa_monstruo' && cara === 6) aciertos++; // Escudo Negro
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
                let en = hayEnemigoEn(f, c);
                if (en) el.innerText = en.icono;
            }
            if (f === heroe.x && c === heroe.y) el.innerText = heroe.icono;
            tablero.appendChild(el);
        }
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
    let adyacente = enemigos.find(en => en.vivo && Math.abs(en.x - heroe.x) <= 1 && Math.abs(en.y - heroe.y) <= 1 && !(en.x === heroe.x && en.y === heroe.y));
    document.getElementById('btn-atk').disabled = (turno !== "jugador" || !adyacente);
    document.getElementById('btn-mov').disabled = (turno !== "jugador" || heroe.mov === 0);
}

function atacarEnemigo() {
    if (turno !== "jugador") return;
    let en = enemigos.find(en => en.vivo && Math.abs(en.x - heroe.x) <= 1 && Math.abs(en.y - heroe.y) <= 1 && !(en.x === heroe.x && en.y === heroe.y));
    if (!en) return;
    
    let ataque = lanzarDadosCombate(heroe.atk, 'ataque');
    let defensa = lanzarDadosCombate(en.def, 'defensa_monstruo');
    let dano = Math.max(0, ataque - defensa);
    en.vida -= dano;
    
    document.getElementById('log-combate').innerHTML += `<div>Atacas a ${en.nombre}: ${ataque} vs ${defensa} (Daño: ${dano})</div>`;
    if (en.vida <= 0) { 
        en.vivo = false; 
        document.getElementById('log-combate').innerHTML += `<div>¡${en.nombre} derrotado!</div>`; 
    }
    dibujar();
}

function finalizarTurno() {
    if (turno !== "jugador") return;
    turno = "enemigo";
    document.getElementById('log-combate').innerHTML += `<div>--- Turno del Enemigo ---</div>`;
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
            document.getElementById('log-combate').innerHTML += `<div>${en.nombre} ataca: ${ataque} vs ${defensa} (Daño: ${dano})</div>`;
        } else {
            let movX = distX !== 0 ? (distX > 0 ? 1 : -1) : 0;
            let movY = distY !== 0 ? (distY > 0 ? 1 : -1) : 0;
            if (mapa[en.x + movX][en.y] === 0 && !hayJugadorEn(en.x + movX, en.y)) en.x += movX;
            else if (mapa[en.x][en.y + movY] === 0 && !hayJugadorEn(en.x, en.y + movY)) en.y += movY;
        }
    });

    turno = "jugador";
    document.getElementById('log-combate').innerHTML += `<div>--- Turno del Jugador ---</div>`;
    if (heroe.vida <= 0) alert("¡Has muerto! Fin de la partida.");
    dibujar();
}

function tirarDadosMovimiento() {
    if (turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    document.getElementById('btn-mov').disabled = true;
    dibujar();
}

window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    if(nx>=0 && nx<FILAS && ny>=0 && ny<COLS && mapa[nx][ny] === 0 && !hayEnemigoEn(nx, ny)) {
        heroe.x = nx; heroe.y = ny; heroe.mov--; dibujar();
    }
});
