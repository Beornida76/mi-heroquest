const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icon: "🛡️", desc: "Gran combatiente físico." },
    "Enano": { vida: 7, atk: 2, def: 2, icon: "⛏️", desc: "Resistente, experto en detectar trampas." }
};

const BESTIARIO = [
    { nombre: "Orco", vida: 2, atk: 3, def: 2, mov: 8, icon: "👹" },
    { nombre: "Goblin", vida: 1, atk: 2, def: 1, mov: 10, icon: "👺" },
    { nombre: "Fimir", vida: 3, atk: 3, def: 3, mov: 6, icon: "🦎" }
];

let mapa = [], explorado = [], enemigos = [], heroe = null, turno = "jugador";
let salasGeneradas = []; // Guardamos las salas para saber dónde spawnear

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const sel = document.getElementById('selector');
    Object.keys(HEROES).forEach(key => {
        let div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<h3>${HEROES[key].icon} ${key}</h3><p>${HEROES[key].desc}</p>`;
        div.onclick = () => iniciarJuego(key);
        sel.appendChild(div);
    });
});

function iniciarJuego(nombre) {
    crearMapaAleatorio();
    explorado = Array.from({ length: 19 }, () => Array(26).fill(false));
    
    // Spawn Héroe en la primera sala
    let salaHeroe = salasGeneradas[0];
    heroe = { nombre, ...HEROES[nombre], x: salaHeroe.x + 1, y: salaHeroe.y + 1, mov: 0 };
    
    // Spawn Enemigos en otras salas
    spawnEnemigos();
    
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = nombre;
    dibujar();
}

// Generador procedural de habitaciones
function crearMapaAleatorio() {
    mapa = Array.from({ length: 19 }, () => Array(26).fill(1)); // Todo muros
    salasGeneradas = [];

    // Crear 4 salas aleatorias
    for(let i=0; i<4; i++) {
        let w = Math.floor(Math.random()*4) + 3; // Ancho 3-6
        let h = Math.floor(Math.random()*4) + 3; // Alto 3-6
        let x = Math.floor(Math.random()*(19-h-2)) + 1;
        let y = Math.floor(Math.random()*(26-w-2)) + 1;

        // Tallar sala
        for(let r=x; r<x+h; r++) for(let c=y; c<y+w; c++) mapa[r][c] = 0;
        salasGeneradas.push({x, y, w, h});
    }

    // Conectar salas con pasillos simples
    for(let i=0; i < salasGeneradas.length - 1; i++) {
        let s1 = salasGeneradas[i];
        let s2 = salasGeneradas[i+1];
        // Línea horizontal
        for(let c = Math.min(s1.y, s2.y); c <= Math.max(s1.y, s2.y); c++) mapa[s1.x][c] = 0;
        // Línea vertical
        for(let r = Math.min(s1.x, s2.x); r <= Math.max(s1.x, s2.x); r++) mapa[r][s2.y] = 0;
    }
}

function spawnEnemigos() {
    enemigos = [];
    // Ponemos un enemigo en cada sala que no sea la primera (donde está el héroe)
    for(let i=1; i < salasGeneradas.length; i++) {
        let sala = salasGeneradas[i];
        let tipo = BESTIARIO[Math.floor(Math.random() * BESTIARIO.length)];
        enemigos.push({
            ...tipo,
            x: sala.x + Math.floor(Math.random() * sala.h),
            y: sala.y + Math.floor(Math.random() * sala.w),
            vivo: true
        });
    }
}

function dibujar() {
    const tab = document.getElementById('tablero'); 
    tab.innerHTML = '';
    
    for(let f=0; f<19; f++) {
        for(let c=0; c<26; c++) {
            if(Math.abs(heroe.x-f)<=2 && Math.abs(heroe.y-c)<=2) explorado[f][c] = true;
            
            let div = document.createElement('div');
            if (!explorado[f][c]) {
                div.className = 'casilla oscuridad';
            } else {
                div.className = 'casilla visible';
                if(mapa[f][c] === 1) div.classList.add('muro');
                // Dibujar entidades
                if(f === heroe.x && c === heroe.y) {
                    div.innerText = heroe.icon;
                } else {
                    let en = enemigos.find(e => e.vivo && e.x === f && e.y === c);
                    if(en) div.innerText = en.icon;
                }
            }
            tab.appendChild(div);
        }
    }
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

// --- LÓGICA DE TURNO ---
function tirarDados() {
    if(turno !== "jugador") return;
    heroe.mov = Math.floor(Math.random()*6) + Math.floor(Math.random()*6) + 2;
    dibujar();
}

function finalizarTurno() {
    turno = "enemigo";
    log("Turno Enemigo...");
    enemigos.forEach(en => {
        if(!en.vivo) return;
        // IA muy básica: Moverse hacia el jugador si está cerca
        let dx = Math.sign(heroe.x - en.x);
        let dy = Math.sign(heroe.y - en.y);
        
        // Comprobar colisiones antes de mover
        if(mapa[en.x+dx][en.y] === 0) en.x += dx;
        else if(mapa[en.x][en.y+dy] === 0) en.y += dy;
        
        if(Math.abs(heroe.x-en.x)<=1 && Math.abs(heroe.y-en.y)<=1) {
            heroe.vida--;
            log(`¡Un ${en.nombre} te ataca!`);
        }
    });
    turno = "jugador";
    heroe.mov = 0;
    dibujar();
}

function log(msg) {
    const logBox = document.getElementById('log-combate');
    logBox.innerHTML += `<div>${msg}</div>`;
    logBox.scrollTop = logBox.scrollHeight;
}

window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    let en = enemigos.find(e => e.vivo && e.x === nx && e.y === ny);
    if(en) {
        en.vida--;
        log(`Atacas al ${en.nombre}`);
        if(en.vida <= 0) { en.vivo = false; log(`¡${en.nombre} derrotado!`); }
        heroe.mov--;
    } else if(mapa[nx][ny] === 0) {
        heroe.x = nx; heroe.y = ny; heroe.mov--;
    }
    dibujar();
});
