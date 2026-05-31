import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import MapaVisual from '../components/game/MapaVisual';
import ControlPanel from '../components/game/ControlPanel';
import TerminalConsole from '../components/game/TerminalConsole';
import { apiService } from '../services/api';
import { parsearEstadoProlog } from '../services/parserProlog';

// Nombre: formatNombre/1
// Descripcion: convierte nombres internos en texto legible para la UI.
// Entrada: texto con guiones bajos.
// Salida: cadena con espacios y capitalizacion inicial.
// Restricciones: solo transforma texto simple.
// Objetivo: mostrar modulos, tripulantes y artefactos de forma amigable.
function formatNombre(nombre) {
    if (!nombre) return '';
    return nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Nombre: formatTimer/1
// Descripcion: convierte segundos acumulados en una cadena de tiempo legible.
// Entrada: cantidad de segundos.
// Salida: formato `mm:ss` o `hh:mm:ss`.
// Restricciones: espera un entero no negativo.
// Objetivo: mostrar la duracion de la partida y la bitacora.
function formatTimer(segundos) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const ARTEFACTO_ICONS = {
    traje_espacial: '🧑‍🚀',
    fusible: '⚡',
    tarjeta_seguridad: '🪪',
    llave: '🔑',
    herramienta: '🔧',
    extintor: '🧯',
};

const ARTEFACTO_KEYWORDS = [
    { words: ['traje', 'espacial', 'astronauta'], icon: '🧑‍🚀' },
    { words: ['fusible', 'energia', 'bateria', 'electrico'], icon: '⚡' },
    { words: ['tarjeta', 'credencial', 'acceso', 'seguridad'], icon: '🪪' },
    { words: ['llave', 'clave'], icon: '🔑' },
    { words: ['herramienta', 'kit', 'tool'], icon: '🔧' },
    { words: ['extintor', 'fuego'], icon: '🧯' },
    { words: ['medico', 'medicina', 'botiquin', 'salud'], icon: '💊' },
    { words: ['datos', 'chip', 'usb', 'disco'], icon: '💾' },
    { words: ['radio', 'comunicacion', 'senal'], icon: '📡' },
];

const ARTEFACTO_FALLBACK_EMOJIS = [
'🔩', '🧰', '📦', '⚙️', '🧪', '🔋', '🪛', '🧲',
'🛠️', '🧱', '💾', '🖥️', '📡', '🔌', '🧬', '🛰️',
'🗜️', '⛓️', '🧯', '🚀', '🪐', '🔍', '📀', '🧿',
'⚡', '💡', '🧠', '📁', '🗂️', '📝', '🧭', '🎛️',
'🧵', '🪙', '🏗️', '🧼', '🧠', '🕹️', '⌨️', '🖱️'
];
// Nombre: normalizarClave/1
// Descripcion: elimina acentos y normaliza texto para comparaciones de clave.
// Entrada: valor textual.
// Salida: string en minusculas sin diacriticos.
// Restricciones: solo normaliza texto, no valida contenido.
// Objetivo: comparar nombres de forma robusta en iconos y buscadores.
function normalizarClave(valor) {
    if (!valor) return '';
    return valor
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

// Nombre: hashTexto/1
// Descripcion: genera un hash sencillo para seleccionar iconos de respaldo.
// Entrada: texto a hashear.
// Salida: numero entero sin signo.
// Restricciones: algoritmo simple, no criptografico.
// Objetivo: escoger de forma estable un emoji de reserva.
function hashTexto(texto) {
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
        hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return hash;
}

// Nombre: getArtefactoIcon/1
// Descripcion: resuelve el icono visual de un artefacto.
// Entrada: nombre del artefacto.
// Salida: emoji representativo.
// Restricciones: usa reglas fijas y una lista de respaldo.
// Objetivo: dar una lectura visual rapida de los objetos del juego.
function getArtefactoIcon(nombre) {
    const clave = normalizarClave(nombre);
    if (!clave) return '🔩';

    if (ARTEFACTO_ICONS[clave]) return ARTEFACTO_ICONS[clave];

    const regla = ARTEFACTO_KEYWORDS.find(({ words }) => words.some((w) => clave.includes(w)));
    if (regla) return regla.icon;

    return ARTEFACTO_FALLBACK_EMOJIS[hashTexto(clave) % ARTEFACTO_FALLBACK_EMOJIS.length];
}

// Nombre: normalizarEstadoTexto/1
// Descripcion: normaliza estados como rescatado o restaurado para comparar texto.
// Entrada: texto del estado.
// Salida: string normalizado sin acentos ni mayusculas.
// Restricciones: no interpreta estados fuera de texto simple.
// Objetivo: comparar estados de forma uniforme.
function normalizarEstadoTexto(valor) {
    if (!valor) return '';
    return valor
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

const CREW_EMOJIS = [
'🧑‍🚀', '🧑‍🔧', '👩‍⚕️', '🧑‍💻', '👩‍🔬', '🕵️‍♂️',
'👨‍🚀', '👩‍🚀', '🧑‍🎓', '👩‍🏭', '🧑‍✈️', '👨‍🔬',
'👨‍⚕️', '👨‍💻', '👩‍💻', '🧑‍🔬', '👨‍🏭', '👷‍♀️',
'👷‍♂️', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '🧑‍🚒', '🧑‍🚀',
'👨‍✈️', '👩‍✈️', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍🔬',
'🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧙‍♂️', '🧙‍♀️', '🦸‍♂️',
'🦸‍♀️', '🧝‍♂️', '🧝‍♀️', '🤖', 
];
// Nombre: estadoAClase/1
// Descripcion: traduce un estado narrativo a una clase CSS.
// Entrada: estado del tripulante.
// Salida: clase `rescued` o `trapped`.
// Restricciones: solo distingue dos estados visuales.
// Objetivo: pintar la tripulacion con una apariencia consistente.
function estadoAClase(estado) {
    const n = normalizarEstadoTexto(estado);
    if (n === 'rescatado' || n === 'rescued') return 'rescued';
    return 'trapped';
}

// Nombre: extraerPasosForzarGane/1
// Descripcion: extrae pasos numerados desde un texto de ayuda.
// Entrada: texto multilínea.
// Salida: arreglo de pasos limpios.
// Restricciones: solo reconoce lineas numeradas.
// Objetivo: convertir la ayuda textual en una lista accionable.
function extraerPasosForzarGane(texto) {
    if (!texto) return [];

    return String(texto)
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => /^\d+\.\s+/.test(linea))
        .map((linea) => linea.replace(/^\d+\.\s+/, '').trim())
        .filter(Boolean);
}
// Nombre: convertirPasoEnAcciones/2
// Descripcion: traduce un paso de ayuda en acciones concretas de la UI.
// Entrada: paso textual y estado actual.
// Salida: lista de acciones con tipo, valor y descripcion.
// Restricciones: solo reconoce patrones de paso ya definidos.
// Objetivo: automatizar la ejecucion manual de sugerencias.
function convertirPasoEnAcciones(paso, estadoActual) {
    const texto = String(paso || '').trim();
    if (!texto) return [];

    const irYRecoger = texto.match(/^Ir a\s+(.+?)\s+y recoger\s+(.+)$/i);
    if (irYRecoger) {
        const destino = irYRecoger[1].trim();
        const artefacto = irYRecoger[2].trim();
        const acciones = [];
        if (estadoActual?.moduloActual !== destino) {
            acciones.push({ tipo: 'mover', valor: destino, descripcion: `Ir a ${destino}` });
        }
        acciones.push({ tipo: 'tomar', valor: artefacto, descripcion: `Recoger ${artefacto}` });
        return acciones;
    }

    const reparar = texto.match(/^Reparar\s+(.+?)\s+en\s+(.+)$/i);
    if (reparar) {
        const sistema = reparar[1].trim();
        const modulo = reparar[2].trim();
        const acciones = [];
        if (estadoActual?.moduloActual !== modulo) {
            acciones.push({ tipo: 'mover', valor: modulo, descripcion: `Ir a ${modulo}` });
        }
        acciones.push({ tipo: 'reparar', valor: sistema, descripcion: `Reparar ${sistema}` });
        return acciones;
    }

    const rescatar = texto.match(/^Rescatar\s+(.+?)\s+en\s+(.+)$/i);
    if (rescatar) {
        const tripulante = rescatar[1].trim();
        const modulo = rescatar[2].trim();
        const acciones = [];
        if (estadoActual?.moduloActual !== modulo) {
            acciones.push({ tipo: 'mover', valor: modulo, descripcion: `Ir a ${modulo}` });
        }
        acciones.push({ tipo: 'rescatar', valor: tripulante, descripcion: `Rescatar a ${tripulante}` });
        return acciones;
    }

    const desbloquear = texto.match(/^Pasar por\s+(.+?)\s+para desbloquear acceso a\s+(.+)$/i);
    if (desbloquear) {
        const modulo = desbloquear[1].trim();
        return [{ tipo: 'mover', valor: modulo, descripcion: `Ir a ${modulo}` }];
    }

    const irAModulo = texto.match(/^Ir a\s+(.+)$/i);
    if (irAModulo) {
        const modulo = irAModulo[1].trim();
        return [{ tipo: 'mover', valor: modulo, descripcion: `Ir a ${modulo}` }];
    }

    return [];
}

// Nombre: obtenerSugerenciasPendientesDesdeEstado/1
// Descripcion: genera sugerencias cortas a partir del estado actual.
// Entrada: estado actual de la partida.
// Salida: arreglo de sugerencias prioritarias.
// Restricciones: limita el total de sugerencias devueltas.
// Objetivo: orientar al jugador hacia las tareas que faltan.
function obtenerSugerenciasPendientesDesdeEstado(estadoActual) {
    if (!estadoActual) return [];

    const sugerencias = [];
    const moduloActual = estadoActual.moduloActual || '';
    const tripulantesPendientes = Array.isArray(estadoActual.tripulantes)
        ? estadoActual.tripulantes.filter((tripulante) => normalizarEstadoTexto(tripulante?.estado) !== 'rescatado')
        : [];
    const sistemasPendientes = Array.isArray(estadoActual.sistemas)
        ? estadoActual.sistemas.filter((sistema) => normalizarEstadoTexto(sistema?.estado) !== 'restaurado')
        : [];

    tripulantesPendientes.forEach((tripulante) => {
        if (tripulante?.modulo && tripulante.modulo !== moduloActual) {
            sugerencias.push(`Ir a ${formatNombre(tripulante.modulo)}`);
        }
        sugerencias.push(`Rescatar a ${formatNombre(tripulante?.nombre)}`);
    });

    sistemasPendientes.forEach((sistema) => {
        if (sistema?.modulo && sistema.modulo !== moduloActual) {
            sugerencias.push(`Ir a ${formatNombre(sistema.modulo)}`);
        }
        sugerencias.push(`Reparar ${formatNombre(sistema?.sistema)} en ${formatNombre(sistema?.modulo)}`);
    });

    return [...new Set(sugerencias)].filter(Boolean).slice(0, 6);
}

// Nombre: construirGrafoBidireccional/1
// Descripcion: transforma una lista de conexiones en un grafo no dirigido.
// Entrada: arreglo de conexiones.
// Salida: Map con vecindades bidireccionales.
// Restricciones: ignora conexiones incompletas.
// Objetivo: reutilizar la estructura para busqueda de rutas.
function construirGrafoBidireccional(conexiones) {
    const grafo = new Map();

    (Array.isArray(conexiones) ? conexiones : []).forEach(({ origen, destino }) => {
        if (!origen || !destino) return;
        if (!grafo.has(origen)) grafo.set(origen, new Set());
        if (!grafo.has(destino)) grafo.set(destino, new Set());
        grafo.get(origen).add(destino);
        grafo.get(destino).add(origen);
    });

    return grafo;
}

// Nombre: buscarRutaMasCorta/3
// Descripcion: encuentra el camino mas corto entre dos modulos.
// Entrada: origen, destino y conexiones.
// Salida: arreglo con la ruta o vacio si no existe.
// Restricciones: usa busqueda en anchura sobre el grafo bidireccional.
// Objetivo: sugerir desplazamientos rapidos al jugador.
function buscarRutaMasCorta(origen, destino, conexiones) {
    if (!origen || !destino) return [];
    if (origen === destino) return [origen];

    const grafo = construirGrafoBidireccional(conexiones);
    const visitados = new Set([origen]);
    const cola = [[origen]];

    while (cola.length > 0) {
        const camino = cola.shift();
        const actual = camino[camino.length - 1];
        const vecinos = grafo.get(actual) || new Set();

        for (const vecino of vecinos) {
            if (visitados.has(vecino)) continue;
            const nuevoCamino = [...camino, vecino];
            if (vecino === destino) return nuevoCamino;
            visitados.add(vecino);
            cola.push(nuevoCamino);
        }
    }

    return [];
}

// Nombre: formatearRuta/1
// Descripcion: convierte una ruta en un texto con flechas.
// Entrada: arreglo de modulos.
// Salida: cadena legible para mostrar en pantalla.
// Restricciones: requiere una lista no vacia.
// Objetivo: presentar las rutas con una lectura mas visual.
function formatearRuta(ruta) {
    if (!Array.isArray(ruta) || ruta.length === 0) return '';
    return ruta.map((item) => formatNombre(item)).join(' → ');
}

// Nombre: crearPendientesGuiadosDesdeEstado/2
// Descripcion: construye tareas guiadas a partir del estado y las conexiones.
// Entrada: estado actual y lista de conexiones.
// Salida: arreglo de pendientes con ruta sugerida.
// Restricciones: limita el resultado a un conjunto pequeno de sugerencias.
// Objetivo: orientar al jugador hacia objetivos concretos.
function crearPendientesGuiadosDesdeEstado(estadoActual, conexiones) {
    if (!estadoActual) return [];

    const moduloActual = estadoActual.moduloActual || '';
    const pendientes = [];

    const tripulantesPendientes = Array.isArray(estadoActual.tripulantes)
        ? estadoActual.tripulantes.filter((tripulante) => normalizarEstadoTexto(tripulante?.estado) !== 'rescatado')
        : [];
    const sistemasPendientes = Array.isArray(estadoActual.sistemas)
        ? estadoActual.sistemas.filter((sistema) => normalizarEstadoTexto(sistema?.estado) !== 'restaurado')
        : [];

    tripulantesPendientes.forEach((tripulante) => {
        const moduloObjetivo = tripulante?.modulo || '';
        const ruta = buscarRutaMasCorta(moduloActual, moduloObjetivo, conexiones);
        pendientes.push({
            tipo: 'rescatar',
            objetivo: tripulante?.nombre || 'Tripulante',
            modulo: moduloObjetivo,
            accion: `Rescatar a ${formatNombre(tripulante?.nombre)}`,
            ruta,
        });
    });

    sistemasPendientes.forEach((sistema) => {
        const moduloObjetivo = sistema?.modulo || '';
        const ruta = buscarRutaMasCorta(moduloActual, moduloObjetivo, conexiones);
        pendientes.push({
            tipo: 'reparar',
            objetivo: sistema?.sistema || 'Sistema',
            modulo: moduloObjetivo,
            accion: `Reparar ${formatNombre(sistema?.sistema)} en ${formatNombre(sistema?.modulo)}`,
            ruta,
        });
    });

    return pendientes.slice(0, 6);
}
// Nota: la generación y ejecución del plan fue movida al backend Prolog.
// El frontend ahora solicita el plan/ejecución al controlador y muestra resultados.

// Nombre: Game
// Descripcion: pantalla principal de la partida con mapa, paneles y bitacora.
// Entrada: lee el estado de la ruta actual y datos de navegacion.
// Salida: interfaz completa de juego interactivo.
// Restricciones: depende del backend para estado, acciones y ayuda.
// Objetivo: concentrar toda la experiencia jugable en una sola vista.
function Game() {
    const location   = useLocation();
    const navigate = useNavigate();
    const playerName = location.state?.nombre || 'OPERADOR';

    const [log, setLog]       = useState('Bienvenido a la Estación Atlas. Misión iniciada.');
    const [modulos, setModulos]     = useState([]);
    const [descripcionesModulos, setDescripcionesModulos] = useState({});
    const [conexiones, setConexiones] = useState([]);
    const [estado, setEstado]       = useState(null);
    const [cargando, setCargando]   = useState(false);
    const [errorActual, setErrorActual] = useState(null);
    const [forzarGaneResultado, setForzarGaneResultado] = useState(null);
    const [forzarGaneEnCurso, setForzarGaneEnCurso] = useState(false);
    const [forzarGanePasoActual, setForzarGanePasoActual] = useState('');
    const [forzarGanePendientes, setForzarGanePendientes] = useState([]);
    const [victoria, setVictoria]   = useState(false);
    const [mostrarBitacora, setMostrarBitacora] = useState(false);
    const [bitacoraPartida, setBitacoraPartida] = useState([]);
    const [cargandoBitacora, setCargandoBitacora] = useState(false);
    const [fichaModuloSeleccionado, setFichaModuloSeleccionado] = useState(null);
    const [timer, setTimer]         = useState(0);
    const timerRef = useRef(null);
    const ultimoLogProcesadoRef = useRef('');
    const audioContextRef = useRef(null);
    const audioAmbienteRef = useRef(null);
    const forzarGaneRondasRef = useRef(0);
    const bloqueoGeneral = cargando || forzarGaneEnCurso;

    const limpiarErrorVisible = useCallback((texto) => {
        return (texto || '')
            .toString()
            .trim()
            .replace(/^ERROR\s*[:-]?\s*/i, '')
            .trim();
    }, []);

    //Timer de misión--------------------------------------------------------------------------------
    // Nombre: sincronizarBitacora/1
    // Descripcion: copia el log recibido a la bitacora visible de la partida.
    // Entrada: texto de log y contador de tiempo.
    // Salida: lista de lineas acumuladas en el historial visual.
    // Restricciones: evita duplicar mensajes consecutivos iguales.
    // Objetivo: conservar una cronologia legible de la sesion.
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (!log) return;

        if (ultimoLogProcesadoRef.current === log) return;
        ultimoLogProcesadoRef.current = log;

        const lineas = log
            .split('\n')
            .map((linea) => linea.trim())
            .filter(Boolean);

        if (lineas.length === 0) return;

        setBitacoraPartida((prev) => {
            const nuevas = lineas.map((texto) => ({
                tiempo: formatTimer(timer),
                texto,
            }));

            const ultimoTexto = prev[prev.length - 1]?.texto;
            if (nuevas.length === 1 && nuevas[0].texto === ultimoTexto) {
                return prev;
            }

            return [...prev, ...nuevas].slice(-120);
        });
    }, [log, timer]);

    // Nombre: obtenerAudioContexto/0
    // Descripcion: crea o reutiliza el contexto de audio del navegador.
    // Entrada: no recibe datos.
    // Salida: instancia de AudioContext o null si no esta disponible.
    // Restricciones: solo funciona en navegadores con Web Audio API.
    // Objetivo: centralizar el acceso al motor de sonido.
    const obtenerAudioContexto = useCallback(() => {
        if (audioContextRef.current) return audioContextRef.current;
        const ContextoAudio = window.AudioContext || window.webkitAudioContext;
        if (!ContextoAudio) return null;
        const contexto = new ContextoAudio();
        audioContextRef.current = contexto;
        return contexto;
    }, []);

    // Nombre: iniciarAudioAmbiente/0
    // Descripcion: inicia el zumbido ambiental de fondo de la interfaz.
    // Entrada: no recibe datos.
    // Salida: un oscilador persistente con volumen bajo.
    // Restricciones: se ejecuta una sola vez mientras no exista audio activo.
    // Objetivo: dar atmosfera sonora al juego.
    const iniciarAudioAmbiente = useCallback(async () => {
        if (audioAmbienteRef.current) return;

        const contexto = obtenerAudioContexto();
        if (!contexto) return;

        if (contexto.state === 'suspended') {
            await contexto.resume();
        }

        const oscilador = contexto.createOscillator();
        const ganancia = contexto.createGain();
        const filtro = contexto.createBiquadFilter();

        oscilador.type = 'triangle';
        oscilador.frequency.value = 42;

        filtro.type = 'lowpass';
        filtro.frequency.value = 170;

        ganancia.gain.value = 0.018;

        oscilador.connect(filtro);
        filtro.connect(ganancia);
        ganancia.connect(contexto.destination);
        oscilador.start();

        audioAmbienteRef.current = { oscilador, ganancia };
    }, [obtenerAudioContexto]);

    useEffect(() => {
        iniciarAudioAmbiente();
    }, [iniciarAudioAmbiente]);

    // Nombre: reproducirEfecto/1
    // Descripcion: reproduce un efecto breve de acierto o error.
    // Entrada: tipo de efecto.
    // Salida: un beep corto con envolvente suave.
    // Restricciones: depende de que el contexto de audio este activo.
    // Objetivo: reforzar con sonido las respuestas del sistema.
    const reproducirEfecto = useCallback(async (tipo) => {
        const contexto = obtenerAudioContexto();
        if (!contexto) return;

        if (contexto.state === 'suspended') {
            await contexto.resume();
        }

        const oscilador = contexto.createOscillator();
        const ganancia = contexto.createGain();

        oscilador.type = tipo === 'error' ? 'square' : 'sine';
        oscilador.frequency.value = tipo === 'error' ? 180 : 720;
        ganancia.gain.value = tipo === 'error' ? 0.03 : 0.024;

        oscilador.connect(ganancia);
        ganancia.connect(contexto.destination);

        const ahora = contexto.currentTime;
        oscilador.start(ahora);

        if (tipo === 'error') {
            oscilador.frequency.exponentialRampToValueAtTime(110, ahora + 0.18);
        } else {
            oscilador.frequency.exponentialRampToValueAtTime(940, ahora + 0.08);
        }

        ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.22);
        oscilador.stop(ahora + 0.23);
    }, [obtenerAudioContexto]);

    // Nombre: reproducirAplausos/0
    // Descripcion: reproduce una secuencia sonora de celebracion al ganar.
    // Entrada: no recibe datos.
    // Salida: serie de notas breves escalonadas.
    // Restricciones: requiere contexto de audio disponible.
    // Objetivo: reforzar el cierre victorioso de la partida.
    const reproducirAplausos = useCallback(async () => {
        const contexto = obtenerAudioContexto();
        if (!contexto) return;

        if (contexto.state === 'suspended') {
            await contexto.resume();
        }

        const notas = [880, 1240, 980, 1460, 1120, 1320, 1500];

        notas.forEach((frecuencia, indice) => {
            window.setTimeout(() => {
                const oscilador = contexto.createOscillator();
                const ganancia = contexto.createGain();

                oscilador.type = 'square';
                oscilador.frequency.value = frecuencia;
                ganancia.gain.value = 0.0001;

                oscilador.connect(ganancia);
                ganancia.connect(contexto.destination);

                const inicio = contexto.currentTime;
                oscilador.start(inicio);
                ganancia.gain.exponentialRampToValueAtTime(0.022, inicio + 0.02);
                ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.14);
                oscilador.stop(inicio + 0.16);
            }, indice * 85);
        });
    }, [obtenerAudioContexto]);

    // Nombre: evaluarVictoria/0
    // Descripcion: consulta al backend si la partida ya cumplio la victoria.
    // Entrada: no recibe datos.
    // Salida: verdadero cuando la victoria ya fue detectada.
    // Restricciones: solo cambia el estado visual cuando Prolog confirma la victoria.
    // Objetivo: detectar automaticamente el final de la mision.
    const evaluarVictoria = useCallback(async () => {
        if (victoria) return true;

        try {
            const respuesta = await apiService.verificarVictoria();
            const texto = (respuesta.out || '').toLowerCase();
            const gano =
                texto.includes('felicidades') ||
                texto.includes('condicion de victoria alcanzada') ||
                texto.includes('mision fue completada') ||
                texto.includes('misión fue completada') ||
                texto.includes('mision cumplida') ||
                texto.includes('misión cumplida');

            if (gano) {
                clearInterval(timerRef.current);
                setVictoria(true);
                setErrorActual(null);
                setLog('¡Felicidades! Misión cumplida. La Estación Atlas ha sido restaurada.');
                await reproducirAplausos();
                return true;
            }
        } catch {
            // Si todavía no se ganó, no interrumpimos la misión.
        }

        return false;
    }, [victoria, reproducirAplausos]);

    //Carga inicial--------------------------------------------------------------------------------
    // Nombre: cargarDatos/0
    // Descripcion: carga modulos, estado, conexiones y descripciones desde el backend.
    // Entrada: no recibe datos.
    // Salida: llena el estado local con la informacion inicial del juego.
    // Restricciones: depende de que el backend responda al menos parcialmente.
    // Objetivo: preparar la partida antes de interactuar.
    const cargarDatos = useCallback(async () => {
        const [resultadoModulos, resultadoEstado, resultadoConexiones, resultadoModulosInfo] = await Promise.allSettled([
            apiService.obtenerModulos(),
            apiService.obtenerEstado(),
            apiService.obtenerConexiones(),
            apiService.obtenerModulosInfo(),
        ]);

        const modulosCargados = resultadoModulos.status === 'fulfilled' ? resultadoModulos.value : [];
        const estadoCargado = resultadoEstado.status === 'fulfilled' ? resultadoEstado.value : null;
        const conexionesCargadas = resultadoConexiones.status === 'fulfilled' ? resultadoConexiones.value : [];
        const modulosInfo = resultadoModulosInfo.status === 'fulfilled' ? resultadoModulosInfo.value : [];

        const mapaDescripciones = modulosInfo.reduce((acc, item) => {
            if (item?.modulo) acc[item.modulo] = item.descripcion || '';
            return acc;
        }, {});

        setModulos(modulosCargados);
        setEstado(estadoCargado);
        setConexiones(conexionesCargadas);
        setDescripcionesModulos(mapaDescripciones);

        if (!modulosCargados.length || !estadoCargado) {
            setLog('Error al cargar datos principales del juego. Verifica que el servidor backend este activo.');
        } else if (!conexionesCargadas.length) {
            setLog('Mision cargada. No se pudieron obtener conexiones del grafo, pero el juego sigue operativo.');
        }

        await evaluarVictoria();
    }, [evaluarVictoria]);

    // Nombre: ejecutarCargaInicial/0
    // Descripcion: dispara la carga inicial del juego cuando el componente monta.
    // Entrada: no recibe datos.
    // Salida: inicia la recuperacion de datos iniciales.
    // Restricciones: solo corre una vez por montaje del componente.
    // Objetivo: arrancar la partida con informacion actualizada.
    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // Nombre: habilitarAudioConInteraccion/0
    // Descripcion: desbloquea el audio del navegador tras la primera interaccion.
    // Entrada: un evento de puntero.
    // Salida: activa el audio ambiente si el navegador lo habia suspendido.
    // Restricciones: depende de la politica de autoplay del navegador.
    // Objetivo: evitar que el sonido quede bloqueado al cargar.
    useEffect(() => {
        const desbloquearAudio = () => {
            iniciarAudioAmbiente();
        };

        window.addEventListener('pointerdown', desbloquearAudio, { once: true });
        return () => window.removeEventListener('pointerdown', desbloquearAudio);
    }, [iniciarAudioAmbiente]);

    //Actualizar solo estado--------------------------------------------------------------------------------
    // Nombre: actualizarEstado/0
    // Descripcion: refresca el estado de la partida desde el backend.
    // Entrada: no recibe datos.
    // Salida: nuevo estado o null si falla la consulta.
    // Restricciones: no altera otros datos del componente.
    // Objetivo: sincronizar la UI cuando el backend cambia el estado.
    const actualizarEstado = useCallback(async () => {
        try {
            const estadoActual = await apiService.obtenerEstado();
            setEstado(estadoActual);
            return estadoActual;
        } catch (e) {
            // silencioso — el log ya habrá mostrado cualquier error
            return null;
        }
    }, []);

    //Manejar acciones del jugador--------------------------------------------------------------------------------
    // Nombre: handleAccion/2
    // Descripcion: ejecuta una accion del jugador y refresca la interfaz.
    // Entrada: tipo de accion y valor asociado.
    // Salida: actualizacion de estado, log y feedback sonoro.
    // Restricciones: bloquea la ejecucion si ya hay otra accion en curso.
    // Objetivo: concentrar el flujo de movimiento, toma, rescate o reparacion.
    const handleAccion = useCallback(async (tipo, valor) => {
        if (!tipo || bloqueoGeneral) return;
        setCargando(true);
        setErrorActual(null);
        iniciarAudioAmbiente();

        try {
            const respuesta = await apiService.enviarComando(tipo, valor);
            const mensajeSalida = respuesta.out || 'Acción procesada.';
            setLog(mensajeSalida);
            reproducirEfecto('ok');

            if (respuesta.estado) {
                setEstado(respuesta.estado);
            } else {
                await actualizarEstado();
            }

            await evaluarVictoria();
        } catch (e) {
            const msg = limpiarErrorVisible(e.message || 'Comando inválido.');
            setLog(msg);
            setErrorActual(msg);
            reproducirEfecto('error');
            await actualizarEstado();
        } finally {
            setCargando(false);
        }
    }, [bloqueoGeneral, actualizarEstado, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria]);

    //Ayuda de la computadora--------------------------------------------------------------------------------
    // Nombre: handleAyuda/0
    // Descripcion: solicita la ayuda de la computadora de a bordo.
    // Entrada: no recibe datos.
    // Salida: log actualizado con sugerencias o error.
    // Restricciones: respeta el bloqueo general de la interfaz.
    // Objetivo: dar acceso rapido a la guia del sistema.
    const handleAyuda = useCallback(async () => {
        if (bloqueoGeneral) return;
        setCargando(true);
        setErrorActual(null);
        iniciarAudioAmbiente();
        try {
            const respuesta = await apiService.solicitarAyuda();
            setLog(limpiarErrorVisible(respuesta.out || 'Computadora: sin novedades.'));
            if (respuesta.estado) setEstado(respuesta.estado);
            reproducirEfecto('ok');
            await evaluarVictoria();
        } catch (e) {
            setLog(limpiarErrorVisible(e.message || 'No se pudo contactar la computadora de a bordo.'));
            setErrorActual(limpiarErrorVisible(e.message || 'No se pudo contactar la computadora de a bordo.'));
            reproducirEfecto('error');
        } finally {
            setCargando(false);
        }
    }, [bloqueoGeneral, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria, limpiarErrorVisible]);

    // Nombre: handleForzarGane/1
    // Descripcion: ejecuta el flujo de ayuda automatica para resolver la partida.
    // Entrada: opciones de ejecucion, como modo automatico.
    // Salida: actualizaciones de progreso, pasos y resultados de la solucion.
    // Restricciones: evita reentradas mientras el plan este en curso.
    // Objetivo: automatizar la resolucion de los objetivos pendientes.
    const handleForzarGane = useCallback(async (opciones = {}) => {
        const { auto = false } = opciones;
        if (bloqueoGeneral) return;
        if (!auto) {
            forzarGaneRondasRef.current = 0;
        }
        setErrorActual(null);
        setForzarGaneResultado(null);
        setForzarGanePasoActual('');
        setForzarGanePendientes([]);
        iniciarAudioAmbiente();

        setForzarGaneEnCurso(true);
        let es = null;
        try {
            // Usar URL absoluta hacia el backend para evitar que Vite/proxy sirva la ruta desde el frontend
            es = new EventSource('http://localhost:3000/api/forzar_gane_execute_stream');

            es.onmessage = (ev) => {
                if (!ev.data) return;
                let dato = null;
                try { dato = JSON.parse(ev.data); } catch { dato = null; }
                if (!dato) return;

                if (dato.type === 'plan') {
                    setLog((prev) => `${prev}\nPlan generado (${dato.plan.length} pasos)`);
                } else if (dato.type === 'log') {
                    setLog((prev) => `${prev}\n${dato.message}`);
                } else if (dato.type === 'step') {
                    const textoPaso = dato.paso || (dato.descripcion || 'Accion');
                    setForzarGanePasoActual(textoPaso);
                    const linea = dato.ok ? (dato.out || `OK: ${dato.accion}`) : (`ERROR (${dato.accion}): ${dato.out}`);
                    // Evitar ruido repetido de bienvenida impresa por Prolog
                    if (!/Bienvenido a la Estaci[oó]n Atlas/i.test(linea)) {
                        setLog((prev) => `${prev}\n${linea}`);
                    }
                    // Si el backend incluye el estado del juego, actualizar UI en vivo
                    if (dato.estado) {
                        try {
                            const estadoParseado = parsearEstadoProlog(dato.estado);
                            if (estadoParseado) setEstado(estadoParseado);
                        } catch (e) {
                            // ignore parse errors
                        }
                    }
                    if (!dato.ok) reproducirEfecto('error');
                } else if (dato.type === 'error') {
                    setLog((prev) => `${prev}\n${dato.message}`);
                    reproducirEfecto('error');
                } else if (dato.type === 'end') {
                    // estado final
                    (async () => {
                        const estadoActualizado = await actualizarEstado();
                        const gano = await evaluarVictoria();
                        const pendientesDerivados = crearPendientesGuiadosDesdeEstado(estadoActualizado || estado, conexiones);
                        setForzarGaneResultado(
                            gano
                                ? { tipo: 'success', texto: 'Ya puedes seguir con Forzar Gane.' }
                                : { tipo: 'warning', texto: 'La solución está en proceso. Continuando automáticamente con lo pendiente.' }
                        );
                        setForzarGanePendientes(pendientesDerivados);

                        if (!gano && pendientesDerivados.length > 0 && forzarGaneRondasRef.current < 4) {
                            forzarGaneRondasRef.current += 1;
                            setLog((prev) => `${prev}\nContinuando con Forzar Gane...`);
                            window.setTimeout(() => {
                                handleForzarGane({ auto: true });
                            }, 450);
                        }
                    })();
                    setForzarGaneEnCurso(false);
                    setForzarGanePasoActual('');
                    reproducirEfecto('ok');
                    if (es) { es.close(); es = null; }
                }
            };

            es.onerror = (err) => {
                setLog((prev) => `${prev}\n[STREAM] Error de conexión con el servidor.`);
                setForzarGaneEnCurso(false);
                setForzarGanePasoActual('');
                if (es) { es.close(); es = null; }
            };

        } catch (e) {
            setLog((prev) => `${prev}\nNo se pudo iniciar la ejecución en vivo.`);
            setForzarGaneEnCurso(false);
            setForzarGanePasoActual('');
            reproducirEfecto('error');
            if (es) { es.close(); es = null; }
        }
    }, [bloqueoGeneral, actualizarEstado, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria, limpiarErrorVisible]);

    //Guardar / Cargar--------------------------------------------------------------------------------
    // Nombre: handleGuardar/0
    // Descripcion: guarda la partida actual en el backend.
    // Entrada: no recibe datos.
    // Salida: log de exito o error y feedback sonoro.
    // Restricciones: depende de que el backend pueda persistir la mision.
    // Objetivo: conservar el progreso del jugador.
    const handleGuardar = useCallback(async () => {
        try {
            iniciarAudioAmbiente();
            await apiService.guardarMision();
            setLog('Partida guardada correctamente.');
            reproducirEfecto('ok');
        } catch (e) {
            setLog('Error al guardar la partida.');
            reproducirEfecto('error');
        }
    }, [iniciarAudioAmbiente, reproducirEfecto]);

    // Nombre: handleVerBitacora/0
    // Descripcion: abre la vista de bitacora historica de la partida.
    // Entrada: no recibe datos.
    // Salida: activa el panel de historial y su carga visual.
    // Restricciones: mantiene el bloqueo visual mientras prepara la vista.
    // Objetivo: permitir revisar el registro de eventos de la partida.
    const handleVerBitacora = useCallback(async () => {
        try {
            setCargandoBitacora(true);
            iniciarAudioAmbiente();
            setMostrarBitacora(true);
            reproducirEfecto('ok');
        } catch {
            setMostrarBitacora(true);
            reproducirEfecto('error');
        } finally {
            setCargandoBitacora(false);
        }
    }, [iniciarAudioAmbiente, reproducirEfecto]);

    // Nombre: handleOtraPartida/0
    // Descripcion: vuelve a la pantalla inicial para empezar otra sesion.
    // Entrada: no recibe datos.
    // Salida: navega al inicio y limpia la vista principal.
    // Restricciones: usa recarga de ubicacion para reiniciar el flujo.
    // Objetivo: cerrar la partida actual y volver al menu principal.
    const handleOtraPartida = useCallback(() => {
        setVictoria(false);
        setMostrarBitacora(false);
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        window.location.replace('/');
    }, []);

    // Nombre: limpiarAudioAlSalir/0
    // Descripcion: apaga y libera el audio al desmontar el componente.
    // Entrada: no recibe datos.
    // Salida: recursos de audio cerrados y referencias limpiadas.
    // Restricciones: solo corre al salir de la pagina de juego.
    // Objetivo: evitar fugas de audio entre partidas.
    useEffect(() => {
        return () => {
            if (audioAmbienteRef.current) {
                audioAmbienteRef.current.oscilador.stop();
                audioAmbienteRef.current.oscilador.disconnect();
                audioAmbienteRef.current.ganancia.disconnect();
                audioAmbienteRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    const inventario    = Array.isArray(estado?.inventario) ? estado.inventario : [];
    const tripulantes   = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
    const moduloActual  = estado?.moduloActual || '—';

    //Calcular progreso general--------------------------------------------------------------------------------
    // Nombre: calcularProgresoGeneral/1
    // Descripcion: estima el avance global de la mision en porcentaje.
    // Entrada: estado actual del juego.
    // Salida: numero entre 0 y 100.
    // Restricciones: usa sistemas, tripulantes, inventario y artefactos visibles.
    // Objetivo: mostrar al jugador una referencia rapida de avance.
    const progreso = useMemo(() => {
        const sistemas   = Array.isArray(estado?.sistemas) ? estado.sistemas : [];
        const artefactosDisponibles = Array.isArray(estado?.artefactosDisponibles) ? estado.artefactosDisponibles : [];
        const total      = sistemas.length + tripulantes.length + inventario.length + artefactosDisponibles.length;
        if (total === 0) return 0;
        const restaurados = sistemas.filter(s => normalizarEstadoTexto(s.estado) === 'restaurado').length;
        const rescatados  = tripulantes.filter(t => normalizarEstadoTexto(t.estado) === 'rescatado').length;
        return Math.round(((restaurados + rescatados + inventario.length) / total) * 100);
    }, [estado, inventario, tripulantes]);

    return (
        <div className="game-container">

            {/* ── HEADER HUD ── */}
            <header className="game-header">
                <div className="hud-logo">
                    <div className="logo-icon" aria-hidden="true">
                        <div className="logo-ring" />
                    </div>
                    <div className="logo-text-wrap">
                        <span className="logo-title">ATLAS</span>
                        <span className="logo-sub">System Failure Detected</span>
                    </div>
                </div>

                <div className="hud-center">
                    <span className="hud-timer-label">⏱ Tiempo en Misión</span>
                    <span className="hud-timer">{formatTimer(timer)}</span>
                </div>

                <div className="hud-right">
                    <div className="hud-status-dot">
                        <span className="dot green" />
                        <span>Operativo</span>
                    </div>
                    <div className="hud-status-dot">
                        <span className="dot red" />
                        <span>Sin Reparar</span>
                    </div>
                    <div className="hud-status-dot">
                        <span className="dot amber" />
                        <span>En Reparación</span>
                    </div>
                    <div className="hud-player">
                        <span className="player-label">Ingeniero</span>
                        <span className="player-name">{playerName.toUpperCase()}</span>
                    </div>
                </div>
            </header>

            {/* ── GRID PRINCIPAL ── */}
            <main className="game-layout">

                {/* COLUMNA IZQUIERDA */}
                <aside className="col-left">

                    {/* Perfil */}
                    <div className="panel">
                        <div className="panel-header">
                            <div className="panel-header-icon cyan">👽</div>
                            <span className="panel-title">Ingeniero</span>
                        </div>
                        <div className="profile-card">
                            <div className="profile-avatar">
                                <div className="profile-avatar-top">🧑‍🚀</div>
                                <div className="profile-avatar-bottom">🛠️</div>
                            </div>
                            <div className="profile-info">
                                <span className="profile-name">{playerName}</span>
                                <span className="profile-rank">Módulo Actual</span>
                                <div className="profile-location">
                                    <span className="profile-location-dot" />
                                    <span className="profile-location-text">{formatNombre(moduloActual)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventario */}
                    <div className="panel">
                        <div className="panel-header">
                            <span className="panel-title">Inventario</span>
                        </div>
                        <div className="panel-body">
                            <div className="inventory-list">
                                {inventario.length > 0 ? (
                                    inventario.map(item => (
                                        <div key={item} className="inventory-item">
                                            <div className="inventory-icon">{getArtefactoIcon(item)}</div>
                                            <span className="inventory-name">{formatNombre(item)}</span>
                                            <span className="inventory-qty">x1</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="inventory-empty">— Inventario vacío —</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tripulantes */}
                    <div className="panel">
                        <div className="panel-header">
                            <span className="panel-title">Tripulantes</span>
                        </div>
                        <div className="panel-body">
                            <div className="crew-list">
                                {tripulantes.length > 0 ? (
                                    tripulantes.map((t, i) => {
                                        const emoji = CREW_EMOJIS[i % CREW_EMOJIS.length];
                                        const status = t.estado || 'atrapado';
                                        const clase = estadoAClase(status);
                                        return (
                                            <div key={t.nombre || i} className="crew-member">
                                                <div className={`crew-avatar ${clase}`}>{emoji}</div>
                                                <div className="crew-info">
                                                    <span className="crew-name">{formatNombre(t.nombre)}</span>
                                                    <span className="crew-location">{formatNombre(t.modulo)}</span>
                                                </div>
                                                <span className={`crew-status-badge ${clase}`}>
                                                    {clase === 'rescued' ? 'Rescatado' : 'Atrapado'}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="inventory-empty">— Sin datos de tripulación —</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Objetivo y progreso */}
                    <div className="panel">
                        <div className="panel-header">
                            <span className="panel-title">Objetivo Actual</span>
                        </div>
                        <div className="panel-body">
                            <div className="objective-box">
                                <span className="objective-text">
                                    Repara todos los sistemas críticos, rescata a la tripulación
                                    atrapada y restaura la Estación Atlas.
                                </span>
                            </div>
                        </div>
                        <div className="progress-section">
                            <div className="progress-label">
                                <span>Estado General</span>
                                <span>{progreso} / 100%</span>
                            </div>
                            <div className="progress-bar-track">
                                <div className="progress-bar-fill" style={{ width: `${progreso}%` }} />
                            </div>
                        </div>
                    </div>

                </aside>

                {/* COLUMNA CENTRAL */}
                <section className="col-center">
                    <MapaVisual
                        modulos={modulos}
                        conexiones={conexiones}
                        estado={estado}
                        descripcionesModulos={descripcionesModulos}
                        mostrarFichaModulo={false}
                        onFichaModuloChange={setFichaModuloSeleccionado}
                    />

                    {/* Panel de movimiento debajo del mapa */}
                    <div className="movement-panel">
                        <div className="panel-header">
                            <span className="panel-title">Movimiento Rápido</span>
                        </div>
                        <div className="movement-inner">
                            <div className="movement-section">
                                <div className="movement-section-label">Ir a módulo</div>
                                {Array.isArray(estado?.modulosConectados) && estado.modulosConectados.length > 0 ? (
                                    estado.modulosConectados.map(destino => (
                                        <button
                                            key={destino}
                                            className="move-btn"
                                            onClick={() => handleAccion('mover', destino)}
                                            disabled={bloqueoGeneral}
                                        >
                                            <span>{formatNombre(destino)}</span>
                                            <span className="move-btn-arrow">→</span>
                                        </button>
                                    ))
                                ) : (
                                    <span style={{ color: 'var(--c-text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                                        Sin conexiones disponibles
                                    </span>
                                )}
                            </div>
                            <div className="movement-section">
                                <div className="movement-section-label">Estado del movimiento</div>
                                {Array.isArray(estado?.modulosConectados) && estado.modulosConectados.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {estado.modulosConectados.map(destino => (
                                            <div key={destino} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                                                color: 'var(--c-text-secondary)',
                                                padding: '6px 10px',
                                                background: 'rgba(0,255,157,0.04)',
                                                border: '1px solid rgba(0,255,157,0.12)',
                                                borderRadius: 'var(--radius-sm)',
                                            }}>
                                                <span style={{ color: 'var(--c-accent-green)' }}>✓</span>
                                                <span>Puedes moverte a {formatNombre(destino)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: '0.78rem', fontFamily: 'var(--font-mono)',
                                        color: 'var(--c-text-dim)', letterSpacing: '0.5px'
                                    }}>
                                        Sin rutas desde aquí
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="force-win-wrap">
                            <button
                                className="force-win-btn"
                                onClick={handleForzarGane}
                                disabled={bloqueoGeneral}
                            >
                                <span>{forzarGaneEnCurso ? 'Computadora jugando...' : 'Forzar Gane'}</span>
                                <span className="force-win-btn-sub">
                                    {forzarGaneEnCurso ? 'Simulación en vivo' : 'Backtracking en vivo'}
                                </span>
                            </button>
                            {forzarGaneResultado && (
                                <div className={`force-win-result ${forzarGaneResultado.tipo}`}>
                                    <span className="force-win-result-label">
                                        {forzarGaneResultado.tipo === 'warning' ? 'Solución en proceso' : 'Solución encontrada'}
                                    </span>
                                    <span className="force-win-result-text">{forzarGaneResultado.texto}</span>
                                    {!victoria && forzarGaneResultado.tipo === 'warning' && (
                                        <div className="force-win-next-steps">
                                            <strong>La computadora sigue con esto:</strong>
                                            {Array.isArray(forzarGanePendientes) && forzarGanePendientes.length > 0 ? (
                                                <div className="force-win-next-steps-list">
                                                    {forzarGanePendientes.map((pendiente, indice) => {
                                                        const rutaTexto = formatearRuta(pendiente.ruta);
                                                        return (
                                                            <div className="force-win-pending-card" key={`${pendiente.accion}-${indice}`}>
                                                                <div className="force-win-pending-top">
                                                                    <span className="force-win-pending-index">{String(indice + 1).padStart(2, '0')}</span>
                                                                    <div className="force-win-pending-copy">
                                                                        <strong>{pendiente.accion}</strong>
                                                                        <span>{pendiente.modulo ? `Destino: ${formatNombre(pendiente.modulo)}` : 'Destino no definido'}</span>
                                                                    </div>
                                                                </div>
                                                                {rutaTexto && rutaTexto !== formatNombre(estado?.moduloActual) && (
                                                                    <div className="force-win-pending-route">Retrocede / avanza: {rutaTexto}</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="force-win-result-text">Buscando la siguiente acción automática.</div>
                                            )}
                                        </div>
                                    )}
                                    {forzarGaneEnCurso && forzarGanePasoActual && (
                                        <span className="force-win-result-text">{forzarGanePasoActual}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* COLUMNA DERECHA */}
                <aside className="col-right">

                    {/* Terminal */}
                    <TerminalConsole
                        log={log}
                        onAyuda={handleAyuda}
                        disabled={bloqueoGeneral}
                        errorActual={errorActual}
                        onDismissError={() => setErrorActual(null)}
                    />

                    {fichaModuloSeleccionado && (
                        <div className="mapa-ruta-info ficha-bajo-bitacora">
                            <div className="mapa-ruta-hero">
                                <span className="mapa-ruta-kicker">Ficha del módulo</span>
                                <span className="mapa-ruta-nombre">
                                    {fichaModuloSeleccionado.esActual ? 'Módulo actual' : 'Destino'} · {formatNombre(fichaModuloSeleccionado.modulo)}
                                </span>
                            </div>

                            <span className="ruta-descripcion">{fichaModuloSeleccionado.descripcion}</span>

                            <div className="mapa-ruta-stats" aria-label="Resumen del módulo">
                                <span className="mapa-ruta-stat">
                                    <strong>{fichaModuloSeleccionado.artefactos.length}</strong>
                                    <small>Artefactos</small>
                                </span>
                                <span className="mapa-ruta-stat">
                                    <strong>{fichaModuloSeleccionado.tripulantes.length}</strong>
                                    <small>Atrapados</small>
                                </span>
                                <span className="mapa-ruta-stat">
                                    <strong>{fichaModuloSeleccionado.rutasPosibles.length}</strong>
                                    <small>Rutas</small>
                                </span>
                            </div>

                            <div className="mapa-ruta-bloque">
                                <span className="mapa-ruta-bloque-titulo">Artefactos</span>
                                {fichaModuloSeleccionado.artefactos.length > 0 ? (
                                    <ul className="mapa-ruta-lista">
                                        {fichaModuloSeleccionado.artefactos.map((artefacto) => (
                                            <li key={artefacto}>{formatNombre(artefacto)}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="mapa-ruta-vacio">No hay artefactos en este módulo.</span>
                                )}
                            </div>

                            <div className="mapa-ruta-bloque">
                                <span className="mapa-ruta-bloque-titulo">Tripulación atrapada</span>
                                {fichaModuloSeleccionado.tripulantes.length > 0 ? (
                                    <ul className="mapa-ruta-lista">
                                        {fichaModuloSeleccionado.tripulantes.map((tripulante, indice) => (
                                            <li key={`${tripulante.nombre || tripulante.tripulante || 'tripulante'}-${indice}`}>
                                                {formatNombre(tripulante.nombre || tripulante.tripulante || 'Tripulante')}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="mapa-ruta-vacio">No hay tripulantes atrapados aquí.</span>
                                )}
                            </div>

                            {fichaModuloSeleccionado.esActual ? (
                                <span className="ruta-posible">Estás en este módulo.</span>
                            ) : fichaModuloSeleccionado.rutasPosibles.length > 0 ? (
                                <div className="mapa-ruta-bloque">
                                    <span className="mapa-ruta-bloque-titulo">Rutas posibles</span>
                                    <ol className="mapa-ruta-lista mapa-ruta-lista-rutas">
                                        {fichaModuloSeleccionado.rutasPosibles.map((ruta, indice) => (
                                            <li key={`${ruta.join('|')}-${indice}`} className={`mapa-ruta-item ${indice === 0 ? 'ruta-posible' : 'ruta-sugerida'}`}>
                                                <span className="mapa-ruta-idx">{indice + 1}</span>
                                                {ruta.map(formatNombre).join(' -> ')}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Acciones contextuales */}
                    <ControlPanel estado={estado} onAccion={handleAccion} disabled={bloqueoGeneral} />

                    {/* Guardar / Cargar */}
                    <div className="panel">
                        <div className="save-zone">
                            <button className="btn-save" onClick={handleGuardar} disabled={bloqueoGeneral}>
                                Guardar Misión
                            </button>
                            <button className="btn-load" onClick={handleOtraPartida} disabled={bloqueoGeneral}>
                                Salir
                            </button>
                        </div>
                    </div>

                </aside>
            </main>

            {/* ── OVERLAY CARGANDO ── */}
            {cargando && (
                <div className="loading-overlay" aria-live="polite">
                    <div className="loading-content">
                        <div className="loading-ring" />
                        <span className="loading-text">Procesando...</span>
                    </div>
                </div>
            )}

            {/* ── OVERLAY VICTORIA ── */}
            {victoria && (
                <div className="victory-overlay">
                    <div className="victory-box">
                        <div className="victory-title">¡Misión Cumplida!</div>
                        <div className="victory-sub">
                            Has restaurado la Estación Atlas y rescatado a toda la tripulación.
                            <br /><br />
                            Tiempo total: <strong>{formatTimer(timer)}</strong>
                        </div>
                        <div className="victory-actions">
                            <button className="victory-btn primary" onClick={handleGuardar} disabled={bloqueoGeneral}>
                                Guardar misión
                            </button>
                            <button className="victory-btn secondary" onClick={handleVerBitacora} disabled={cargandoBitacora || forzarGaneEnCurso}>
                                Ver bitácora de tiempos
                            </button>
                            <button className="victory-btn ghost" onClick={handleOtraPartida} type="button">
                                Otra partida
                            </button>
                        </div>
                    </div>

                    {mostrarBitacora && (
                        <div className="victory-history-panel">
                            <div className="victory-history-header">
                                <span>Bitácora de la partida</span>
                                <button className="victory-history-close" onClick={() => setMostrarBitacora(false)} type="button">
                                    Cerrar
                                </button>
                            </div>
                            <div className="victory-history-summary">
                                Tiempo actual: <strong>{formatTimer(timer)}</strong>
                            </div>
                            <div className="victory-history-list">
                                {bitacoraPartida.length > 0 ? (
                                    bitacoraPartida.map((evento, indice) => (
                                        <div key={`${evento.tiempo}-${indice}`} className="victory-history-item">
                                            <div className="victory-history-main">
                                                <span className="victory-history-name">{evento.tiempo}</span>
                                                <span className="victory-history-id">Evento #{indice + 1}</span>
                                            </div>
                                            <div className="victory-history-meta">
                                                <span className="victory-history-file">{evento.texto}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="victory-history-empty">Todavía no hay eventos registrados en esta partida.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export default Game;
