const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icon: "🛡️", desc: "Ataca con 3 dados y defiende con 2." },
    "Enano": { vida: 7, atk: 2, def: 2, icon: "⛏️", desc: "Resistente y equilibrado en combate." },
    "Elfo": { vida: 6, atk: 2, def: 2, icon: "🏹", desc: "Ágil combatiente de la naturaleza." },
    "Mago": { vida: 4, atk: 1, def: 2, icon: "🧙", desc: "Físicamente débil pero sabio." }
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
        let card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${HEROES[clase].icon} ${clase}</h3><p>${HEROES[clase].desc}</p>`;
        card.onclick = () => iniciarPartida(clase);
        selectorContenedor.appendChild(card);
    });
});

function iniciarPartida(claseElegida) {
    crearMazmorraProcedural();
    explorado = Array.from({ length: 19 }, () => Array(26).fill(false));
    
    let primeraSala = salasGeneradas[0];
    let puntoCentralX = Math.floor(primeraSala.x + primeraSala.h / 2);
    let puntoCentralY = Math.floor(primeraSala.y + primeraSala.w / 2);
    
    heroe = { nombre: claseElegida, ...HEROES[claseElegida], x: puntoCentralX, y: puntoCentralY, mov: 0 };
    generarMonstruosEnSalas();
    
    // Limpiar pantallas y logs de partidas anteriores
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
    log("¡Entraste a la mazmorra! Lanza los dados de movimiento.", "log-sistema");
    dibujarTablero();
}

function crearMazmorraProcedural() {
    mapa = Array.from({ length: 19 }, () => Array(26).fill(1)); 
    salasGeneradas = [];

    for (let i = 0; i < 4; i++) {
        let anchoSala = Math.floor(Math.random() * 3) + 4; 
        let altoSala = Math.floor(Math.random() * 3) + 4;  
        let posRowX = Math.floor(Math.random() * (19 - altoSala - 2)) + 1;
        let posColY = Math.floor(Math.random() * (26 - anchoSala - 2)) + 1;

        for (let r = posRowX; r < posRowX + altoSala; r++) {
            for (let c = posColY; c < posColY + anchoSala; c++) {
                mapa[r][c] = 0;
            }
        }
        salasGeneradas.push({ x: posRowX, y: posColY, w: anchoSala, h: altoSala });
    }

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
                mapa[startX][c] = 2;
            } else if (mapa[startX][c] === 1) {
                mapa[startX][c] = 0;
            }
        }

        let verticalStart = Math.min(startX, endX);
        let verticalEnd = Math.max(startX, endX);
        for (let r = verticalStart; r <= verticalEnd; r++) {
            if (mapa[r][endY] === 1 && (mapa[r-1][endY] === 0 || mapa[r+1][endY] === 0)) {
                mapa[r][endY] = 2;
            } else if (mapa[r][endY] === 1) {
                mapa[r][endY] = 0;
            }
        }
    }
}

function generarMonstruosEnSalas() {
    enemigos = [];
    for (let i = 1; i < salasGeneradas.length; i++) {
        let sala = salasGeneradas[i];
        let plantillaMonstruo = BESTIARIO[Math.floor(Math.random() * BESTIARIO.length)];
        
        enemigos.push({
            nombre: plantillaMonstruo.nombre,
            vida: plantillaMonstruo.vida,
            atk: plantillaMonstruo.atk,
            def: plantillaMonstruo.def,
            mov: plantillaMonstruo.mov,
            icon: plantillaMonstruo.icon,
            x: sala.x + 1,
            y: sala.y + 1,
            vivo: true
        });
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
    
    // Evitar mostrar vida en negativo
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
        // Evitamos que los monstruos ataquen si el héroe ya ha muerto este turno
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

    // Si el héroe sobrevive al turno enemigo
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
        
        // Comprobar muerte del jugador
        if (heroe.vida <= 0) {
            log("💀 ¡Has muerto! Fin de la partida.", "log-muerte");
            turno = "muerto";
            dibujarTablero(); // Actualiza el 0 en la vida visualmente
            
            // Ligerísima pausa de 1.5s para ver el impacto antes del fundido a rojo
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

// Nueva función invocada por el botón de la Pantalla de Muerte
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
