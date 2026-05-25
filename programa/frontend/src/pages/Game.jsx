import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Game.css';

function Game() {
    const location = useLocation();
    const navigate = useNavigate();
    const operario = location.state?.nombre || "Operario Desconocido";
    
    // Estados del entorno
    const [moduloActual, setModuloActual] = useState('puente_mando');
    const [inventario, setInventario] = useState([]);
    const [visitados, setVisitados] = useState([]);
    const [sistemas, setSistemas] = useState([]);
    const [tripulantes, setTripulantes] = useState([]);
    const [modulosConectados, setModulosConectados] = useState([]);
    
    // Estado de la UI
    const [bitacora, setBitacora] = useState([location.state?.registroInicial || "Enlace establecido con la Estación Orbital ATLAS."]);
    const [loading, setLoading] = useState(false);

    const finBitacoraRef = useRef(null);

    // Auto-scroll para la terminal de la bitácora
    useEffect(() => {
        finBitacoraRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [bitacora]);

    // Consultar el estado global actual
    const refrescarEstadoJuego = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/estado');
            if (res.ok) {
                const data = await res.json();
                setModuloActual(data.moduloActual || 'puente_mando');
                setInventario(data.inventario || []);
                setVisitados(data.visitados || []);
                setSistemas(data.sistemas || []);
                setTripulantes(data.tripulantes || []);
                setModulosConectados(data.modulosConectados || []);
            }
        } catch (err) {
            agregarABitacora("[ERROR] Caída de telemetría: Imposible sincronizar estado estelar.");
        }
    };

    // Al cargar la pantalla por primera vez se sincroniza datos
    useEffect(() => {
        refrescarEstadoJuego();
    }, []);

    const agregarABitacora = (mensaje) => {
        setBitacora(prev => [...prev, mensaje]);
    };

    const ejecutarAccion = async (endpoint, bodyData, accionLabel) => {
        setLoading(false);
        try {
            const res = await fetch(`http://localhost:3000/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();
            
            if (res.ok) {
                agregarABitacora(`> ${accionLabel}: ${data.out || "Comando ejecutado con éxito."}`);
                refrescarEstadoJuego();
                
                //  detectar victoria y avisar
                if (data.out && data.out.includes("Condicion de victoria alcanzada")) {
                    agregarABitacora("ALERTA INTERNA: CRÍTICO - MISIÓN DE EVACUACIÓN SUPERADA CON ÉXITO.");
                    alert("¡Misión Cumplida! Has rescatado la tripulación y estabilizado ATLAS.");
                }
            } else {
                agregarABitacora(`[RECHAZADO] ${data.error || "Restricción lógica de Prolog detectada."}`);
            }
        } catch (err) {
            agregarABitacora("[ERROR] Error de comunicación en el bus de datos intermedio.");
        }
    };

    return (
        <div className="game-container">
            <div className="game-header-wrap">
                <Header />
                <div className="hud-operario">OPERARIO ACTIVO: <span className="neon-text-blue">{operario.toUpperCase()}</span></div>
            </div>

            <div className="game-layout">
                
                {/* PANEL IZQUIERDO: ESTADO DE LA NAVE */}
                <aside className="hud-panel status-panel">
                    <h2 className="panel-title">TELEMETRÍA DE COMPONENTES</h2>
                    
                    <div className="status-section">
                        <h3>INVENTARIO FÍSICO</h3>
                        {inventario.length === 0 ? <p className="empty-text">Sin artefactos cargados</p> : (
                            <ul className="hud-list text-green">
                                {inventario.map((art, idx) => <li key={idx}>⚡ {art.replace('_', ' ')}</li>)}
                            </ul>
                        )}
                    </div>

                    <div className="status-section">
                        <h3>ESTADO DE SISTEMAS</h3>
                        {sistemas.length === 0 ? <p className="empty-text">Consultando núcleos...</p> : (
                            <ul className="hud-list">
                                {sistemas.map((sys, idx) => (
                                    <li key={idx} className={sys.estado === 'restaurado' ? 'text-blue' : 'text-red-blink'}>
                                        [{sys.estado.toUpperCase()}] {sys.sistema.toUpperCase()}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="status-section">
                        <h3>MONITOREO DE TRIPULACIÓN</h3>
                        {tripulantes.length === 0 ? <p className="empty-text">Escaneando señales de vida...</p> : (
                            <ul className="hud-list">
                                {tripulantes.map((trip, idx) => (
                                    <li key={idx} className={trip.estado === 'rescatado' ? 'text-blue' : 'text-yellow'}>
                                         {trip.nombre.toUpperCase()} - <span className="small-status">{trip.estado.toUpperCase()}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* CENTRO DINÁMICO: ACCIONES Y MAPA */}
                <main className="hud-panel control-panel">
                    <div className="location-banner">
                        <span className="banner-tag">SECTOR ACTUAL</span>
                        <h1 className="neon-text-green">{moduloActual.toUpperCase().replace('_', ' ')}</h1>
                    </div>

                    {/* COMPUERTAS ACCESIBLES */}
                    <section className="control-section">
                        <h3>COMPUERTAS DE ENLACE DISPONIBLES</h3>
                        <div className="grid-buttons">
                            {modulosConectados.map((destino, idx) => (
                                <button 
                                    key={idx} 
                                    className="hud-btn btn-nav"
                                    onClick={() => ejecutarAccion('mover', { destino }, `Tránsito a ${destino}`)}
                                >
                                    Navegar hacia {destino.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* INTERACCIONES DE CONTEXTO */}
                    <section className="control-section interactions-block">
                        <h3>ACCIONES DE SUBSISTEMA DE LA SALA</h3>
                        <div className="action-row">
                            
                            {/* Buscar si hay artefactos recolectables en el módulo */}
                            <button 
                                className="hud-btn btn-action color-yellow"
                                onClick={() => {
                                    // recolección general de lo que esté en la sala
                                    const artPorMover = prompt("Escribe el nombre del artefacto que deseas recoger en esta sala (ej. traje_espacial, fusible, tarjeta_seguridad):");
                                    if (artPorMover) ejecutarAccion('tomar', { artefacto: artPorMover }, `Recolectar ${artPorMover}`);
                                }}
                            >
                                RECOLECTAR ARTEFACTO
                            </button>

                            <button 
                                className="hud-btn btn-action color-blue"
                                onClick={() => {
                                    const sistemaRep = prompt("¿Qué sistema de este sector deseas intentar reparar? (ej. energia, comunicaciones, escape):");
                                    if (sistemaRep) ejecutarAccion('reparar', { sistema: sistemaRep }, `Protocolo Reparación ${sistemaRep}`);
                                }}
                            >
                                REPARAR SISTEMA
                            </button>

                            <button 
                                className="hud-btn btn-action color-green"
                                onClick={() => {
                                    const persona = prompt("Nombre del tripulante atrapado en esta sección a evacuar:");
                                    if (persona) ejecutarAccion('rescatar', { tripulante: persona }, `Evacuación de ${persona}`);
                                }}
                            >
                                RESCATAR TRIPULANTE
                            </button>
                        </div>
                    </section>
                </main>
            </div>

            {/* PARTE INFERIOR: TERMINAL DE BITÁCORA */}
            <footer className="hud-panel console-panel">
                <div className="console-header">NÚCLEO DE REGISTRO ATLAS - TERMINAL CRUDE_LOG</div>
                <div className="console-logs">
                    {bitacora.map((log, idx) => (
                        <div key={idx} className="log-line">{log}</div>
                    ))}
                    <div ref={finBitacoraRef} />
                </div>
            </footer>
        </div>
    );
}

export default Game;