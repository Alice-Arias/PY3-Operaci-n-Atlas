import React, { useEffect, useRef, useState } from 'react';

function clasificarMensaje(texto) {
    if (!texto) return 'sistema';
    const t = texto.toLowerCase();
    if (t.includes('error') || t.includes('no puedes') || t.includes('imposible') || t.includes('fallo')) return 'error';
    if (t.includes('movido') || t.includes('te has movido') || t.includes('movimiento')) return 'movimiento';
    if (t.includes('tomado') || t.includes('reparado') || t.includes('rescatado') || t.includes('usado')) return 'accion';
    if (t.includes('pendiente') || t.includes('sistemas') || t.includes('tripulantes') || t.includes('objetivo')) return 'info';
    return 'sistema';
}

function embellecerTexto(texto) {
    if (!texto || typeof texto !== 'string') return texto;

    const limpio = texto.trim();

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

function now() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
}

function TerminalConsole({ log, onAyuda, disabled, errorActual, onDismissError }) {
    const bottomRef = useRef(null);
    const [lineas, setLineas] = useState([]);

// Convierte texto plano en líneas estructuradas
    useEffect(() => {
        if (!log) return;
        // Dividir por saltos de línea para manejar respuestas largas
        const partes = log.split('\n').filter(l => l.trim() !== '');
        const nuevas = partes.map(parte => ({
            id: Date.now() + Math.random(),
            timestamp: now(),
            tipo: clasificarMensaje(parte),
            texto: embellecerTexto(parte),
        }));
        setLineas(prev => {
            // parta que no se dupliquen mensajes iniciales
            if (prev.length === 0 && nuevas.length > 0) return nuevas;
            // Agregar solo líneas que no sean idénticas al último batch
            const ultimoTexto = prev[prev.length - 1]?.texto;
            if (nuevas.length === 1 && nuevas[0].texto === ultimoTexto) return prev;
            return [...prev, ...nuevas].slice(-120); // mantener últimas 120 líneas
        });
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
                        <div className="error-box-title">Error</div>
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
