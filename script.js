const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icono: "🛡️", desc: "El Guerrero es el pilar de cualquier grupo. Adiestrado en las artes de la guerra desde su juventud, su capacidad para infligir daño físico y resistir los ataques más brutales lo convierte en un combatiente temido.", info: "Atacante robusto." },
    "Enano": { vida: 7, atk: 2, def: 2, icono: "⛏️", desc: "Descendiente de las antiguas estirpes de las montañas, el Enano es un experto en el arte de la exploración. Posee una habilidad innata para detectar trampas y puertas secretas.", info: "Especialista en trampas." },
    "Elfo": { vida: 6, atk: 2, def: 2, icono: "🏹", desc: "Un guerrero de gracia sobrenatural, el Elfo es un maestro de la agilidad. Capaz de realizar movimientos rápidos y precisos, puede alcanzar a sus enemigos antes de que estos logren reaccionar.", info: "Rápido y equilibrado." },
    "Mago": { vida: 4, atk: 1, def: 2, icono: "🧙", desc: "Aunque su fragilidad física es evidente, el Mago es el poseedor de los secretos arcanos. Su sabiduría y sus poderosos conjuros pueden alterar el curso de la batalla en un instante.", info: "Maestro arcano." }
};

function renderizarDados(cantidad) { return `<span class="dice-icon">${'🎲'.repeat(cantidad)}</span>`; }

// --- Inicialización del Selector ---
const selector = document.getElementById('selector');
for (let nombre in HEROES) {
    let h = HEROES[nombre];
    let div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h2>${h.icono} ${nombre}</h2><div class="stats-container"><span>Atk: ${renderizarDados(h.atk)}</span><span>Def: ${renderizarDados(h.def)}</span></div><div class="desc">${h.desc}</div>`;
    div.onclick = () => iniciarJuego(nombre);
    selector.appendChild(div);
}

// --- Lógica del Juego ---
let heroe, FILAS = 19, COLS = 26;
let mapa = Array.from({ length: FILAS }, () => Array(COLS).fill(1));
let explorado = Array.from({ length: FILAS }, () => Array(COLS).fill(false));
let enemigos = [{nombre: "Orco", vida: 2, atk: 3, def: 1, icono: "👹", x: 4, y: 4, vivo: true}];

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

// Función auxiliar: Devuelve true si hay un enemigo vivo en esa coordenada
function hayEnemigoEn(x, y) {
    return enemigos.find(en => en.vivo && en.x === x && en.y === y);
}

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
                // Dibujar enemigo si está vivo
                let en = hayEnemigoEn(f, c);
                if (en) el.innerText = en.icono;
            }
            if (f === heroe.x && c === heroe.y) el.innerText = heroe.icono;
            tablero.appendChild(el);
        }
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
    
    // Habilitar botón de ataque si hay un enemigo ADYACENTE
    let adyacente = enemigos.find(en => en.vivo && Math.abs(en.x - heroe.x) <= 1 && Math.abs(en.y - heroe.y) <= 1 && !(en.x === heroe.x && en.y === heroe.y));
    document.getElementById('btn-atk').disabled = !adyacente;
}

function atacarEnemigo() {
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

function tirarDadosMovimiento() {
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    document.getElementById('btn-mov').disabled = true;
    dibujar();
}

window.addEventListener('keydown', (e) => {
    if(heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    // Verificación de movimiento: Debe estar dentro de límites, no ser muro Y no haber enemigo
    if(nx>=0 && nx<FILAS && ny>=0 && ny<COLS && mapa[nx][ny] === 0 && !hayEnemigoEn(nx, ny)) {
        heroe.x = nx; heroe.y = ny; heroe.mov--; dibujar();
    }
    
    if(heroe.mov === 0) document.getElementById('btn-mov').disabled = false;
});
