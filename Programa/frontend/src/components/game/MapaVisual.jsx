import React, { useMemo } from 'react';

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

function getMeta(nombre) {
    return MODULE_META[nombre] || { icon: '🔷', label: nombre };
}

function formatNombre(nombre) {
    if (!nombre) return 'Desconocido';
    return nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function MapaVisual({ modulos, artefactos, estado }) {
    const listaModulos = Array.isArray(modulos) ? modulos : [];
    const conectados   = Array.isArray(estado?.modulosConectados) ? estado.modulosConectados : [];
    const visitados    = Array.isArray(estado?.visitados) ? estado.visitados : [];
    const moduloActual = estado?.moduloActual || '';
    const sistemas     = Array.isArray(estado?.sistemas) ? estado.sistemas : [];
    const tripulantes  = Array.isArray(estado?.tripulantes) ? estado.tripulantes : [];
    const artefactosDisponibles = Array.isArray(estado?.artefactosDisponibles) ? estado.artefactosDisponibles : [];

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

    // Divide módulos en filas------------------------------------------------------------------------------------
    const chunkArray = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
    };

    const cols = listaModulos.length <= 4 ? listaModulos.length : listaModulos.length <= 6 ? 3 : 4;
    const filas = chunkArray(listaModulos, cols);

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
                </div>
            </div>

            <div className="mapa-grid">
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
                                <div key={modulo} className={clases}>
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
