const { correrProlog, leerLista } = require('./ejecutor_prolog');

function enviarBien(respuestaHttp, datos) {
    respuestaHttp.json(datos);
}

function enviarError(respuestaHttp, mensajeError) {
    const mensajeLimpio = limpiarMensajeErrorProlog(mensajeError);

    respuestaHttp.status(500).json({ error: mensajeLimpio });
}

function formatearError(mensaje) {
    const limpio = (mensaje || '').toString().trim().replace(/^ERROR\s*[:-]?\s*/i, '').trim();
    if (!limpio) {
        return 'ERROR - No se pudo completar la accion. Verifica los requisitos e intenta de nuevo.';
    }
    return `ERROR - ${limpio}`;
}

function limpiarMensajeErrorProlog(mensajeError) {
    const textoBase = (mensajeError || '').toString().trim();
    if (!textoBase) {
        return formatearError('No se pudo completar la accion. Verifica los requisitos e intenta de nuevo.');
    }

    const lineasUtiles = textoBase
        .split(/\r?\n/)
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0)
        .filter((linea) => !/^Warning:/i.test(linea))
        .filter((linea) => !/Previously defined at/i.test(linea))
        .filter((linea) => !/^[A-Za-z]:\//.test(linea));

    const textoFiltrado = lineasUtiles.join(' ');

    if (/existence_error|Undefined procedure/i.test(textoFiltrado)) {
        return formatearError('No se encontro una accion valida en el motor del juego. Intenta otra accion.');
    }

    if (/type_error|syntax_error/i.test(textoFiltrado)) {
        return formatearError('La accion tiene un formato invalido. Revisa los datos ingresados.');
    }

    const explicativas = lineasUtiles.filter((linea) =>
        /^(No puedes|Debes|Okey, no puedes|No se|ERROR|Te falta|Te faltan|Faltan requisitos|No cumples)/i.test(linea)
    );

    if (explicativas.length > 0) {
        return formatearError(explicativas.join(' '));
    }

    if (!textoFiltrado || /halt|Execution Aborted/i.test(textoFiltrado)) {
        return formatearError('La accion no pudo completarse. Verifica que cumples los requisitos de la mision.');
    }

    const coincidencia = textoFiltrado.match(/ERROR:[^\n]+/i);
    if (coincidencia) {
        return formatearError(coincidencia[0].replace(/\s+/g, ' ').trim());
    }

    // Si no hay líneas prioritarias, devolver la última línea útil para ser más conciso
    if (lineasUtiles.length > 0) return formatearError(lineasUtiles[lineasUtiles.length - 1]);

    if (textoFiltrado.length > 260) {
        return formatearError('Se produjo un error al ejecutar la accion en Prolog.');
    }

    return formatearError(textoFiltrado);
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

function ejecutarAyuda(respuestaHttp) {
    const salida = correrProlog('ayuda_ui');

    if (salida.ok) {
        return enviarBien(respuestaHttp, { out: salida.out });
    }

    const mensajeAyuda = limpiarMensajeErrorProlog(salida.err);
    return enviarBien(respuestaHttp, {
        out: mensajeAyuda || 'ERROR - No se pudo generar la ayuda en este momento.'
    });
}

function ejecutarForzarGane(respuestaHttp) {
    const salida = correrProlog('forzar_gane_ui');

    if (salida.ok) {
        return enviarBien(respuestaHttp, { out: salida.out });
    }

    const mensaje = limpiarMensajeErrorProlog(salida.err);
    return enviarBien(respuestaHttp, {
        out: mensaje || 'ERROR - No se pudo evaluar si la partida tiene solucion.'
    });
}

module.exports = {
    enviarBien,
    enviarError,
    ejecutarAccion,
    ejecutarConsultaLista,
    ejecutarAyuda,
    ejecutarForzarGane,
    obtenerEstadoJuego
};

