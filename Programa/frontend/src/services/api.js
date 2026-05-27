import { parsearConexionesProlog, parsearEstadoProlog, parsearRegistroProlog, parsearPendientesProlog } from './parserProlog';

const BASE_URL = 'http://localhost:3000/api';

async function manejarRespuesta(res) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
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
    }
};