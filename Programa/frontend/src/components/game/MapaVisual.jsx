import { useEffect, useMemo, useState } from 'react';
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

function obtenerRutasAlternativas(origen, destino, conexiones, limite = 3) {
    if (!origen || !destino || origen === destino) return [];

    const grafo = construirGrafoBidireccional(conexiones);
    if (!grafo.has(origen) || !grafo.has(destino)) return [];

    const rutas = [];
    const caminoActual = [origen];
    const visitados = new Set([origen]);
    const profundidadMaxima = Math.max(grafo.size, 1);

    const explorar = (actual) => {
        if (rutas.length >= limite || caminoActual.length > profundidadMaxima + 1) return;

        const vecinos = [...(grafo.get(actual) || [])].sort();
        for (const vecino of vecinos) {
            if (visitados.has(vecino)) continue;

            caminoActual.push(vecino);
            visitados.add(vecino);

            if (vecino === destino) {
                rutas.push([...caminoActual]);
            } else {
                explorar(vecino);
            }

            caminoActual.pop();
            visitados.delete(vecino);

            if (rutas.length >= limite) return;
        }
    };

    explorar(origen);

    return rutas
        .sort((rutaA, rutaB) => rutaA.length - rutaB.length || rutaA.join('|').localeCompare(rutaB.join('|')))
        .slice(0, limite);
}

function MapaVisual({
    modulos,
    conexiones,
    estado,
    descripcionesModulos = {},
    mostrarFichaModulo = true,
    onFichaModuloChange,
}) {
    const listaModulos = useMemo(() => (Array.isArray(modulos) ? modulos : []), [modulos]);
    const listaConexiones = useMemo(() => (Array.isArray(conexiones) ? conexiones : []), [conexiones]);
    const conectados = useMemo(() => (Array.isArray(estado?.modulosConectados) ? estado.modulosConectados : []), [estado]);
    const visitados = Array.isArray(estado?.visitados) ? estado.visitados : [];
    const moduloActual = estado?.moduloActual || '';
    const sistemas = useMemo(() => (Array.isArray(estado?.sistemas) ? estado.sistemas : []), [estado]);
    const tripulantes = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
    const artefactosDisponibles = Array.isArray(estado?.artefactosDisponibles) ? estado.artefactosDisponibles : [];
    const [moduloSeleccionado, setModuloSeleccionado] = useState('');

    //estado visual de cada módulo------------------------------------------------------------------------------------
    const statusModulo = useMemo(() => {
        const map = {};
        listaModulos.forEach((m) => {
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

    const tieneAccionPendiente = (modulo) => {
        const estado = statusModulo[modulo] || 'operativo';
        return estado === 'fallo' || estado === 'reparando' || tripulantesEnModulo(modulo).length > 0;
    };

    const cols = listaModulos.length <= 4 ? listaModulos.length : listaModulos.length <= 6 ? 3 : 4;

    const conexionesParaGrafo = useMemo(() => {
        if (listaConexiones.length > 0) return listaConexiones;
        if (!moduloActual || conectados.length === 0) return [];
        return construirConexionesDeRespaldo(moduloActual, conectados);
    }, [listaConexiones, moduloActual, conectados]);

    const rutaSugerida = useMemo(() => {
        if (!moduloSeleccionado || !moduloActual) return [];
        return buscarRutaMasCorta(moduloActual, moduloSeleccionado, conexionesParaGrafo);
    }, [moduloActual, moduloSeleccionado, conexionesParaGrafo]);

    const rutasPosibles = useMemo(() => {
        if (!moduloSeleccionado || !moduloActual) return [];
        if (moduloSeleccionado === moduloActual) return [];
        return obtenerRutasAlternativas(moduloActual, moduloSeleccionado, conexionesParaGrafo, 3);
    }, [moduloActual, moduloSeleccionado, conexionesParaGrafo]);

    const aristasRuta = useMemo(() => crearSetAristasDesdeRuta(rutaSugerida), [rutaSugerida]);

    const destinoEsDirecto = moduloSeleccionado && conectados.includes(moduloSeleccionado);
    const descripcionModuloSeleccionado = moduloSeleccionado
        ? (descripcionesModulos[moduloSeleccionado] || 'Sin descripcion disponible para este modulo.')
        : '';
    const artefactosModuloSeleccionado = moduloSeleccionado ? artefactosEnModulo(moduloSeleccionado) : [];
    const tripulantesModuloSeleccionado = moduloSeleccionado ? tripulantesEnModulo(moduloSeleccionado) : [];
    const moduloSeleccionadoEsActual = moduloSeleccionado && moduloSeleccionado === moduloActual;
    const fichaModuloSeleccionado = useMemo(() => {
        if (!moduloSeleccionado) return null;

        return {
            modulo: moduloSeleccionado,
            moduloActual,
            esActual: moduloSeleccionadoEsActual,
            descripcion: descripcionModuloSeleccionado,
            artefactos: artefactosModuloSeleccionado,
            tripulantes: tripulantesModuloSeleccionado,
            rutasPosibles,
        };
    }, [moduloSeleccionado, moduloActual, moduloSeleccionadoEsActual, descripcionModuloSeleccionado, artefactosModuloSeleccionado, tripulantesModuloSeleccionado, rutasPosibles]);

    useEffect(() => {
        if (typeof onFichaModuloChange !== 'function') return;
        onFichaModuloChange(fichaModuloSeleccionado);
    }, [onFichaModuloChange, fichaModuloSeleccionado]);

    useEffect(() => {
        if (!moduloActual) return;
        if (!moduloSeleccionado) {
            setModuloSeleccionado(moduloActual);
        }
    }, [moduloActual, moduloSeleccionado]);

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
                    activa,
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
                            const estadoNodo = statusModulo[nodo.modulo] || 'operativo';
                            const haySeleccion = Boolean(moduloSeleccionado);
                            const esInaccesible = haySeleccion && nodo.modulo !== moduloSeleccionado && !esActual && !esConectado;
                            const esAccionable = haySeleccion && !esActual && esConectado && tieneAccionPendiente(nodo.modulo);
                            let claseNodo = `nodo-grafo ${estadoNodo}`;

                            if (esActual) {
                                claseNodo = 'nodo-grafo actual';
                            } else if (esInaccesible) {
                                claseNodo = 'nodo-grafo inaccesible';
                            } else if (esAccionable) {
                                claseNodo = 'nodo-grafo accionable';
                            }

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

                {mostrarFichaModulo && moduloSeleccionado && (
                    <div className="mapa-ruta-info">
                        <div className="mapa-ruta-hero">
                            <span className="mapa-ruta-kicker">Ficha del módulo</span>
                            <span className="mapa-ruta-nombre">
                                {moduloSeleccionadoEsActual ? 'Módulo actual' : 'Destino'} · {formatNombre(moduloSeleccionado)}
                            </span>
                        </div>

                        <span className="ruta-descripcion">{descripcionModuloSeleccionado}</span>

                        <div className="mapa-ruta-stats" aria-label="Resumen del módulo">
                            <span className="mapa-ruta-stat">
                                <strong>{artefactosModuloSeleccionado.length}</strong>
                                <small>Artefactos</small>
                            </span>
                            <span className="mapa-ruta-stat">
                                <strong>{tripulantesModuloSeleccionado.length}</strong>
                                <small>Atrapados</small>
                            </span>
                            <span className="mapa-ruta-stat">
                                <strong>{rutasPosibles.length}</strong>
                                <small>Rutas</small>
                            </span>
                        </div>

                        <div className="mapa-ruta-bloque">
                            <span className="mapa-ruta-bloque-titulo">Artefactos</span>
                            {artefactosModuloSeleccionado.length > 0 ? (
                                <ul className="mapa-ruta-lista">
                                    {artefactosModuloSeleccionado.map((artefacto) => (
                                        <li key={artefacto}>{formatNombre(artefacto)}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="mapa-ruta-vacio">No hay artefactos en este módulo.</span>
                            )}
                        </div>

                        <div className="mapa-ruta-bloque">
                            <span className="mapa-ruta-bloque-titulo">Tripulación atrapada</span>
                            {tripulantesModuloSeleccionado.length > 0 ? (
                                <ul className="mapa-ruta-lista">
                                    {tripulantesModuloSeleccionado.map((tripulante, indice) => (
                                        <li key={`${tripulante.nombre || tripulante.tripulante || 'tripulante'}-${indice}`}>
                                            {formatNombre(tripulante.nombre || tripulante.tripulante || 'Tripulante')}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="mapa-ruta-vacio">No hay tripulantes atrapados aquí.</span>
                            )}
                        </div>

                        {moduloSeleccionadoEsActual ? (
                            <span className="ruta-posible">Estás en este módulo.</span>
                        ) : rutasPosibles.length > 0 ? (
                            <div className="mapa-ruta-bloque">
                                <span className="mapa-ruta-bloque-titulo">Rutas posibles</span>
                                <ol className="mapa-ruta-lista mapa-ruta-lista-rutas">
                                    {rutasPosibles.map((ruta, indice) => (
                                        <li key={`${ruta.join('|')}-${indice}`} className={`mapa-ruta-item ${indice === 0 ? 'ruta-posible' : 'ruta-sugerida'}`}>
                                            <span className="mapa-ruta-idx">{indice + 1}</span>
                                            {ruta.map(formatNombre).join(' -> ')}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ) : moduloSeleccionado !== moduloActual && conexionesParaGrafo.length > 0 ? (
                            <span className="ruta-sugerida">No se encontraron rutas desde tu posición actual.</span>
                        ) : null}
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
                            const esAccionable = esConectado && tieneAccionPendiente(modulo);
                            const esSinAcceso = !esActual && !esConectado;
                            const esVisitado = visitados.includes(modulo);
                            const meta = getMeta(modulo);
                            const arts = artefactosEnModulo(modulo);
                            const trips = tripulantesEnModulo(modulo);

                            let clases = `module-card status-${status}`;
                            if (esActual) clases += ' es-actual';
                            else if (esAccionable) clases += ' es-accionable';
                            else if (esConectado) clases += ' es-conectado';
                            else if (esSinAcceso) clases += ' es-noacceso';
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