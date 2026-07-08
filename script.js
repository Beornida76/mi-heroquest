// --- CONFIGURACIÓN DE ATRIBUTOS HISTÓRICOS DE HEROQUEST ---
const HEROES = {
    "Guerrero": { vida: 8, atk: 3, def: 2, icon: "🛡️", desc: "Gran combatiente físico. Ataca con 3 dados y defiende con 2." },
    "Enano": { vida: 7, atk: 2, def: 2, icon: "⛏️", desc: "Resistente y equilibrado. Capaz de desactivar trampas latentes." },
    "Elfo": { vida: 6, atk: 2, def: 2, icon: "🏹", desc: "Ágil combatiente que domina tanto el acero como la magia básica." },
    "Mago": { vida: 4, atk: 1, def: 2, icon: "🧙", desc: "Físicamente débil pero conocedor de poderosos hechizos destructivos." }
};

const BESTIARIO = [
    { nombre: "Orco", vida: 2, atk: 3, def: 2, mov: 8, icon: "👹" },
    { nombre: "Goblin", vida: 1, atk: 2, def: 1, mov: 10, icon: "👺" },
    { nombre: "Fimir", vida: 3, atk: 3, def: 3, mov: 6, icon: "🦎" }
];

// --- VARIABLES GLOBALES DEL MOTOR DEL JUEGO ---
let mapa = [];
let explorado = [];
let enemigos = [];
let heroe = null;
let turno = "jugador";
let salasGeneradas = [];
let haAtacadoEsteTurno = false; // El héroe solo puede realizar una acción de ataque por turno

// --- ENTRADA DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const selectorContenedor = document.getElementById('selector');
    
    // Inyectar las tarjetas de selección de personaje de forma dinámica
    Object.keys(HEROES).forEach(clase => {
        let card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${HEROES[clase].icon} ${clase}</h3>
            <p>${HEROES[clase].desc}</p>
        `;
        card.onclick = () => iniciarPartida(clase);
        selectorContenedor.appendChild(card);
    });
});

// --- INICIACIÓN DEL JUEGO ---
function iniciarPartida(claseElegida) {
    crearMazmorraProcedural();
    
    // Inicializar matriz de niebla de guerra (todo inexplorado al principio)
    explorado = Array.from({ length: 19 }, () => Array(26).fill(false));
    
    // Posicionar al héroe en el centro de la primera habitación generada
    let primeraSala = salasGeneradas[0];
    let puntoCentralX = Math.floor(primeraSala.x + primeraSala.h / 2);
    let puntoCentralY = Math.floor(primeraSala.y + primeraSala.w / 2);
    
    heroe = { 
        nombre: claseElegida, 
        ...HEROES[claseElegida], 
        x: puntoCentralX, 
        y: puntoCentralY, 
        mov: 0 
    };
    
    // Colocar monstruos en el resto de habitaciones
    generarMonstruosEnSalas();
    
    // Cambiar pantallas en la interfaz de usuario
    document.getElementById('pantalla-seleccion').style.display = 'none';
    document.getElementById('juego-contenedor').style.display = 'flex';
    document.getElementById('nombre-heroe').innerText = heroe.nombre;
    document.getElementById('desc-heroe').innerText = heroe.desc;
    
    haAtacadoEsteTurno = false;
    log("¡Has entrado a la mazmorra! Tira los dados para empezar a moverte.", "log-sistema");
    
    dibujarTablero();
}

// --- GENERACIÓN PROCEDURAL DE MAPA CON CONEXIONES Y PUERTAS ---
function crearMazmorraProcedural() {
    // 1 representa Muro Macizo, 0 representa Suelo Libre, 2 representa Puerta Cerrada
    mapa = Array.from({ length: 19 }, () => Array(26).fill(1)); 
    salasGeneradas = [];

    // Intentar generar 4 salas de dimensiones aleatorias sin salirse de los límites
    for (let i = 0; i < 4; i++) {
        let anchoSala = Math.floor(Math.random() * 3) + 4; // Ancho entre 4 y 6
        let altoSala = Math.floor(Math.random() * 3) + 4;  // Alto entre 4 y 6
        let posRowX = Math.floor(Math.random() * (19 - altoSala - 2)) + 1;
        let posColY = Math.floor(Math.random() * (26 - anchoSala - 2)) + 1;

        // Escavar el espacio interior de la habitación en la matriz
        for (let r = posRowX; r < posRowX + altoSala; r++) {
            for (let c = posColY; c < posColY + anchoSala; c++) {
                mapa[r][c] = 0;
            }
        }
        salasGeneradas.push({ x: posRowX, y: posColY, w: anchoSala, h: altoSala });
    }

    // Conectar las habitaciones de forma lineal con pasillos e inyectar puertas
    for (let i = 0; i < salasGeneradas.length - 1; i++) {
        let actual = salasGeneradas[i];
        let siguiente = salasGeneradas[i + 1];

        let startX = Math.floor(actual.x + actual.h / 2);
        let startY = Math.floor(actual.y + actual.w / 2);
        let endX = Math.floor(siguiente.x + siguiente.h / 2);
        let endY = Math.floor(siguiente.y + siguiente.w / 2);

        // Crear tramo horizontal del pasillo
        let horizontalStart = Math.min(startY, endY);
        let horizontalEnd = Math.max(startY, endY);
        for (let c = horizontalStart; c <= horizontalEnd; c++) {
            // Si pasamos de un muro a un espacio vacío de sala, ponemos una puerta potencial
            if (mapa[startX][c] === 1 && (mapa[startX][c-1] === 0 || mapa[startX][c+1] === 0)) {
                mapa[startX][c] = 2;
            } else if (mapa[startX][c] === 1) {
                mapa[startX][c] = 0;
            }
        }

        // Crear tramo vertical del pasillo
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

// --- UBICACIÓN DINÁMICA DE ENEMIGOS ---
function generarMonstruosEnSalas() {
    enemigos = [];
    // Colocar un enemigo al azar en cada habitación, omitiendo la primera (donde empieza el héroe)
    for (let i = 1; i < salasGeneradas.length; i++) {
        let sala = salasGeneradas[i];
        let plantillaMonstruo = BESTIARIO[Math.floor(Math.random() * BESTIARIO.length)];
        
        let offsetRow = Math.floor(sala.h / 2);
        let offsetCol = Math.floor(sala.w / 2);

        enemigos.push({
            nombre: plantillaMonstruo.nombre,
            vida: plantillaMonstruo.vida,
            atk: plantillaMonstruo.atk,
            def: plantillaMonstruo.def,
            mov: plantillaMonstruo.mov,
            icon: plantillaMonstruo.icon,
            x: sala.x + offsetRow,
            y: sala.y + offsetCol,
            vivo: true
        });
    }
}

// --- MOTOR GRÁFICO (RENDERIZADO Y NIEBLA) ---
function dibujarTablero() {
    const contenedorTablero = document.getElementById('tablero'); 
    contenedorTablero.innerHTML = '';
    
    // Campo de visión: Actualizar celdas exploradas en un radio cuadrado de 2 casillas
    for (let f = 0; f < 19; f++) {
        for (let c = 0; c < 26; c++) {
            if (Math.abs(heroe.x - f) <= 2 && Math.abs(heroe.y - c) <= 2) {
                explorado[f][c] = true;
            }
        }
    }

    // Dibujar cada celda del tablero basándonos en su estado y visibilidad
    for (let f = 0; f < 19; f++) {
        for (let c = 0; c < 26; c++) {
            let elementoDiv = document.createElement('div');
            
            if (!explorado[f][c]) {
                elementoDiv.className = 'casilla oscuridad';
            } else {
                elementoDiv.className = 'casilla visible';
                
                // Aplicar clases de estilo según la matriz de colisión
                if (mapa[f][c] === 1) { elementoDiv.classList.add('muro'); }
                if (mapa[f][c] === 2) { elementoDiv.classList.add('puerta'); }
                
                // Renderizar iconos de personajes o enemigos prioritariamente sobre el suelo
                if (f === heroe.x && c === heroe.y) {
                    elementoDiv.innerText = heroe.icon;
                } else {
                    let enemigoEnCasilla = enemigos.find(e => e.vivo && e.x === f && e.y === c);
                    if (enemigoEnCasilla) {
                        elementoDiv.innerText = enemigoEnCasilla.icon;
                    }
                }
            }
            contenedorTablero.appendChild(elementoDiv);
        }
    }
    
    // Actualizar elementos HTML informativos del panel lateral
    document.getElementById('vida-heroe').innerText = heroe.vida;
    document.getElementById('mov-heroe').innerText = heroe.mov;
}

// --- SISTEMA DE MOVIMIENTO (DADOS DE MOVIMIENTO) ---
function tirarDados() {
    if (turno !== "jugador") return;
    if (heroe.mov > 0) {
        log("Aún te quedan movimientos por usar.", "log-sistema");
        return;
    }
    
    // Simulación exacta de 2 dados de 6 caras para movimiento de HeroQuest
    let dado1 = Math.floor(Math.random() * 6) + 1;
    let dado2 = Math.floor(Math.random() * 6) + 1;
    heroe.mov = dado1 + dado2;
    
    log(`Has lanzado los dados de movimiento: [${dado1}] + [${dado2}] = Total: ${heroe.mov} casillas.`, "log-sistema");
    document.getElementById('btn-dados').disabled = true;
    dibujarTablero();
}

// --- SISTEMA DE COMBATE HEROQUEST SIMULADO POR DADOS ---
function lanzarDadosCombate(cantidadDados, probabilidadExito) {
    let exitos = 0;
    for (let i = 0; i < cantidadDados; i++) {
        let tiro = Math.random(); // Valor flotante entre 0 y 1
        if (tiro <= probabilidadExito) {
            exitos++;
        }
    }
    return exitos;
}

// ACCIÓN DE ATAQUE INVOCADA POR EL BOTÓN DEL PANEL
function atacarEnemigoAdyacente() {
    if (turno !== "jugador") {
        log("No es tu turno de acción.", "log-sistema");
        return;
    }
    if (haAtacadoEsteTurno) {
        log("Ya has realizado tu ataque en este turno.", "log-sistema");
        return;
    }

    // Buscar si hay algún enemigo vivo a una casilla de distancia (horizontal o vertical)
    let enemigoObjetivo = enemigos.find(e => 
        e.vivo && 
        Math.abs(e.x - heroe.x) + Math.abs(e.y - heroe.y) === 1
    );

    if (!enemigoObjetivo) {
        log("No hay ningún enemigo adyacente al que puedas atacar.", "log-sistema");
        return;
    }

    ejecutarAtaque(enemigoObjetivo);
}

function ejecutarAtaque(objetivo) {
    haAtacadoEsteTurno = true;
    log(`⚔️ ¡Atacas al ${objetivo.nombre}! Lanzando dados de ataque...`, "log-ataque");
    
    // En HeroQuest, el héroe saca calaveras en 3 de las 6 caras del dado (50% de probabilidad)
    let calaverasObtenidas = lanzarDadosCombate(heroe.atk, 0.50);
    log(`-> Ataque: Has obtenido ${calaverasObtenidas} Calaveras 💀`, "log-ataque");

    // Los monstruos se defienden sacando el escudo de monstruo en 1 de las 6 caras (16.66% de probabilidad)
    let escudosObtenidos = lanzarDadosCombate(objetivo.def, 0.166);
    log(`-> Defensa del ${objetivo.nombre}: Obtiene ${escudosObtenidos} Escudos de Monstruo 🛡️`, "log-defensa");

    // El daño neto es la diferencia entre calaveras ofensivas y escudos defensivos
    let dañoInfligido = calaverasObtenidas - escudosObtenidos;
    if (dañoInfligido > 0) {
        objetivo.vida -= dañoInfligido;
        log(`💥 ¡Impacto directo! Infliges ${dañoInfligido} puntos de daño al ${objetivo.nombre}.`, "log-ataque");
        
        if (objetivo.vida <= 0) {
            objetivo.vivo = false;
            log(`💀 ¡Has aniquilado al ${objetivo.nombre}!`, "log-muerte");
        }
    } else {
        log(`🛡️ El ${objetivo.nombre} ha bloqueado por completo tu ataque.`, "log-defensa");
    }

    dibujarTablero();
}

// --- CIERRE DE TURNO Y GESTIÓN DE IA ENEMIGA ---
function finalizarTurno() {
    if (turno !== "jugador") return;
    
    turno = "enemigo";
    log("--- Inicia el Turno de los Monstruos ---", "log-sistema");

    // Procesar las acciones de cada monstruo vivo secuencialmente
    enemigos.forEach(monstruo => {
        if (!monstruo.vivo) return;

        // Verificar si está adyacente para atacar directamente
        let distHoriz = Math.abs(heroe.x - monstruo.x);
        let distVert = Math.abs(heroe.y - monstruo.y);

        if (distHoriz + distVert === 1) {
            ejecutarAtaqueEnemigo(monstruo);
        } else {
            // Inteligencia Artificial básica de aproximación paso a paso
            let pasosDados = 0;
            let maxPasos = monstruo.mov;

            while (pasosDados < maxPasos) {
                let dirX = Math.sign(heroe.x - monstruo.x);
                let dirY = Math.sign(heroe.y - monstruo.y);

                // Volver a verificar cercanía antes de dar un paso
                if (Math.abs(heroe.x - monstruo.x) + Math.abs(heroe.y - monstruo.y) === 1) {
                    ejecutarAtaqueEnemigo(monstruo);
                    break;
                }

                // Los enemigos solo avanzan por casillas transitables descubiertas (suelo = 0). No abren puertas cerradas (2).
                if (dirX !== 0 && mapa[monstruo.x + dirX][monstruo.y] === 0) {
                    monstruo.x += dirX;
                } else if (dirY !== 0 && mapa[monstruo.x][monstruo.y + dirY] === 0) {
                    monstruo.y += dirY;
                } else {
                    break; // Ruta bloqueada por infraestructura, detener movimiento
                }
                pasosDados++;
            }
        }
    });

    // Devolver el turno de juego al usuario humano
    turno = "jugador";
    heroe.mov = 0;
    haAtacadoEsteTurno = false;
    document.getElementById('btn-dados').disabled = false;
    log("--- Es tu turno. Lanza los dados de movimiento ---", "log-sistema");
    dibujarTablero();
}

function ejecutarAtaqueEnemigo(monstruo) {
    log(`👹 ¡El ${monstruo.nombre} te asalta agresivamente!`, "log-defensa");
    
    // Los monstruos atacan y buscan calaveras (50% de probabilidad)
    let calaverasMonstruo = lanzarDadosCombate(monstruo.atk, 0.50);
    log(`-> Ataque Monstruo: Obtiene ${calaverasMonstruo} Calaveras 💀`, "log-defensa");

    // El héroe se defiende sacando escudos de héroe en 2 de las 6 caras (33.33% de probabilidad)
    let escudosHeroe = lanzarDadosCombate(heroe.def, 0.333);
    log(`-> Tu Defensa: Obtienes ${escudosHeroe} Escudos de Héroe 🛡️`, "log-ataque");

    let dañoRecibido = calaverasMonstruo - escudosHeroe;
    if (dañoRecibido > 0) {
        heroe.vida -= dañoRecibido;
        log(`🩸 ¡Te han herido! Pierdes ${dañoRecibido} puntos de vida.`, "log-defensa");
        if (heroe.vida <= 0) {
            log("💀 ¡Has caído derrotado en la profundidad de la mazmorra! Fin del juego.", "log-muerte");
            turno = "muerto";
        }
    } else {
        log("🛡️ ¡Excelente! Logras desviar el golpe sin sufrir heridas.", "log-ataque");
    }
}

// Auxiliar para inyectar textos de colores en el visor de sucesos
function log(mensaje, claseEstilo) {
    const contenedorLog = document.getElementById('log-combate');
    contenedorLog.innerHTML += `<div class="${claseEstilo}">${mensaje}</div>`;
    contenedorLog.scrollTop = contenedorLog.scrollHeight; // Auto-scroll hacia abajo
}

// --- CAPTURA DE TECLADO PARA MOVIMIENTO Y ACCIONES ---
window.addEventListener('keydown', (e) => {
    if (turno !== "jugador") return;
    if (heroe.mov <= 0) return; // Forzar a lanzar los dados antes de usar las flechas
    
    let objetivoX = heroe.x;
    let objetivoY = heroe.y;
    
    if (e.key === 'ArrowUp') { objetivoX--; } 
    if (e.key === 'ArrowDown') { objetivoX++; }
    if (e.key === 'ArrowLeft') { objetivoY--; } 
    if (e.key === 'ArrowRight') { objetivoY++; }
    
    // Evitar procesar eventos si la tecla pulsada no era de dirección
    if (objetivoX === heroe.x && objetivoY === heroe.y) return;

    // Verificar si hay una colisión con un monstruo al intentar caminar
    let hayMonstruoEnCamino = enemigos.find(en => en.vivo && en.x === objetivoX && en.y === objetivoY);
    if (hayMonstruoEnCamino) {
        log(`Hay un ${hayMonstruoEnCamino.nombre} bloqueando la casilla. Utiliza el botón "Atacar" si deseas combatir.`, "log-sistema");
        return;
    }

    // Comprobación de tipo de terreno destino
    if (mapa[objetivoX][objetivoY] === 2) { 
        // Si es una puerta, se abre gastando un punto de movimiento pero sin cambiar la posición todavía
        mapa[objetivoX][objetivoY] = 0; 
        heroe.mov--;
        log("Has abierto una pesada puerta de madera.", "log-sistema");
        dibujarTablero();
    } else if (mapa[objetivoX][objetivoY] === 0) { 
        // Si es suelo libre, el héroe avanza
        heroe.x = objetivoX; 
        heroe.y = objetivoY; 
        heroe.mov--;
        dibujarTablero();
    } else {
        // Es un muro macizo (1)
        log("¡Pum! Chocas contra una fría pared de piedra.", "log-sistema");
    }
});
