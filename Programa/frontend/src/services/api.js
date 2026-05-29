import { parsearConexionesProlog, parsearEstadoProlog, parsearRegistroProlog, parsearPendientesProlog, parsearModulosInfo } from './parserProlog';

const BASE_URL = 'http://localhost:3000/api';

async function manejarRespuesta(res) {
    const contentType = res.headers.get('content-type') || '';

    let data = null;
    if (contentType.includes('application/json')) {
        data = await res.json();
    } else {
        const texto = await res.text();
        data = { raw: texto };
    }

    if (!res.ok) {
        const mensajeServidor = data?.error || data?.raw || 'Error del servidor';
        throw new Error(mensajeServidor);
    }

    return data;
}

export const apiService = {
    iniciarSimulacion: async (nombre) => {
        const res = await fetch(`${BASE_URL}/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        return manejarRespuesta(res);
    },

    guardarMision: async () => {
        const res = await fetch(`${BASE_URL}/guardar`, { method: 'POST' });
        return manejarRespuesta(res);
    },

    cargarMision: async (idPartida) => {
        const body = idPartida !== undefined && idPartida !== null ? JSON.stringify({ id: idPartida }) : '{}';
        const res = await fetch(`${BASE_URL}/cargar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });
        return manejarRespuesta(res);
    },

    enviarComando: async (tipo, valor) => {
        const key =
            tipo === 'mover' ? 'destino' :
            tipo === 'tomar' ? 'artefacto' :
            tipo === 'reparar' ? 'sistema' :
            tipo === 'rescatar' ? 'tripulante' : tipo;

        const res = await fetch(`${BASE_URL}/${tipo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: valor })
        });

        const data = await manejarRespuesta(res);
        return {
            ...data,
            estado: data.estado ? parsearEstadoProlog(data.estado) : null
        };
    },

    obtenerModulos: async () => {
        const res = await fetch(`${BASE_URL}/modulos`);
        const data = await manejarRespuesta(res);
        return data.list || [];
    },

    obtenerModulosInfo: async () => {
        const res = await fetch(`${BASE_URL}/modulos_info`);
        const data = await manejarRespuesta(res);
        return parsearModulosInfo(data.raw || '[]');
    },

    obtenerArtefactos: async () => {
        const res = await fetch(`${BASE_URL}/artefactos`);
        const data = await manejarRespuesta(res);
        return data.list || [];
    },

    obtenerConexiones: async () => {
        try {
            const res = await fetch(`${BASE_URL}/conexiones`);
            const data = await manejarRespuesta(res);
            return parsearConexionesProlog(data.raw || '[]');
        } catch {
            return [];
        }
    },

    obtenerRutas: async (inicio, fin) => {
        try {
            const res = await fetch(`${BASE_URL}/ruta?inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`);
            const data = await manejarRespuesta(res);
            return parsearRutasAnidadas(data.raw || '[]');
        } catch {
            return [];
        }
    },

    obtenerRegistroPartidas: async () => {
        try {
            const res = await fetch(`${BASE_URL}/registro`);
            const data = await manejarRespuesta(res);
            return parsearRegistroProlog(data.raw || '[]');
        } catch {
            return [];
        }
    },

    obtenerMisionesPendientes: async (nombre) => {
        try {
            const res = await fetch(`${BASE_URL}/pendientes?nombre=${encodeURIComponent(nombre)}`);
            const data = await manejarRespuesta(res);
            return parsearPendientesProlog(data.raw || '[]');
        } catch {
            return [];
        }
    },

    obtenerEstado: async () => {
        const res = await fetch(`${BASE_URL}/estado`);
        const data = await manejarRespuesta(res);
        return parsearEstadoProlog(data.estado);
    },

    verificarVictoria: async () => {
        const res = await fetch(`${BASE_URL}/verificar`, { method: 'POST' });
        return manejarRespuesta(res);
    },

    solicitarAyuda: async () => {
        const res = await fetch(`${BASE_URL}/ayuda`, { method: 'POST' });
        const data = await manejarRespuesta(res);
        return {
            ...data,
            estado: data.estado ? parsearEstadoProlog(data.estado) : null
        };
    },

    forzarGane: async () => {
        const res = await fetch(`${BASE_URL}/forzar_gane`, { method: 'POST' });
        const data = await manejarRespuesta(res);
        return data;
    }
};

function parsearRutasAnidadas(texto) {
    const rutas = parsearListaAnidada(texto);
    return rutas
        .map((ruta) => (Array.isArray(ruta) ? ruta : []))
        .filter((ruta) => ruta.length > 0);
}

function parsearListaAnidada(texto) {
    if (!texto || typeof texto !== 'string') return [];

    const valor = texto.trim();
    if (!valor.startsWith('[') || !valor.endsWith(']')) {
        return [limpiarElementoLocal(valor)].filter(Boolean);
    }

    const contenido = valor.slice(1, -1).trim();
    if (contenido === '') return [];

    const elementos = [];
    let acumulado = '';
    let profundidad = 0;

    for (let i = 0; i < contenido.length; i += 1) {
        const caracter = contenido[i];
        if (caracter === '[' || caracter === '(') profundidad += 1;
        if (caracter === ']' || caracter === ')') profundidad -= 1;

        if (caracter === ',' && profundidad === 0) {
            elementos.push(acumulado.trim());
            acumulado = '';
            continue;
        }

        acumulado += caracter;
    }

    if (acumulado.trim() !== '') elementos.push(acumulado.trim());

    return elementos.map((item) => {
        const limpio = item.trim();
        if (limpio.startsWith('[') && limpio.endsWith(']')) {
            return parsearListaAnidada(limpio);
        }
        return limpiarElementoLocal(limpio);
    });
}

function limpiarElementoLocal(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const valor = texto.trim();
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
        return valor.slice(1, -1);
    }
    return valor;
}