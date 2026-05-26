const BASE_URL = 'http://localhost:3000/api';

async function manejarRespuesta(res) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
}

function limpiarElemento(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const valor = texto.trim();
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
        return valor.slice(1, -1);
    }
    return valor;
}

function dividirNivelSuperior(texto) {
    const elementos = [];
    let acumulado = '';
    let profundidad = 0;

    for (let i = 0; i < texto.length; i += 1) {
        const caracter = texto[i];

        if (caracter === '[' || caracter === '(') {
            profundidad += 1;
        }

        if (caracter === ']' || caracter === ')') {
            profundidad -= 1;
        }

        if (caracter === ',' && profundidad === 0) {
            elementos.push(acumulado.trim());
            acumulado = '';
            continue;
        }

        acumulado += caracter;
    }

    if (acumulado.trim() !== '') {
        elementos.push(acumulado.trim());
    }

    return elementos;
}

function parsearListaProlog(texto) {
    if (!texto || typeof texto !== 'string') {
        return [];
    }

    const valor = texto.trim();
    if (!valor.startsWith('[') || !valor.endsWith(']')) {
        return [limpiarElemento(valor)].filter(Boolean);
    }

    const contenido = valor.slice(1, -1).trim();
    if (contenido === '') {
        return [];
    }

    return dividirNivelSuperior(contenido).map((item) => limpiarElemento(item));
}

function parsearTerminos(texto, prefijo, campos) {
    const lista = parsearListaProlog(texto);
    return lista
        .map((item) => {
            const textoItem = item.trim();
            if (!textoItem.startsWith(`${prefijo}(`) || !textoItem.endsWith(')')) {
                return null;
            }
            const contenido = textoItem.slice(prefijo.length + 1, -1);
            const valores = dividirNivelSuperior(contenido).map((parte) => limpiarElemento(parte));
            const registro = {};
            campos.forEach((campo, indice) => {
                registro[campo] = valores[indice] || null;
            });
            return registro;
        })
        .filter(Boolean);
}

function parsearEstadoProlog(texto) {
    if (!texto || typeof texto !== 'string') {
        return null;
    }

    const valor = texto.trim();
    const coincidencia = valor.match(/^estado\s*\((.*)\)$/s);
    if (!coincidencia) {
        return null;
    }

    const partes = dividirNivelSuperior(coincidencia[1]);
    if (partes.length !== 7) {
        return null;
    }

    return {
        moduloActual: limpiarElemento(partes[0]),
        inventario: parsearListaProlog(partes[1]),
        visitados: parsearListaProlog(partes[2]),
        sistemas: parsearTerminos(partes[3], 'sistema_data', ['modulo', 'sistema', 'estado']),
        tripulantes: parsearTerminos(partes[4], 'tripulante_data', ['nombre', 'modulo', 'estado']),
        modulosConectados: parsearListaProlog(partes[5]),
        artefactosDisponibles: parsearTerminos(partes[6], 'artefacto_data', ['artefacto', 'modulo'])
    };
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

    cargarMision: async () => {
        const res = await fetch(`${BASE_URL}/cargar`, { method: 'POST' });
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

    obtenerEstado: async () => {
        const res = await fetch(`${BASE_URL}/estado`);
        const data = await manejarRespuesta(res);
        return parsearEstadoProlog(data.estado);
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