import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Game.css';
import MapaVisual from '../components/game/MapaVisual';
import ControlPanel from '../components/game/ControlPanel';
import TerminalConsole from '../components/game/TerminalConsole';
import { apiService } from '../services/api';

function formatNombre(nombre) {
    if (!nombre) return '';
    return nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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
function normalizarClave(valor) {
    if (!valor) return '';
    return valor
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function hashTexto(texto) {
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
        hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function getArtefactoIcon(nombre) {
    const clave = normalizarClave(nombre);
    if (!clave) return '🔩';

    if (ARTEFACTO_ICONS[clave]) return ARTEFACTO_ICONS[clave];

    const regla = ARTEFACTO_KEYWORDS.find(({ words }) => words.some((w) => clave.includes(w)));
    if (regla) return regla.icon;

    return ARTEFACTO_FALLBACK_EMOJIS[hashTexto(clave) % ARTEFACTO_FALLBACK_EMOJIS.length];
}

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
function estadoAClase(estado) {
    const n = normalizarEstadoTexto(estado);
    if (n === 'rescatado' || n === 'rescued') return 'rescued';
    return 'trapped';
}

//Componente principal--------------------------------------------------------------------------------
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

    const limpiarErrorVisible = useCallback((texto) => {
        return (texto || '')
            .toString()
            .trim()
            .replace(/^ERROR\s*[:-]?\s*/i, '')
            .trim();
    }, []);

    //Timer de misión--------------------------------------------------------------------------------
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

    const obtenerAudioContexto = useCallback(() => {
        if (audioContextRef.current) return audioContextRef.current;
        const ContextoAudio = window.AudioContext || window.webkitAudioContext;
        if (!ContextoAudio) return null;
        const contexto = new ContextoAudio();
        audioContextRef.current = contexto;
        return contexto;
    }, []);

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

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    useEffect(() => {
        const desbloquearAudio = () => {
            iniciarAudioAmbiente();
        };

        window.addEventListener('pointerdown', desbloquearAudio, { once: true });
        return () => window.removeEventListener('pointerdown', desbloquearAudio);
    }, [iniciarAudioAmbiente]);

    //Actualizar solo estado--------------------------------------------------------------------------------
    const actualizarEstado = useCallback(async () => {
        try {
            const estadoActual = await apiService.obtenerEstado();
            setEstado(estadoActual);
        } catch (e) {
            // silencioso — el log ya habrá mostrado cualquier error
        }
    }, []);

    //Manejar acciones del jugador--------------------------------------------------------------------------------
    const handleAccion = useCallback(async (tipo, valor) => {
        if (!tipo || cargando) return;
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
    }, [cargando, actualizarEstado, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria]);

    //Ayuda de la computadora--------------------------------------------------------------------------------
    const handleAyuda = useCallback(async () => {
        if (cargando) return;
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
    }, [cargando, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria, limpiarErrorVisible]);

    const handleForzarGane = useCallback(async () => {
        if (cargando) return;
        setCargando(true);
        setErrorActual(null);
        iniciarAudioAmbiente();

        const mensajeFallback = 'No se pudo evaluar si esta partida tiene solucion. Verifica que el servidor backend este activo y reinicia la app si acabas de agregar la ruta.';

        try {
            const respuesta = await apiService.forzarGane();
            const textoBase = respuesta.out || '';
            const texto = /<!DOCTYPE|<html/i.test(textoBase)
                ? mensajeFallback
                : limpiarErrorVisible(textoBase || mensajeFallback);
            const tipoResultado = /no tiene solucion|no esta conectado|sin solucion/i.test(texto) ? 'warning' : 'success';

            setForzarGaneResultado({ tipo: tipoResultado, texto });
            setLog(texto);
            reproducirEfecto(tipoResultado === 'warning' ? 'error' : 'ok');
            await evaluarVictoria();
        } catch (e) {
            const mensajeError = e?.message || '';
            const texto = /<!DOCTYPE|<html/i.test(mensajeError)
                ? mensajeFallback
                : limpiarErrorVisible(mensajeError || mensajeFallback);
            setForzarGaneResultado({ tipo: 'warning', texto });
            setLog(texto);
            reproducirEfecto('error');
        } finally {
            setCargando(false);
        }
    }, [cargando, iniciarAudioAmbiente, reproducirEfecto, evaluarVictoria, limpiarErrorVisible]);

    //Guardar / Cargar--------------------------------------------------------------------------------
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

    const handleOtraPartida = useCallback(() => {
        navigate('/');
    }, [navigate]);

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
                                            disabled={cargando}
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
                                disabled={cargando}
                            >
                                <span>Forzar Gane</span>
                                <span className="force-win-btn-sub">Backtracking en vivo</span>
                            </button>
                            {forzarGaneResultado && (
                                <div className={`force-win-result ${forzarGaneResultado.tipo}`}>
                                    <span className="force-win-result-label">
                                        {forzarGaneResultado.tipo === 'warning' ? 'Sin solución' : 'Solución encontrada'}
                                    </span>
                                    <span className="force-win-result-text">{forzarGaneResultado.texto}</span>
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
                        disabled={cargando}
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
                    <ControlPanel estado={estado} onAccion={handleAccion} disabled={cargando} />

                    {/* Guardar / Cargar */}
                    <div className="panel">
                        <div className="save-zone">
                            <button className="btn-save" onClick={handleGuardar} disabled={cargando}>
                                Guardar Misión
                            </button>
                            <button className="btn-load" onClick={handleOtraPartida} disabled={cargando}>
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
                            <button className="victory-btn primary" onClick={handleGuardar} disabled={cargando}>
                                Guardar misión
                            </button>
                            <button className="victory-btn secondary" onClick={handleVerBitacora} disabled={cargandoBitacora}>
                                Ver bitácora de tiempos
                            </button>
                            <button className="victory-btn ghost" onClick={handleOtraPartida}>
                                Otra partida
                            </button>
                        </div>
                    </div>

                    {mostrarBitacora && (
                        <div className="victory-history-panel">
                                <div className="victory-history-header">
                                    <span>Bitácora de la partida</span>
                                <button className="victory-history-close" onClick={() => setMostrarBitacora(false)}>
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
