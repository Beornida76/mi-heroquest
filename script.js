const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icon: "🛡️", desc: "Gran combatiente físico." },
    "Enano": { vida: 7, atk: 2, def: 2, icon: "⛏️", desc: "Resistente, experto en detectar trampas." }
};

const BESTIARIO = {
    "Orco": { vida: 2, atk: 3, def: 2, mov: 8, icon: "👹" }
};

let mapa = [], explorado = [], enemigos = [], heroe = null, turno = "jugador";

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
    crearMapaCompleto();
    explorado = Array.from({ length: 19 }, () => Array(26).fill(false));
    heroe = { nombre, ...HEROES[nombre], x: 2, y: 2, mov: 0 };
    enemigos = [{ ...BESTIARIO["Orco"], x: 10, y: 10, vivo: true }];
    
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = nombre;
    dibujar();
}

function crearMapaCompleto() {
    mapa = Array.from({ length: 19 }, () => Array(26).fill(1)); // Todo muros
    // Sala 1
    for(let r=1; r<6; r++) for(let c=1; c<6; c++) mapa[r][c] = 0;
    // Sala 2
    for(let r=8; r<13; r++) for(let c=8; c<13; c++) mapa[r][c] = 0;
    // Pasillo conector
    for(let i=5; i<9; i++) mapa[i][6] = 0;
    // Puertas
    mapa[5][6] = 2; mapa[8][6] = 2;
}

function dibujar() {
    const tab = document.getElementById('tablero'); 
    tab.innerHTML = '';
    
    for(let f=0; f<19; f++) {
        for(let c=0; c<26; c++) {
            // Lógica Niebla de Guerra
            if(Math.abs(heroe.x-f)<=2 && Math.abs(heroe.y-c)<=2) explorado[f][c] = true;
            
            let div = document.createElement('div');
            
            // 1. Aplicamos clase de visibilidad
            if (!explorado[f][c]) {
                div.className = 'casilla oscuridad';
            } else {
                div.className = 'casilla visible';
                
                // 2. Aplicamos terreno si es visible
                if(mapa[f][c] === 1) div.classList.add('muro');
                if(mapa[f][c] === 2) div.classList.add('puerta');
                
                // 3. Dibujamos personajes
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

// --- LÓGICA ---
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
        let dx = Math.sign(heroe.x - en.x);
        let dy = Math.sign(heroe.y - en.y);
        if(mapa[en.x+dx][en.y] === 0) en.x += dx;
        else if(mapa[en.x][en.y+dy] === 0) en.y += dy;
        
        if(Math.abs(heroe.x-en.x)<=1 && Math.abs(heroe.y-en.y)<=1) {
            heroe.vida--;
            log("¡Orco te ataca!");
        }
    });
    turno = "jugador";
    heroe.mov = 0;
    dibujar();
}

function log(msg) {
    document.getElementById('log-combate').innerHTML += `<div>${msg}</div>`;
}

window.addEventListener('keydown', (e) => {
    if(turno !== "jugador" || heroe.mov <= 0) return;
    let nx = heroe.x, ny = heroe.y;
    if(e.key === 'ArrowUp') nx--; if(e.key === 'ArrowDown') nx++;
    if(e.key === 'ArrowLeft') ny--; if(e.key === 'ArrowRight') ny++;
    
    let en = enemigos.find(e => e.vivo && e.x === nx && e.y === ny);
    if(en) {
        en.vida--;
        log("Atacas al enemigo");
        if(en.vida <= 0) { en.vivo = false; log("¡Enemigo derrotado!"); }
        heroe.mov--;
    } else if(mapa[nx][ny] === 2) { 
        mapa[nx][ny] = 0; log("Puerta abierta"); heroe.mov--; 
    } else if(mapa[nx][ny] === 0) {
        heroe.x = nx; heroe.y = ny; heroe.mov--;
    }
    dibujar();
});
