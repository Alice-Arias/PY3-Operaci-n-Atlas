const { correrProlog, leerLista } = require('./ejecutor_prolog');

function enviarBien(respuestaHttp, datos) {
    respuestaHttp.json(datos);
}

function enviarError(respuestaHttp, mensajeError) {
    const mensajeLimpio = limpiarMensajeErrorProlog(mensajeError);

    respuestaHttp.status(500).json({ error: mensajeLimpio });
}

function limpiarMensajeErrorProlog(mensajeError) {
    const textoBase = (mensajeError || '').toString().trim();
    if (!textoBase) {
        return 'No se pudo completar la accion. Verifica los requisitos e intenta de nuevo.';
    }

    const lineasUtiles = Array.from(new Set(
        textoBase
            .split(/\r?\n/)
            .map((linea) => linea.trim())
            .filter((linea) => linea.length > 0)
            .filter((linea) => !/^Warning:/i.test(linea))
            .filter((linea) => !/Previously defined at/i.test(linea))
            .filter((linea) => !/^[A-Za-z]:\//.test(linea))
    ));

    const textoFiltrado = lineasUtiles.join(' ');

    const mensajeBase = 'La accion no pudo completarse.';

    const lineasExplicativas = lineasUtiles.filter((linea) => /^(No puedes|Debes|Te falta|Te faltan|No cumples|Faltan|No hay una conexion directa|No puedes rescatar|No puedes acceder|Tienes que|No se encontro una accion valida|Okey)/i.test(linea));
    if (lineasExplicativas.length > 0) {
        return lineasExplicativas
            .map((linea) => linea.replace(/^[-•\s]+/, '').trim())
            .filter(Boolean)
            .join(' ');
    }

    if (!textoFiltrado || /halt|Execution Aborted/i.test(textoFiltrado)) {
        return `${mensajeBase} Verifica los requisitos de la mision.`;
    }

    if (/existence_error|Undefined procedure/i.test(textoFiltrado)) {
        return 'No se encontro una accion valida en el motor del juego. Intenta otra accion.';
    }

    if (/type_error|syntax_error/i.test(textoFiltrado)) {
        return 'La accion tiene un formato invalido. Revisa los datos ingresados.';
    }

    const coincidencia = textoFiltrado.match(/ERROR:[^\n]+/i);
    if (coincidencia) {
        return coincidencia[0].replace(/\s+/g, ' ').trim();
    }

    // Priorizar líneas explicativas (evitar mostrar mensajes genéricos mezclados)
    const explicativas = lineasUtiles.filter(l => /^(No puedes|Debes|Okey|No se|ERROR|Te falta|Te faltan|No cumples|Faltan|No puedes rescatar|No puedes acceder|No hay una conexion directa|Tienes que)/i.test(l));
    if (explicativas.length > 0) {
        return explicativas.join(' ');
    }

    // Si no hay líneas prioritarias, devolver la última línea útil para ser más conciso
    if (lineasUtiles.length > 0) return lineasUtiles[lineasUtiles.length - 1];

    if (textoFiltrado.length > 260) {
        return mensajeBase + ' Revisa la razon detallada en la consola.';
    }

    return textoFiltrado || `${mensajeBase} Revisa la razon detallada en la consola.`;
}

function convertirSalida(textoSalida) {
    try {
        return leerLista(textoSalida) || textoSalida;
    } catch {
        return textoSalida;
    }
}

function obtenerEstadoJuego() {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");
    if (!salida.ok) return null;
    return salida.out;
}

function ejecutarAccion(meta, respuestaHttp) {
    const salida = correrProlog(meta);

    if (!salida.ok) {
        return enviarError(respuestaHttp, salida.err);
    }

    const estado = obtenerEstadoJuego();
    return enviarBien(respuestaHttp, {
        out: salida.out,
        estado
    });
}

function ejecutarConsultaLista(meta, respuestaHttp) {
    const salida = correrProlog(meta);

    if (!salida.ok) {
        return enviarError(respuestaHttp, salida.err);
    }

    return enviarBien(respuestaHttp, {
        raw: salida.out,
        list: convertirSalida(salida.out)
    });
}

module.exports = {
    enviarBien,
    enviarError,
    ejecutarAccion,
    ejecutarConsultaLista,
    obtenerEstadoJuego
};

