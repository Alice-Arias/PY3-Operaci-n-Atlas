import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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

function getArtefactoIcon(nombre) {
    return ARTEFACTO_ICONS[nombre] || '🔩';
}

//Componente principal--------------------------------------------------------------------------------
function Game() {
    const location   = useLocation();
    const playerName = location.state?.nombre || 'OPERADOR';

    const [log, setLog]       = useState('Bienvenido a la Estación Atlas. Misión iniciada.');
    const [modulos, setModulos]     = useState([]);
    const [estado, setEstado]       = useState(null);
    const [cargando, setCargando]   = useState(false);
    const [errorActual, setErrorActual] = useState(null);
    const [victoria, setVictoria]   = useState(false);
    const [timer, setTimer]         = useState(0);
    const timerRef = useRef(null);

    //Timer de misión--------------------------------------------------------------------------------
    useEffect(() => {
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    //Carga inicial--------------------------------------------------------------------------------
    const cargarDatos = useCallback(async () => {
        try {
            const [mods, estadoActual] = await Promise.all([
                apiService.obtenerModulos(),
                apiService.obtenerEstado(),
            ]);
            setModulos(mods);
            setEstado(estadoActual);
        } catch (e) {
            setLog('Error al cargar los datos del juego. Verifica que el servidor esté activo.');
        }
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

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

        try {
            const respuesta = await apiService.enviarComando(tipo, valor);
            const mensajeSalida = respuesta.out || 'Acción procesada.';
            setLog(mensajeSalida);

            if (respuesta.estado) {
                setEstado(respuesta.estado);
            } else {
                await actualizarEstado();
            }

// ------------------------------------------Verificar victoria------------------------------------------------------
            if (
                mensajeSalida.toLowerCase().includes('ganaste') ||
                mensajeSalida.toLowerCase().includes('victoria') ||
                mensajeSalida.toLowerCase().includes('mision cumplida') ||
                mensajeSalida.toLowerCase().includes('misión cumplida')
            ) {
                clearInterval(timerRef.current);
                setVictoria(true);
            }
        } catch (e) {
            const msg = e.message || 'Comando inválido.';
            setLog(`Error: ${msg}`);
            setErrorActual(msg);
            await actualizarEstado();
        } finally {
            setCargando(false);
        }
    }, [cargando, actualizarEstado]);

    //Ayuda de la computadora--------------------------------------------------------------------------------
    const handleAyuda = useCallback(async () => {
        if (cargando) return;
        setCargando(true);
        setErrorActual(null);
        try {
            const respuesta = await apiService.solicitarAyuda();
            setLog(respuesta.out || 'Computadora: sin novedades.');
            if (respuesta.estado) setEstado(respuesta.estado);
        } catch (e) {
            setLog('Error al contactar la computadora de a bordo.');
        } finally {
            setCargando(false);
        }
    }, [cargando]);

    //Guardar / Cargar--------------------------------------------------------------------------------
    const handleGuardar = useCallback(async () => {
        try {
            await apiService.guardarMision();
            setLog('Partida guardada correctamente.');
        } catch (e) {
            setLog('Error al guardar la partida.');
        }
    }, []);

    const handleCargar = useCallback(async () => {
        try {
            await apiService.cargarMision();
            setLog('Partida cargada. Reanudando misión...');
            await cargarDatos();
        } catch (e) {
            setLog('Error al cargar la partida.');
        }
    }, [cargarDatos]);

    //Calcular progreso general--------------------------------------------------------------------------------
    const progreso = React.useMemo(() => {
        const sistemas   = Array.isArray(estado?.sistemas) ? estado.sistemas : [];
        const tripulantes = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
        const total      = sistemas.length + tripulantes.length;
        if (total === 0) return 0;
        const restaurados = sistemas.filter(s => s.estado === 'restaurado').length;
        const rescatados  = tripulantes.filter(t => t.estado === 'rescatado').length;
        return Math.round(((restaurados + rescatados) / total) * 100);
    }, [estado]);

    const inventario    = Array.isArray(estado?.inventario) ? estado.inventario : [];
    const tripulantes   = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
    const moduloActual  = estado?.moduloActual || '—';

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
                            <div className="panel-header-icon cyan"></div>
                            <span className="panel-title">Ingeniero</span>
                        </div>
                        <div className="profile-card">
                            <div className="profile-avatar"></div>
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
                                    tripulantes.map(t => {
                                        const initials = t.nombre
                                            ? t.nombre.slice(0, 2).toUpperCase()
                                            : '??';
                                        const status = t.estado || 'atrapado';
                                        return (
                                            <div key={t.nombre} className="crew-member">
                                                <div className={`crew-avatar ${status}`}>{initials}</div>
                                                <div className="crew-info">
                                                    <span className="crew-name">{formatNombre(t.nombre)}</span>
                                                    <span className="crew-location">{formatNombre(t.modulo)}</span>
                                                </div>
                                                <span className={`crew-status-badge ${status}`}>
                                                    {status === 'rescatado' ? 'Rescatado' : 'Atrapado'}
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
                    <MapaVisual modulos={modulos} estado={estado} />

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

                    {/* Acciones contextuales */}
                    <ControlPanel estado={estado} onAccion={handleAccion} disabled={cargando} />

                    {/* Guardar / Cargar */}
                    <div className="panel">
                        <div className="save-zone">
                            <button className="btn-save" onClick={handleGuardar} disabled={cargando}>
                                Guardar Misión
                            </button>
                            <button className="btn-load" onClick={handleCargar} disabled={cargando}>
                                Cargar Misión
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
                            Has restaurado la Estación Atlas y rescatado a la tripulación.
                            <br /><br />
                            Tiempo total: <strong>{formatTimer(timer)}</strong>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Game;
