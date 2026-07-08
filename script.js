const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icon: "🛡️", desc: "Un formidable campeón de primera línea entrenado en el arte del acero puro y la resistencia." },
    "Enano": { vida: 7, atk: 2, def: 2, icon: "⛏️", desc: "Robusto excavador de túneles capaz de desactivar trampas ocultas y soportar duros castigos." },
    "Elfo": { vida: 6, atk: 2, def: 2, icon: "🏹", desc: "Ágil guardián de los bosques que combina destreza física con sutiles conocimientos mágicos." },
    "Mago": { vida: 4, atk: 1, def: 2, icon: "🧙", desc: "Erudito de las artes arcanas; físicamente muy frágil pero poseedor de una mente brillante." }
};

const BESTIARIO = [
    { nombre: "Orco", vida: 2, atk: 3, def: 2, mov: 5, icon: "👹" },
    { nombre: "Goblin", vida: 1, atk: 2, def: 1, mov: 6, icon: "👺" },
    { nombre: "Fimir", vida: 3, atk: 3, def: 3, mov: 4, icon: "🦎" }
];

let mapa = [];
let explorado = [];
let enemigos = [];
let heroe = null;
let turno = "jugador";
let salasGeneradas = [];
let haAtacadoEsteTurno = false;

document.addEventListener('DOMContentLoaded', () => {
    const selectorContenedor = document.getElementById('selector');
    Object.keys(HEROES).forEach(clase => {
        let h = HEROES[clase];
        
        let dadosAtaque = "🎲".repeat(h.atk);
        let dadosDefensa = "🎲".repeat(h.def);
        
        let card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <div class="card-icono">${h.icon}</div>
                <h3>${clase}</h3>
                <p class="card-desc">"${h.desc}"</p>
            </div>
            <div class="card-atributos">
                <div class="card-attr-item">
                    <span>❤️ Puntos de Vida:</span>
                    <span class="attr-vida">${h.vida}</span>
                </div>
                <div class="card-attr-item">
                    <span>⚔️ Ataque:</span>
                    <span class="attr-dados">${dadosAtaque}</span>
                </div>
                <div class="card-attr-item">
                    <span>🛡️ Defensa:</span>
                    <span class="attr-dados">${dadosDefensa}</span>
                </div>
            </div>
        `;
        card.onclick = () => iniciarPartida(clase);
        selectorContenedor.appendChild(card);
    });
});

function iniciarPartida(claseElegida) {
    crearMazmorraProcedural();
    explorado = Array.from({ length: 19 }, () => Array(26).fill(false));
    
    // El héroe siempre aparece en la primera sala, que ahora es la pequeña.
    let primeraSala = salasGeneradas[0];
    let puntoCentralX = Math.floor(primeraSala.x + primeraSala.h / 2);
    let puntoCentralY = Math.floor(primeraSala.y + primeraSala.w / 2);
    
    heroe = { nombre: claseElegida, ...HEROES[claseElegida], x: puntoCentralX, y: puntoCentralY, mov: 0 };
    generarMonstruosEnSalas();
    
    document.getElementById('log-combate').innerHTML = '';
    document.getElementById('resultado-dados-pantalla').innerHTML = 'Esperando que comience la batalla...';
    document.getElementById('btn-dados').disabled = false;
    
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('pantalla-muerte').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = heroe.nombre;
    document.getElementById('desc-heroe').innerText = heroe.desc;
    
    turno = "jugador";
    haAtacadoEsteTurno = false;
    log("¡Has aparecido en una sala segura de la mazmorra! Lanza los dados de movimiento.", "log-sistema");
    dibujarTablero();
}

function crearMazmorraProcedural() {
    mapa = Array.from({ length: 19 }, () => Array(26).fill(1)); 
    salasGeneradas = [];

    // --- SALA INICIAL (Sala 0) ---
    // Siempre será una habitación pequeña (3x3) y sin monstruos
    let anchoInicio = 3;
    let altoInicio = 3;
    let posXInicio = Math.floor(Math.random() * (19 - altoInicio - 2)) + 1;
    let posYInicio = Math.floor(Math.random() * (26 - anchoInicio - 2)) + 1;

    for (let r = posXInicio; r < posXInicio + altoInicio; r++) {
        for (let c = posYInicio; c < posYInicio + anchoInicio; c++) {
            mapa[r][c] = 0; // 0 significa suelo transitable
        }
    }
    salasGeneradas.push({ x: posXInicio, y: posYInicio, w: anchoInicio, h: altoInicio });

    // --- RESTO DE LAS SALAS ---
    // Generamos otras 4 salas más grandes
    for (let i = 0; i < 4; i++) {
        let anchoSala = Math.floor(Math.random() * 4) + 4; // Tamaño entre 4 y 7
        let altoSala = Math.floor(Math.random() * 4) + 4;  // Tamaño entre 4 y 7
        let posRowX = Math.floor(Math.random() * (19 - altoSala - 2)) + 1;
        let posColY = Math.floor(Math.random() * (26 - anchoSala - 2)) + 1;

        for (let r = posRowX; r < posRowX + altoSala; r++) {
            for (let c = posColY; c < posColY + anchoSala; c++) {
                mapa[r][c] = 0;
            }
        }
        salasGeneradas.push({ x: posRowX, y: posColY, w: anchoSala, h: altoSala });
    }

    // --- CONECTAR SALAS ---
    for (let i = 0; i < salasGeneradas.length - 1; i++) {
        let actual = salasGeneradas[i];
        let siguiente = salasGeneradas[i + 1];

        let startX = Math.floor(actual.x + actual.h / 2);
        let startY = Math.floor(actual.y + actual.w / 2);
        let endX = Math.floor(siguiente.x + siguiente.h / 2);
        let endY = Math.floor(siguiente.y + siguiente.w / 2);

        let horizontalStart = Math.min(startY, endY);
        let horizontalEnd = Math.max(startY, endY);
        for (let c = horizontalStart; c <= horizontalEnd; c++) {
            if (mapa[startX][c] === 1 && (mapa[startX][c-1] === 0 || mapa[startX][c+1] === 0)) {
                mapa[startX][c] = 2; // Puerta
            } else if (mapa[startX][c] === 1) {
                mapa[startX][c] = 0; // Pasillo
            }
        }

        let verticalStart = Math.min(startX, endX);
        let verticalEnd = Math.max(startX, endX);
        for (let r = verticalStart; r <= verticalEnd; r++) {
            if (mapa[r][endY] === 1 && (mapa[r-1][endY] === 0 || mapa[r+1][endY] === 0)) {
                mapa[r][endY] = 2; // Puerta
            } else if (mapa[r][endY] === 1) {
                mapa[r][endY] = 0; // Pasillo
            }
        }
    }
}

function generarMonstruosEnSalas() {
    enemigos = [];
    
    // Bucle que empieza en 1 (Ignora la sala 0 que es donde spawnea el héroe)
    for (let i = 1; i < salasGeneradas.length; i++) {
        let sala = salasGeneradas[i];
        
        // Coloca entre 1 y 3 enemigos por sala desde que se genera el mapa
        let cantidadMonstruos = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < cantidadMonstruos; j++) {
            let plantillaMonstruo = BESTIARIO[Math.floor(Math.random() * BESTIARIO.length)];
            
            // Elegir coordenadas aleatorias estrictamente dentro de la sala
            let mX = sala.x + Math.floor(Math.random() * sala.h);
            let mY = sala.y + Math.floor(Math.random() * sala.w);
            
            // Verificar que la casilla es suelo (0) y no hay otro monstruo allí ya colocado
            let casillaOcupada = enemigos.some(e => e.x === mX && e.y === mY && e.vivo);
            
            if (!casillaOcupada && mapa[mX][mY] === 0) {
                enemigos.push({
                    nombre: plantillaMonstruo.nombre,
                    vida: plantillaMonstruo.vida,
                    atk: plantillaMonstruo.atk,
                    def: plantillaMonstruo.def,
                    mov: plantillaMonstruo.mov,
                    icon: plantillaMonstruo.icon,
                    x: mX,
                    y: mY,
                    vivo: true
                });
            }
        }
    }
}

function dibujarTablero() {
    const contenedorTablero = document.getElementById('tablero'); 
    contenedorTablero.innerHTML = '';
    
    for (let f = 0; f < 19; f++) {
        for (let c = 0; c < 26; c++) {
            if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) {
                explorado[f][c] = true;
            }
        }
    }

    for (let f = 0; f < 19; f++) {
        for (let c = 0; c < 26; c++) {
            let elementoDiv = document.createElement('div');
            
            if (!explorado[f][c]) {
                elementoDiv.className = 'casilla oscuridad';
            } else {
                elementoDiv.className = 'casilla visible';
                
                if (mapa[f][c] === 1) { elementoDiv.classList.add('muro'); }
                if (mapa[f][c] === 2) { elementoDiv.classList.add('puerta'); }
                
                if (f === heroe.x && c === heroe.y) {
                    elementoDiv.innerText = heroe.icon;
                } else {
                    let en = enemigos.find(e => e.vivo && e.x === f && e.y === c);
                    if (en) {
                        elementoDiv.innerText = `${en.icon}${en.vida}`;
                        elementoDiv.style.fontSize = "12px";
                        elementoDiv.style.fontWeight = "bold";
                        elementoDiv.style.color = "#ff3333";
                    }
                }
            }
            contenedorTablero.appendChild(elementoDiv);
        }
    }
    
    let vidaMostrada = heroe.vida > 0 ? heroe.vida : 0;
    document.getElementById('vida-heroe').innerText = vidaMostrada;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

function tirarDados() {
    if (turno !== "jugador") return;
    if (heroe.mov > 0) return;
    
    let dado1 = Math.floor(Math.random() * 6) + 1;
    let dado2 = Math.floor(Math.random() * 6) + 1;
    heroe.mov = dado1 + dado2;
    
    log(`Lanzaste dados de movimiento: [${dado1}] + [${dado2}] = ${heroe.mov}`, "log-sistema");
    document.getElementById('btn-dados').disabled = true;
    dibujarTablero();
}

function lanzarDadosCombate(cantidadDados, probabilidadExito) {
    let exitos = 0;
    for (let i = 0; i < cantidadDados; i++) {
        if (Math.random() <= probabilidadExito) {
            exitos++;
        }
    }
    return exitos;
}

function atacarEnemigoAdyacente() {
    const panelCombate = document.getElementById('resultado-dados-pantalla');

    if (turno !== "jugador") {
        panelCombate.innerHTML = `<span style="color: #ff3333;">❌ No es tu turno de acción.</span>`;
        return;
    }
    if (haAtacadoEsteTurno) {
        panelCombate.innerHTML = `<span style="color: #ffaa00;">⚠️ Ya has atacado en este turno.</span>`;
        return;
    }

    let enemigoObjetivo = enemigos.find(e => 
        e.vivo && 
        Math.abs(e.x - heroe.x) + Math.abs(e.y - heroe.y) === 1
    );

    if (!enemigoObjetivo) {
        panelCombate.innerHTML = `
            <span style="color: #ff3333;">❌ No hay ningún enemigo al lado.</span><br>
            <small style="color: #aaa;">Pégate a un monstruo (arriba, abajo o lados). ¡Las diagonales no cuentan!</small>
        `;
        return;
    }

    ejecutarAtaqueJugador(enemigoObjetivo);
}

function ejecutarAtaqueJugador(objetivo) {
    haAtacadoEsteTurno = true;
    
    let calaveras = lanzarDadosCombate(heroe.atk, 0.50);
    let escudos = lanzarDadosCombate(objetivo.def, 0.166);
    let dañoNeto = calaveras - escudos;
    
    let mensajeResultado = "";
    if (dañoNeto > 0) {
        objetivo.vida -= dañoNeto;
        mensajeResultado = `💥 ¡Le diste! Infliges <span style="color:#ff3333; font-size:1.2em;">${dañoNeto}</span> de daño.`;
        log(`Atacas al ${objetivo.nombre}: ${calaveras} 💀 vs ${escudos} 🛡️. Daño: ${dañoNeto}`, "log-ataque");
        
        if (objetivo.vida <= 0) {
            objetivo.vivo = false;
            mensajeResultado += `<br><span style="color:#ff0000; font-weight:bold;">☠️ ¡${objetivo.nombre} ha sido destruido!</span>`;
            log(`¡El ${objetivo.nombre} ha muerto!`, "log-muerte");
        }
    } else {
        mensajeResultado = `🛡️ El ${objetivo.nombre} bloqueó tu ataque por completo.`;
        log(`Atacas al ${objetivo.nombre}: ${calaveras} 💀 vs ${escudos} 🛡️. ¡Bloqueado!`, "log-defensa");
    }

    document.getElementById('resultado-dados-pantalla').innerHTML = `
        <strong style="color: #ffaa00;">⚔️ Tu Ataque contra ${objetivo.nombre}:</strong><br>
        Tu Ofensiva: ${calaveras} 💀 | Su Defensa: ${escudos} 🛡️<br>
        ${mensajeResultado}
    `;

    dibujarTablero();
}

function finalizarTurno() {
    if (turno !== "jugador") return;
    turno = "enemigo";
    
    log("--- Turno de los Monstruos ---", "log-sistema");
    const panelCombate = document.getElementById('resultado-dados-pantalla');
    panelCombate.innerHTML = `<span style="color: #ff3333; font-weight:bold;">⚠️ ¡LOS MONSTRUOS SE MUEVEN Y ATACAN! ⚠️</span>`;

    enemigos.forEach(monstruo => {
        if (!monstruo.vivo) return;
        if (heroe.vida <= 0) return; 

        let pasos = 0;
        while (pasos < monstruo.mov) {
            let dist = Math.abs(heroe.x - monstruo.x) + Math.abs(heroe.y - monstruo.y);
            
            if (dist === 1) {
                ejecutarAtaqueEnemigo(monstruo);
                break;
            }

            let dirX = Math.sign(heroe.x - monstruo.x);
            let dirY = Math.sign(heroe.y - monstruo.y);

            if (dirX !== 0 && mapa[monstruo.x + dirX][monstruo.y] === 0) {
                monstruo.x += dirX;
            } else if (dirY !== 0 && mapa[monstruo.x][monstruo.y + dirY] === 0) {
                monstruo.y += dirY;
            } else {
                break; 
            }
            pasos++;
        }

        if (heroe.vida > 0 && Math.abs(heroe.x - monstruo.x) + Math.abs(heroe.y - monstruo.y) === 1) {
            ejecutarAtaqueEnemigo(monstruo);
        }
    });

    if (heroe.vida > 0) {
        turno = "jugador";
        heroe.mov = 0;
        haAtacadoEsteTurno = false;
        document.getElementById('btn-dados').disabled = false;
        log("--- Tu Turno. Lanza dados para moverte ---", "log-sistema");
        dibujarTablero();
    }
}

function ejecutarAtaqueEnemigo(monstruo) {
    let calaveras = lanzarDadosCombate(monstruo.atk, 0.50);
    let escudos = lanzarDadosCombate(heroe.def, 0.333);
    let dañoNeto = calaveras - escudos;

    let mensajeEnemigo = "";
    if (dañoNeto > 0) {
        heroe.vida -= dañoNeto;
        mensajeEnemigo = `🩸 El ${monstruo.nombre} te inflige <span style="color:red; font-weight:bold;">${dañoNeto}</span> de daño.`;
        log(`¡${monstruo.nombre} te ataca!: ${calaveras} 💀 vs ${escudos} 🛡️. Recibes ${dañoNeto} daño.`, "log-defensa");
        
        if (heroe.vida <= 0) {
            log("💀 ¡Has muerto! Fin de la partida.", "log-muerte");
            turno = "muerto";
            dibujarTablero(); 
            
            setTimeout(() => {
                document.getElementById('juego-contenedor').style.display = 'none';
                document.getElementById('pantalla-muerte').style.display = 'flex';
            }, 1500);
        }
    } else {
        mensajeEnemigo = `🛡️ Bloqueaste el ataque del ${monstruo.nombre}.`;
        log(`¡${monstruo.nombre} te ataca!: ${calaveras} 💀 vs ${escudos} 🛡️. ¡Lo detuviste!`, "log-ataque");
    }

    document.getElementById('resultado-dados-pantalla').innerHTML = `
        <strong style="color: #ff3333;">👹 ¡Asalto de ${monstruo.nombre}!</strong><br>
        Su Ataque: ${calaveras} 💀 | Tu Defensa: ${escudos} 🛡️<br>
        ${mensajeEnemigo}
    `;
}

function volverAlMenu() {
    document.getElementById('pantalla-muerte').style.display = 'none';
    document.getElementById('pantalla-seleccion').style.display = 'block';
}

function log(mensaje, claseEstilo) {
    const contenedorLog = document.getElementById('log-combate');
    contenedorLog.innerHTML += `<div class="${claseEstilo}">${mensaje}</div>`;
    contenedorLog.scrollTop = contenedorLog.scrollHeight;
}

window.addEventListener('keydown', (e) => {
    if (turno !== "jugador") return;
    if (heroe.mov <= 0) return; 
    
    let objetivoX = heroe.x;
    let objetivoY = heroe.y;
    
    if (e.key === 'ArrowUp') { objetivoX--; } 
    if (e.key === 'ArrowDown') { objetivoX++; }
    if (e.key === 'ArrowLeft') { objetivoY--; } 
    if (e.key === 'ArrowRight') { objetivoY++; }
    
    if (objetivoX === heroe.x && objetivoY === heroe.y) return;

    let hayMonstruoEnCamino = enemigos.find(en => en.vivo && en.x === objetivoX && en.y === objetivoY);
    if (hayMonstruoEnCamino) {
        document.getElementById('resultado-dados-pantalla').innerHTML = `
            <span style="color: #ffff00;">⚠️ Casilla Ocupada</span><br>
            El ${hayMonstruoEnCamino.nombre} tapa el paso. ¡Usa el botón de atacar!
        `;
        return;
    }

    if (mapa[objetivoX][objetivoY] === 2) { 
        mapa[objetivoX][objetivoY] = 0; 
        heroe.mov--;
        log("Abriste una puerta de madera.", "log-sistema");
        dibujarTablero();
    } else if (mapa[objetivoX][objetivoY] === 0) { 
        heroe.x = objetivoX; 
        heroe.y = objetivoY; 
        heroe.mov--;
        dibujarTablero();
    }
});
