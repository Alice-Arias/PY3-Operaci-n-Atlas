import { useMemo, useState } from 'react';
import atlasBackground from '../../assets/Fondo2.png';

// Iconos para representar los modulos
const MODULE_META = {
    puente_mando:          { icon: '🖥️', label: 'Puente de Mando' },
    laboratorio:           { icon: '🔬', label: 'Laboratorio' },
    modulo_energia:        { icon: '⚡', label: 'Módulo Energía' },
    enfermeria:            { icon: '🏥', label: 'Enfermería' },
    modulo_escape:         { icon: '🚀', label: 'Módulo Escape' },
    modulo_medico:         { icon: '💊', label: 'Módulo Médico' },
    camaras_seguridad:     { icon: '📷', label: 'Cámaras Seguridad' },
    centro_comunicaciones: { icon: '📡', label: 'Comunicaciones' },
    almacen:               { icon: '📦', label: 'Almacén' },
    habitaciones:          { icon: '🛏️', label: 'Habitaciones' },
    hangar:                { icon: '🛸', label: 'Hangar' },
    invernadero:           { icon: '🌿', label: 'Invernadero' },
};

const MODULE_KEYWORDS = [
    { words: ['puente', 'mando', 'control'], icon: '🖥️' },
    { words: ['laboratorio', 'lab', 'investigacion'], icon: '🔬' },
    { words: ['energia', 'reactor', 'power'], icon: '⚡' },
    { words: ['enfermeria', 'medico', 'medica', 'salud'], icon: '🏥' },
    { words: ['escape', 'hangar', 'nave', 'lanzamiento'], icon: '🚀' },
    { words: ['seguridad', 'camara', 'vigilancia'], icon: '📷' },
    { words: ['comunicacion', 'comms', 'radio', 'antena'], icon: '📡' },
    { words: ['almacen', 'deposito', 'carga'], icon: '📦' },
    { words: ['habitacion', 'dormitorio', 'cuarto'], icon: '🛏️' },
    { words: ['invernadero', 'jardin', 'planta', 'bio'], icon: '🌿' },
    { words: ['modulo', 'sector', 'nucleo'], icon: '🧩' },
];

const MODULE_FALLBACK_EMOJIS = ['🛰️', '🧭', '🧪', '🧰', '⚙️', '🔷', '🛡️', '🗺️'];

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

function getModuloIcon(nombre) {
    const clave = normalizarClave(nombre);
    if (!clave) return '🔷';

    if (MODULE_META[clave]?.icon) return MODULE_META[clave].icon;

    const regla = MODULE_KEYWORDS.find(({ words }) => words.some((w) => clave.includes(w)));
    if (regla) return regla.icon;

    return MODULE_FALLBACK_EMOJIS[hashTexto(clave) % MODULE_FALLBACK_EMOJIS.length];
}

function getMeta(nombre) {
    const base = MODULE_META[nombre] || {};
    return {
        icon: base.icon || getModuloIcon(nombre),
        label: base.label || formatNombre(nombre),
    };
}

function formatNombre(nombre) {
    if (!nombre) return 'Desconocido';
    return nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function construirGrafoBidireccional(conexiones) {
    const grafo = new Map();

    conexiones.forEach(({ origen, destino }) => {
        if (!grafo.has(origen)) grafo.set(origen, new Set());
        if (!grafo.has(destino)) grafo.set(destino, new Set());
        grafo.get(origen).add(destino);
        grafo.get(destino).add(origen);
    });

    return grafo;
}

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

function construirConexionesDeRespaldo(moduloActual, conectados) {
    return conectados.map((destino) => ({ origen: moduloActual, destino }));
}

function buscarRutasAlternativas(origen, destino, conexiones, limite = 3) {
    if (!origen || !destino) return [];
    if (origen === destino) return [[origen]];

    const grafo = construirGrafoBidireccional(conexiones);
    const rutas = [];

    const dfs = (actual, camino, visitados) => {
        if (rutas.length >= limite) return;
        if (actual === destino) {
            rutas.push([...camino]);
            return;
        }

        const vecinos = Array.from(grafo.get(actual) || []);
        vecinos.sort((a, b) => a.localeCompare(b));

        for (const vecino of vecinos) {
            if (visitados.has(vecino)) continue;
            visitados.add(vecino);
            camino.push(vecino);
            dfs(vecino, camino, visitados);
            camino.pop();
            visitados.delete(vecino);
            if (rutas.length >= limite) return;
        }
    };

    dfs(origen, [origen], new Set([origen]));

    return rutas
        .sort((a, b) => a.length - b.length || a.join('>').localeCompare(b.join('>')))
        .slice(0, limite);
}

function crearSetAristasDesdeRuta(ruta) {
    const setAristas = new Set();
    for (let i = 0; i < ruta.length - 1; i += 1) {
        const a = ruta[i];
        const b = ruta[i + 1];
        setAristas.add(`${a}|${b}`);
        setAristas.add(`${b}|${a}`);
    }
    return setAristas;
}

function MapaVisual({ modulos, conexiones, estado, descripcionesModulos = {} }) {
    const listaModulos = useMemo(() => (Array.isArray(modulos) ? modulos : []), [modulos]);
    const listaConexiones = useMemo(() => (Array.isArray(conexiones) ? conexiones : []), [conexiones]);
    const conectados   = useMemo(() => (Array.isArray(estado?.modulosConectados) ? estado.modulosConectados : []), [estado]);
    const visitados    = Array.isArray(estado?.visitados) ? estado.visitados : [];
    const moduloActual = estado?.moduloActual || '';
    const sistemas     = useMemo(() => (Array.isArray(estado?.sistemas) ? estado.sistemas : []), [estado]);
    const tripulantes  = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
    const artefactosDisponibles = Array.isArray(estado?.artefactosDisponibles) ? estado.artefactosDisponibles : [];
    const [moduloSeleccionado, setModuloSeleccionado] = useState('');

    //estado visual de cada módulo------------------------------------------------------------------------------------
    const statusModulo = useMemo(() => {
        const map = {};
        listaModulos.forEach(m => {
            const sistemasFallados = sistemas.filter(s => s.modulo === m && s.estado === 'fallo');
            const sistemasReparando = sistemas.filter(s => s.modulo === m && s.estado === 'reparando');
            if (sistemasReparando.length > 0) map[m] = 'reparando';
            else if (sistemasFallados.length > 0) map[m] = 'fallo';
            else map[m] = 'operativo';
        });
        return map;
    }, [listaModulos, sistemas]);

    const getStatusLabel = (status) => {
        if (status === 'fallo') return 'Sin Reparar';
        if (status === 'reparando') return 'En Reparación';
        return 'Operativo';
    };

    // Artefactos en un módulo------------------------------------------------------------------------------------
    const artefactosEnModulo = (modulo) =>
        artefactosDisponibles.filter(a => a.modulo === modulo).map(a => a.artefacto);

    // Tripulantes atrapados------------------------------------------------------------------------------------
    const tripulantesEnModulo = (modulo) =>
        tripulantes.filter(t => t.modulo === modulo && t.estado === 'atrapado');

    const cols = listaModulos.length <= 4 ? listaModulos.length : listaModulos.length <= 6 ? 3 : 4;

    const conexionesParaGrafo = useMemo(() => {
        if (listaConexiones.length > 0) return listaConexiones;
        if (!moduloActual || conectados.length === 0) return [];
        return construirConexionesDeRespaldo(moduloActual, conectados);
    }, [listaConexiones, moduloActual, conectados]);

    const rutasSugeridas = useMemo(() => {
        if (!moduloSeleccionado || !moduloActual) return [];
        return buscarRutasAlternativas(moduloActual, moduloSeleccionado, conexionesParaGrafo, 3);
    }, [moduloActual, moduloSeleccionado, conexionesParaGrafo]);

    const rutaSugerida = rutasSugeridas[0] || [];
    const aristasRuta = useMemo(() => crearSetAristasDesdeRuta(rutaSugerida), [rutaSugerida]);

    const destinoEsDirecto = moduloSeleccionado && conectados.includes(moduloSeleccionado);
    const descripcionModuloSeleccionado = moduloSeleccionado
        ? (descripcionesModulos[moduloSeleccionado] || 'Sin descripcion disponible para este modulo.')
        : '';

    const layoutGrafo = useMemo(() => {
        const total = listaModulos.length;
        if (total === 0) return { posiciones: [], lineas: [] };

        const centroX = 50;
        const centroY = 50;
        const radio = total <= 6 ? 36 : 42;

        const posiciones = listaModulos.map((modulo, indice) => {
            const angulo = ((Math.PI * 2) / total) * indice - (Math.PI / 2);
            const x = centroX + radio * Math.cos(angulo);
            const y = centroY + radio * Math.sin(angulo);
            return { modulo, x, y };
        });

        const mapaPosiciones = new Map(posiciones.map((nodo) => [nodo.modulo, nodo]));
        const lineas = conexionesParaGrafo
            .map(({ origen, destino }) => {
                const desde = mapaPosiciones.get(origen);
                const hacia = mapaPosiciones.get(destino);
                if (!desde || !hacia) return null;
                const activa = moduloActual === desde.modulo || moduloActual === hacia.modulo;
                return {
                    clave: `${desde.modulo}|${hacia.modulo}`,
                    x1: desde.x,
                    y1: desde.y,
                    x2: hacia.x,
                    y2: hacia.y,
                    activa
                };
            })
            .filter(Boolean);

        return { posiciones, lineas };
    }, [listaModulos, conexionesParaGrafo, moduloActual]);

    return (
        <div className="mapa-container">
            <div className="mapa-bg-grid" aria-hidden="true" />

            <div className="mapa-header">
                <span className="mapa-title">Mapa de la Estación Atlas</span>
                <div className="mapa-legend">
                    <span className="legend-item">
                        <span className="legend-dot green" />Operativo
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot red" />Sin reparar
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot amber" />En reparación
                    </span>
                        <span className="legend-item">
                            <span className="legend-dot cyan" />Módulo actual
                        </span>
                        <span className="legend-item">
                            <span className="legend-dot gray" />Sin acceso directo
                        </span>
                </div>
            </div>

            <div className="mapa-grid">
                {listaModulos.length > 0 && (
                    <div className="mapa-grafo" aria-label="Grafo de conexiones entre modulos">
                        <img
                            className="mapa-grafo-fondo"
                            src={atlasBackground}
                            alt=""
                            aria-hidden="true"
                        />
                        <div className="mapa-grafo-overlay" aria-hidden="true" />
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mapa-grafo-svg">
                            {layoutGrafo.lineas.map((linea) => (
                                (() => {
                                    const enRuta = aristasRuta.has(linea.clave);
                                    let claseLinea = 'linea-grafo';

                                    if (enRuta && moduloSeleccionado && moduloSeleccionado !== moduloActual) {
                                        claseLinea = destinoEsDirecto ? 'linea-grafo posible' : 'linea-grafo sugerida';
                                    } else if (linea.activa) {
                                        claseLinea = 'linea-grafo activa';
                                    } else if (moduloSeleccionado && moduloSeleccionado !== moduloActual) {
                                        claseLinea = 'linea-grafo tenue';
                                    }

                                    return (
                                        <line
                                            key={linea.clave}
                                            x1={linea.x1}
                                            y1={linea.y1}
                                            x2={linea.x2}
                                            y2={linea.y2}
                                            className={claseLinea}
                                        />
                                    );
                                })()
                            ))}
                        </svg>

                        {layoutGrafo.posiciones.map((nodo) => {
                            const esActual = nodo.modulo === moduloActual;
                            const esConectado = conectados.includes(nodo.modulo);
                            const claseNodo = esActual ? 'nodo-grafo actual' : esConectado ? 'nodo-grafo conectado' : 'nodo-grafo';

                            return (
                                <div
                                    key={nodo.modulo}
                                    className={claseNodo}
                                    style={{ left: `${nodo.x}%`, top: `${nodo.y}%` }}
                                    title={formatNombre(nodo.modulo)}
                                    onClick={() => setModuloSeleccionado(nodo.modulo)}
                                >
                                    <span className="nodo-grafo-punto" />
                                    <span className="nodo-grafo-texto">{formatNombre(nodo.modulo)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {moduloSeleccionado && (
                    <div className="mapa-ruta-info">
                        <div className="mapa-ruta-row">
                            <span className="ruta-etiqueta ruta-destino">Destino</span>
                            <strong className="ruta-valor ruta-valor-destino">{formatNombre(moduloSeleccionado)}</strong>
                        </div>
                        <div className="ruta-descripcion">
                            <span className="ruta-etiqueta ruta-info">Descripción</span>
                            <span className="ruta-texto-descripcion">{descripcionModuloSeleccionado}</span>
                        </div>
                        {moduloSeleccionado === moduloActual && (
                            <span className="ruta-nota ruta-nota-cyan">Ya estás en este módulo.</span>
                        )}
                        {moduloSeleccionado !== moduloActual && rutasSugeridas.length > 0 && (
                            <div className="ruta-lista">
                                {rutasSugeridas.map((ruta, indice) => (
                                    <div key={`${ruta.join('|')}-${indice}`} className="ruta-opcion">
                                        <span className="ruta-etiqueta ruta-sugerida-label">Ruta {indice + 1}</span>
                                        <span className="ruta-camino ruta-camino-sugerida">{ruta.map(formatNombre).join(' -> ')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {moduloSeleccionado !== moduloActual && rutasSugeridas.length === 0 && conexionesParaGrafo.length > 0 && !destinoEsDirecto && (
                            <span className="ruta-nota ruta-nota-roja">Ese módulo no tiene acceso directo desde tu posición actual.</span>
                        )}
                    </div>
                )}

                {listaModulos.length === 0 ? (
                    <p style={{ color: 'var(--c-text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textAlign: 'center', padding: '40px' }}>
                        Cargando mapa de la estación...
                    </p>
                ) : (
                    <div
                        className="modules-grid"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    >
                        {listaModulos.map((modulo) => {
                            const status = statusModulo[modulo] || 'operativo';
                            const esActual = modulo === moduloActual;
                            const esConectado = conectados.includes(modulo);
                            const esVisitado = visitados.includes(modulo);
                            const meta = getMeta(modulo);
                            const arts = artefactosEnModulo(modulo);
                            const trips = tripulantesEnModulo(modulo);

                            let clases = `module-card status-${status}`;
                            if (esActual) clases += ' es-actual';
                            else if (esConectado) clases += ' es-conectado';
                            else if (esVisitado) clases += ' es-visitado';

                            return (
                                <div key={modulo} className={clases} onClick={() => setModuloSeleccionado(modulo)}>
                                    <div className="module-card-top">
                                        <div className={`module-icon-wrap status-${status}`}>
                                            {meta.icon}
                                        </div>
                                        <div className={`module-status-indicator status-${status}`}>
                                            <span className="status-dot-sm" />
                                            {getStatusLabel(status)}
                                        </div>
                                    </div>

                                    <div className="module-name">{formatNombre(modulo)}</div>

                                    <div className="module-meta">
                                        {esActual && <span className="module-tag actual">◉ Aquí</span>}
                                        {esConectado && !esActual && <span className="module-tag conectado">→ Accesible</span>}
                                        {arts.length > 0 && (
                                            <span className="module-tag artefactos">
                                                {arts.length} artefacto{arts.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {trips.length > 0 && (
                                            <span className="module-tag tripulante">
                                                {trips.length} atrapado{trips.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {esActual && (
                                        <div className="player-here-badge" aria-label="Ubicación actual">🧑‍🚀</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapaVisual;
