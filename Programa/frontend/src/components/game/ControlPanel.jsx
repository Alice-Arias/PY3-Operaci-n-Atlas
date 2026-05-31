import React from 'react';

// Nombre: formatNombre/1
// Descripcion: convierte un identificador interno en texto legible.
// Entrada: nombre con guiones bajos.
// Salida: texto con espacios y capitalizacion inicial.
// Restricciones: solo formatea cadenas simples.
// Objetivo: mostrar nombres de modulos y acciones en la interfaz.
function formatNombre(nombre) {
    if (!nombre) return '';
    return nombre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Nombre: ControlPanel
// Descripcion: presenta los botones de movimiento, toma, reparacion y rescate.
// Entrada: estado de juego, callback de accion y bandera de deshabilitado.
// Salida: un panel React con acciones disponibles.
// Restricciones: depende del estado actual para saber que botones mostrar.
// Objetivo: ofrecer al jugador un acceso rapido a las acciones principales.
function ControlPanel({ estado, onAccion, disabled }) {
    const moduloActual        = estado?.moduloActual || 'desconocido';
    const conectados          = Array.isArray(estado?.modulosConectados) ? estado.modulosConectados : [];
    const inventario          = Array.isArray(estado?.inventario) ? estado.inventario : [];
    const sistemasFallados    = Array.isArray(estado?.sistemas)
        ? estado.sistemas.filter(s => s.modulo === moduloActual && s.estado === 'fallo')
        : [];
    const tripulantesAtrapados = Array.isArray(estado?.tripulantes)
        ? estado.tripulantes.filter(t => t.modulo === moduloActual && t.estado === 'atrapado')
        : [];
    const artefactosAquí      = Array.isArray(estado?.artefactosDisponibles)
        ? estado.artefactosDisponibles.filter(a => a.modulo === moduloActual)
        : [];

    return (
        <div className="panel">
            <div className="panel-header">
                <span className="panel-title">Controles de Misión</span>
            </div>

            <div className="panel-body">

                {/* gestión de posibles movimientos */}
                <div className="actions-section">
                    <div className="action-group-label">Movimiento — módulos accesibles</div>
                    {conectados.length > 0 ? (
                        conectados.map(destino => (
                            <button
                                key={destino}
                                className="move-btn"
                                onClick={() => onAccion('mover', destino)}
                                disabled={disabled}
                                title={`Moverse a ${formatNombre(destino)}`}
                            >
                                <span>{formatNombre(destino)}</span>
                                <span className="move-btn-arrow">→</span>
                            </button>
                        ))
                    ) : (
                        <div className="action-empty">Sin rutas accesibles desde aquí</div>
                    )}
                </div>

                {/* artefactos por modulos */}
                <div className="actions-section">
                    <div className="action-group-label">Artefactos disponibles</div>
                    {artefactosAquí.length > 0 ? (
                        artefactosAquí.map(item => (
                            <button
                                key={item.artefacto}
                                className="action-btn take"
                                onClick={() => onAccion('tomar', item.artefacto)}
                                disabled={disabled || inventario.includes(item.artefacto)}
                                title={`Tomar ${formatNombre(item.artefacto)}`}
                            >
                                <span className="action-btn-icon">🔧</span>
                                <span>
                                    {inventario.includes(item.artefacto)
                                        ? `${formatNombre(item.artefacto)} (en inventario)`
                                        : `Tomar ${formatNombre(item.artefacto)}`
                                    }
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="action-empty">No hay artefactos a la vista</div>
                    )}
                </div>

                {/* reparacion de modulos */}
                <div className="actions-section">
                    <div className="action-group-label">Sistemas por reparar</div>
                    {sistemasFallados.length > 0 ? (
                        sistemasFallados.map(sistema => (
                            <button
                                key={`${sistema.modulo}-${sistema.sistema}`}
                                className="action-btn repair"
                                onClick={() => onAccion('reparar', sistema.sistema)}
                                disabled={disabled}
                                title={`Reparar sistema ${formatNombre(sistema.sistema)}`}
                            >
                                <span className="action-btn-icon">🛠️</span>
                                <span>Reparar {formatNombre(sistema.sistema)}</span>
                            </button>
                        ))
                    ) : (
                        <div className="action-empty">Módulo operando con normalidad</div>
                    )}
                </div>

                {/* tripulantes atrapados */}
                <div className="actions-section">
                    <div className="action-group-label">Tripulación atrapada aquí</div>
                    {tripulantesAtrapados.length > 0 ? (
                        tripulantesAtrapados.map(tripulante => (
                            <button
                                key={tripulante.nombre}
                                className="action-btn rescue"
                                onClick={() => onAccion('rescatar', tripulante.nombre)}
                                disabled={disabled}
                                title={`Rescatar a ${formatNombre(tripulante.nombre)}`}
                            >
                                <span className="action-btn-icon">🧑‍🚀</span>
                                <span>Rescatar {formatNombre(tripulante.nombre)}</span>
                            </button>
                        ))
                    ) : (
                        <div className="action-empty">Sin tripulantes atrapados aquí</div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default ControlPanel;
