import React, { useEffect, useRef, useState } from 'react';

// Nombre: clasificarMensaje/1
// Descripcion: asigna un tipo visual a un texto de bitacora.
// Entrada: mensaje en texto plano.
// Salida: categoria como error, movimiento, accion, info o sistema.
// Restricciones: usa palabras clave simples.
// Objetivo: colorear la bitacora segun el contenido.
function clasificarMensaje(texto) {
    if (!texto) return 'sistema';
    const t = texto.toLowerCase();
    if (t.includes('error') || t.includes('no puedes') || t.includes('imposible') || t.includes('fallo')) return 'error';
    if (t.includes('movido') || t.includes('te has movido') || t.includes('movimiento')) return 'movimiento';
    if (t.includes('tomado') || t.includes('reparado') || t.includes('rescatado') || t.includes('usado')) return 'accion';
    if (t.includes('pendiente') || t.includes('sistemas') || t.includes('tripulantes') || t.includes('objetivo')) return 'info';
    return 'sistema';
}

// Nombre: embellecerTexto/1
// Descripcion: limpia y hace mas legible el texto que llega desde Prolog.
// Entrada: texto bruto.
// Salida: texto mejor formateado para mostrar en pantalla.
// Restricciones: no cambia la semantica, solo la presentacion.
// Objetivo: hacer la bitacora mas comprensible para cualquier persona.
function embellecerTexto(texto) {
    if (!texto || typeof texto !== 'string') return texto;

    const limpio = texto
        .trim()
        .replace(/^ERROR\s*\([^)]*\):\s*/i, '')
        .replace(/^\([^)]*\):\s*/i, '')
        .replace(/^ERROR\s*[:-]?\s*/i, '')
        .trim();

    if (/^Sistemas pendientes:\s*\[\s*\]$/i.test(limpio)) {
        return 'No quedan sistemas pendientes.';
    }

    if (/^Tripulantes pendientes:\s*\[\s*\]$/i.test(limpio)) {
        return 'No quedan tripulantes pendientes.';
    }

    const listaCoincidencia = limpio.match(/^(Sistemas pendientes|Tripulantes pendientes|Movimientos posibles desde [^:]+):\s*\[(.*)\]$/i);
    if (listaCoincidencia) {
        const etiqueta = listaCoincidencia[1];
        const contenido = listaCoincidencia[2].trim();
        if (!contenido) return `${etiqueta}: ninguno.`;
        const items = contenido.split(',').map((item) => item.trim()).filter(Boolean);
        const textoLegible = items.map((item) => item.replace(/_/g, ' ')).join(', ');
        return `${etiqueta}: ${textoLegible}`;
    }

    return limpio
        .replace(/\b([a-z]+_[a-z0-9_]+)\b/gi, (token) => token.replace(/_/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

// Nombre: getTagLabel/1
// Descripcion: traduce una categoria interna a la etiqueta visible del panel.
// Entrada: tipo de mensaje.
// Salida: etiqueta en mayusculas.
// Restricciones: usa un mapa fijo de categorias.
// Objetivo: mantener consistente la nomenclatura de la bitacora.
function getTagLabel(tipo) {
    const tags = {
        sistema:    'SISTEMA',
        accion:     'ACCIÓN',
        movimiento: 'MOVIMIENTO',
        error:      'ERROR',
        info:       'INFO',
    };
    return tags[tipo] || 'SISTEMA';
}

// Nombre: now/0
// Descripcion: devuelve la hora actual en formato de bitacora.
// Entrada: no recibe datos.
// Salida: cadena con hora, minuto y segundo.
// Restricciones: usa la hora local del sistema.
// Objetivo: marcar el momento de cada evento en la consola.
function now() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
}

// Nombre: TerminalConsole
// Descripcion: muestra la bitacora en vivo, errores y acceso a ayuda.
// Entrada: log, callbacks de ayuda y error, y bandera de deshabilitado.
// Salida: un panel de consola visual con mensajes formateados.
// Restricciones: depende de que el log llegue como texto plano.
// Objetivo: ofrecer feedback continuo al jugador.
function TerminalConsole({ log, onAyuda, disabled, errorActual, onDismissError }) {
    const bottomRef = useRef(null);
    const [lineas, setLineas] = useState([]);

// Convierte texto plano en líneas estructuradas
    useEffect(() => {
        if (!log) {
            setLineas([]);
            return;
        }

        // Dividir por saltos de línea para manejar respuestas largas
        const partes = log.split('\n').filter((l) => l.trim() !== '');
        const nuevas = partes.map((parte) => ({
            id: Date.now() + Math.random(),
            timestamp: now(),
            tipo: clasificarMensaje(parte),
            texto: embellecerTexto(parte),
        }));
        setLineas(nuevas.slice(-120));
    }, [log]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lineas]);

    return (
        <div className="panel">
            <div className="panel-header">
                <div className="panel-header-icon purple">📟</div>
                <span className="panel-title">Bitácora en Tiempo Real</span>
            </div>

            <div className="terminal-body">
                {lineas.length === 0 && (
                    <div className="terminal-line">
                        <span className="terminal-timestamp">{now()}</span>
                        <span className={`terminal-tag sistema`}>SISTEMA</span>
                        <span className={`terminal-msg sistema`}>Inicializando interfaz de operación Atlas...</span>
                    </div>
                )}
                {lineas.map((linea) => (
                    <div key={linea.id} className="terminal-line">
                        <span className="terminal-timestamp">{linea.timestamp}</span>
                        <span className={`terminal-tag ${linea.tipo}`}>{getTagLabel(linea.tipo)}</span>
                        <span className={`terminal-msg ${linea.tipo}`}>{linea.texto}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {errorActual && (
                <div className="error-box">
                    <span className="error-box-icon">⊗</span>
                    <div className="error-box-content">
                        <div className="error-box-title">ERROR</div>
                        <div className="error-box-msg">{errorActual}</div>
                        <button className="error-box-dismiss" onClick={onDismissError}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <div className="terminal-footer">
                <button className="btn-help" onClick={onAyuda} disabled={disabled}>
                     Ayuda de la Computadora
                </button>
            </div>
        </div>
    );
}

export default TerminalConsole;
