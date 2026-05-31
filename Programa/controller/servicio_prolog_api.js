const { correrProlog, leerLista } = require('./ejecutor_prolog');

// Nombre: enviarBien/2
// Descripcion: envia una respuesta JSON exitosa al cliente.
// Entrada: respuesta HTTP y datos a serializar.
// Salida: respuesta con status 200 implícito y cuerpo JSON.
// Restricciones: requiere una instancia valida de respuesta Express.
// Objetivo: estandarizar las respuestas exitosas del API.
function enviarBien(respuestaHttp, datos) {
    respuestaHttp.json(datos);
}

// Nombre: enviarError/2
// Descripcion: envia un error HTTP limpio y homogéneo.
// Entrada: respuesta HTTP y mensaje de error.
// Salida: respuesta 500 con un campo `error`.
// Restricciones: depende de `limpiarMensajeErrorProlog/1`.
// Objetivo: ocultar ruido tecnico y devolver mensajes entendibles.
function enviarError(respuestaHttp, mensajeError) {
    const mensajeLimpio = limpiarMensajeErrorProlog(mensajeError);

    respuestaHttp.status(500).json({ error: mensajeLimpio });
}

// Nombre: formatearError/1
// Descripcion: normaliza un texto de error para presentarlo al usuario.
// Entrada: mensaje de error bruto.
// Salida: texto con prefijo `ERROR -` y contenido limpio.
// Restricciones: elimina prefijos repetidos de error antes de formatear.
// Objetivo: mantener un estilo unico en los mensajes fallidos.
function formatearError(mensaje) {
    const limpio = (mensaje || '').toString().trim().replace(/^ERROR\s*[:-]?\s*/i, '').trim();
    if (!limpio) {
        return 'ERROR - No se pudo completar la accion. Verifica los requisitos e intenta de nuevo.';
    }
    return `ERROR - ${limpio}`;
}

// Nombre: limpiarMensajeErrorProlog/1
// Descripcion: elimina ruido tecnico de los errores producidos por Prolog.
// Entrada: texto de error bruto.
// Salida: mensaje resumido y mas legible para el jugador.
// Restricciones: filtra warnings, rutas y mensajes repetitivos.
// Objetivo: traducir errores del motor a lenguaje de usuario.
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

// Nombre: convertirSalida/1
// Descripcion: intenta leer la salida de Prolog como lista; si falla, la deja cruda.
// Entrada: texto de salida.
// Salida: arreglo, texto original o el valor recibido si no se puede parsear.
// Restricciones: depende de `leerLista/1` y atrapa errores de parseo.
// Objetivo: ofrecer una conversion segura para respuestas mixtas.
function convertirSalida(textoSalida) {
    try {
        return leerLista(textoSalida) || textoSalida;
    } catch {
        return textoSalida;
    }
}

// Nombre: obtenerEstadoJuego/0
// Descripcion: consulta el estado UI actual desde Prolog.
// Entrada: no recibe datos.
// Salida: texto serializado del estado actual o null si falla.
// Restricciones: requiere que el motor Prolog responda correctamente.
// Objetivo: sincronizar el frontend con el estado real de la partida.
function obtenerEstadoJuego() {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");
    if (!salida.ok) return null;
    return salida.out;
}

// Nombre: ejecutarAccion/2
// Descripcion: ejecuta una meta Prolog que modifica el estado y devuelve el resultado actualizado.
// Entrada: meta Prolog y respuesta HTTP.
// Salida: JSON con la salida de la accion y el estado actual.
// Restricciones: usa `obtenerEstadoJuego/0` solo cuando la accion fue exitosa.
// Objetivo: unificar la ejecucion de comandos de juego mutables.
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

// Nombre: ejecutarConsultaLista/2
// Descripcion: ejecuta una consulta Prolog y empaqueta su salida como lista.
// Entrada: meta Prolog y respuesta HTTP.
// Salida: JSON con `raw` y `list`.
// Restricciones: el formato crudo debe ser interpretable como lista por `leerLista/1`.
// Objetivo: simplificar las respuestas de consultas de lectura.
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

// Nombre: ejecutarAyuda/1
// Descripcion: solicita a Prolog la ayuda actualizada para la partida.
// Entrada: respuesta HTTP.
// Salida: JSON con la ayuda o con un error amable.
// Restricciones: la respuesta de Prolog puede venir como exito o error.
// Objetivo: exponer la guia del juego al frontend.
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

// Nombre: ejecutarForzarGane/1
// Descripcion: pregunta a Prolog si la partida todavia tiene solucion.
// Entrada: respuesta HTTP.
// Salida: mensaje de estado sobre la viabilidad de la partida.
// Restricciones: depende del predicado `forzar_gane_ui` del motor.
// Objetivo: informar si la partida aun puede completarse.
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

// Nombre: ejecutarForzarGanePlan/1
// Descripcion: pide a Prolog un plan estructurado para terminar la partida.
// Entrada: respuesta HTTP.
// Salida: JSON con una lista de pasos o una lista vacia si algo falla.
// Restricciones: espera que la salida de Prolog sea JSON valido.
// Objetivo: entregar un plan mecanico para que el frontend lo ejecute o muestre.
function ejecutarForzarGanePlan(respuestaHttp) {
    const salida = correrProlog('forzar_gane_plan_ui');

    if (!salida.ok) {
        const mensaje = limpiarMensajeErrorProlog(salida.err);
        return enviarBien(respuestaHttp, { plan: [], raw: mensaje });
    }

    try {
        const plan = JSON.parse(salida.out || '[]');
        return enviarBien(respuestaHttp, { plan });
    } catch (e) {
        // Si no es JSON válido, devolver como raw
        return enviarBien(respuestaHttp, { plan: [], raw: salida.out });
    }
}

// Nombre: escaparAtomPrologLocal/1
// Descripcion: escapa comillas simples para construir atoms seguros en Prolog.
// Entrada: texto libre.
// Salida: atom entre comillas simples con comillas duplicadas internamente.
// Restricciones: solo protege comillas simples; no hace sanitizacion completa.
// Objetivo: evitar romper consultas al interpolar texto del usuario.
function escaparAtomPrologLocal(texto) {
    if (texto === null || texto === undefined) return "''";
    return "'" + String(texto).replace(/'/g, "''") + "'";
}

// Nombre: ejecutarPlan/1
// Descripcion: ejecuta un plan de ayuda paso a paso y devuelve el detalle de resultados.
// Entrada: respuesta HTTP.
// Salida: JSON con plan, resultados y estado final.
// Restricciones: depende del plan producido por `forzar_gane_plan_ui`.
// Objetivo: automatizar la ejecucion de la guia de victoria.
async function ejecutarPlan(respuestaHttp) {
    const salida = correrProlog('forzar_gane_plan_ui');

    if (!salida.ok) {
        const mensaje = limpiarMensajeErrorProlog(salida.err);
        return enviarBien(respuestaHttp, { plan: [], results: [], raw: mensaje });
    }

    let plan = [];
    try {
        plan = JSON.parse(salida.out || '[]');
    } catch (e) {
        return enviarBien(respuestaHttp, { plan: [], results: [], raw: salida.out });
    }

    const resultados = [];

    // obtener posicion inicial del jugador
    const posActualResp = correrProlog("jugador(M), format('~q', [M])");
    let posicionActual = posActualResp && posActualResp.ok ? (posActualResp.out || '') : '';
    if (posicionActual && (posicionActual.startsWith("'") || posicionActual.startsWith('"'))) {
        posicionActual = posicionActual.slice(1, -1);
    }

    for (const paso of plan) {
        // convertir paso en acciones simples
        const texto = String(paso || '').trim();

        // Ir a X y recoger Y
        let m = texto.match(/^Ir a\s+(.+?)\s+y recoger\s+(.+)$/i);
        if (m) {
            const destino = m[1].trim();
            const artefacto = m[2].trim();

            // mover
            const metaMover = `mover_ui(${escaparAtomPrologLocal(destino)})`;
            let outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });

            // Si no pudo moverse directamente, intentar ruta y mover paso a paso
            if (!outMover.ok) {
                const rutaMeta = `ruta(${escaparAtomPrologLocal(posicionActual)}, ${escaparAtomPrologLocal(destino)}, Camino), format('~q', [Camino])`;
                const salidaRuta = correrProlog(rutaMeta);
                if (salidaRuta.ok && salidaRuta.out) {
                    try {
                        const lista = leerLista(salidaRuta.out);
                        // lista es array de atom strings: [origen, a, b, destino]
                        if (Array.isArray(lista) && lista.length > 1) {
                            // ejecutar movimientos intermedios (omitir primer elemento que es la posicionActual)
                            for (const siguiente of lista.slice(1)) {
                                const metaPaso = `mover_ui(${escaparAtomPrologLocal(siguiente)})`;
                                const outPaso = correrProlog(metaPaso);
                                resultados.push({ paso: `Ir a ${siguiente}`, accion: 'mover', destino: siguiente, ok: outPaso.ok, out: outPaso.ok ? outPaso.out : outPaso.err });
                                if (!outPaso.ok) break;
                                posicionActual = siguiente;
                            }
                        }
                    } catch (e) {
                        // si parse falla, no hacer nada
                    }
                }
                // reintentar tomar el resultado del mover original mediante obtener posicion
                const estadoPost = obtenerEstadoJuego();
                if (estadoPost && typeof estadoPost === 'string') {
                    const m = estadoPost.match(/estado\(([^,]+),/);
                    if (m) {
                        let mod = m[1].trim();
                        if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                        posicionActual = mod;
                    }
                }
            } else {
                // mover exitoso: actualizar posicionActual
                posicionActual = destino;
            }

            // tomar
            const metaTomar = `tomar_artefacto_ui(${escaparAtomPrologLocal(artefacto)})`;
            const outTomar = correrProlog(metaTomar);
            resultados.push({ paso: texto, accion: 'tomar', artefacto, ok: outTomar.ok, out: outTomar.ok ? outTomar.out : outTomar.err });
            if (outTomar.ok) {
                // actualizar posicionActual desde estado
                const estadoPost = obtenerEstadoJuego();
                if (estadoPost && typeof estadoPost === 'string') {
                    const m2 = estadoPost.match(/estado\(([^,]+),/);
                    if (m2) {
                        let mod2 = m2[1].trim();
                        if ((mod2.startsWith("'") || mod2.startsWith('"')) && (mod2.endsWith("'") || mod2.endsWith('"'))) mod2 = mod2.slice(1,-1);
                        posicionActual = mod2;
                    }
                }
            }
            continue;
        }

        // Reparar S en M
        m = texto.match(/^Reparar\s+(.+?)\s+en\s+(.+)$/i);
        if (m) {
            const sistema = m[1].trim();
            const modulo = m[2].trim();
            const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
            let outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });
            if (!outMover.ok) {
                const rutaMeta = `ruta(${escaparAtomPrologLocal(posicionActual)}, ${escaparAtomPrologLocal(modulo)}, Camino), format('~q', [Camino])`;
                const salidaRuta = correrProlog(rutaMeta);
                if (salidaRuta.ok && salidaRuta.out) {
                    try {
                        const lista = leerLista(salidaRuta.out);
                        if (Array.isArray(lista) && lista.length > 1) {
                            for (const siguiente of lista.slice(1)) {
                                const metaPaso = `mover_ui(${escaparAtomPrologLocal(siguiente)})`;
                                const outPaso = correrProlog(metaPaso);
                                resultados.push({ paso: `Ir a ${siguiente}`, accion: 'mover', destino: siguiente, ok: outPaso.ok, out: outPaso.ok ? outPaso.out : outPaso.err });
                                if (!outPaso.ok) break;
                                posicionActual = siguiente;
                            }
                        }
                    } catch (e) {}
                }
                const estadoPost = obtenerEstadoJuego();
                if (estadoPost && typeof estadoPost === 'string') {
                    const m = estadoPost.match(/estado\(([^,]+),/);
                    if (m) {
                        let mod = m[1].trim();
                        if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                        posicionActual = mod;
                    }
                }
            } else {
                posicionActual = modulo;
            }

            const metaReparar = `reparar_ui(${escaparAtomPrologLocal(sistema)})`;
            const outReparar = correrProlog(metaReparar);
            resultados.push({ paso: texto, accion: 'reparar', sistema, ok: outReparar.ok, out: outReparar.ok ? outReparar.out : outReparar.err });
            if (outReparar.ok) {
                const estadoPost = obtenerEstadoJuego();
                if (estadoPost && typeof estadoPost === 'string') {
                    const m = estadoPost.match(/estado\(([^,]+),/);
                    if (m) {
                        let mod = m[1].trim();
                        if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                        posicionActual = mod;
                    }
                }
            }
            continue;
        }

        // Rescatar T en M
        m = texto.match(/^Rescatar\s+(.+?)\s+en\s+(.+)$/i);
        if (m) {
            const trip = m[1].trim();
            const modulo = m[2].trim();
            const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
            const outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });

            const metaRescatar = `rescatar_ui(${escaparAtomPrologLocal(trip)})`;
            const outRescatar = correrProlog(metaRescatar);
            resultados.push({ paso: texto, accion: 'rescatar', tripulante: trip, ok: outRescatar.ok, out: outRescatar.ok ? outRescatar.out : outRescatar.err });
            if (outRescatar.ok) {
                const estadoPost = obtenerEstadoJuego();
                if (estadoPost && typeof estadoPost === 'string') {
                    const m = estadoPost.match(/estado\(([^,]+),/);
                    if (m) {
                        let mod = m[1].trim();
                        if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                        posicionActual = mod;
                    }
                }
            }
            continue;
        }

        // Pasar por X para desbloquear acceso a Y
        m = texto.match(/^Pasar por\s+(.+?)\s+para desbloquear acceso a\s+(.+)$/i);
        if (m) {
            const modulo = m[1].trim();
            const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
            const outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });
            if (outMover.ok) {
                posicionActual = modulo;
            }
            continue;
        }

        // Pasar por X para desbloquear
        m = texto.match(/^Pasar por\s+(.+?)\s+para desbloquear acceso a\s+(.+)$/i);
        if (m) {
            const modulo = m[1].trim();
            const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
            const outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });
            continue;
        }

        // Ir a X
        m = texto.match(/^Ir a\s+(.+)$/i);
        if (m) {
            const modulo = m[1].trim();
            const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
            const outMover = correrProlog(metaMover);
            resultados.push({ paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : outMover.err });
            continue;
        }

        // Si no se reconoce, incluir como info
        resultados.push({ paso: texto, accion: 'unknown', ok: false, out: 'Paso no reconocido' });
    }

    const estadoFinal = obtenerEstadoJuego();
    return enviarBien(respuestaHttp, { plan, results: resultados, finalEstado: estadoFinal });
}

// Nombre: ejecutarPlanStream/1
// Descripcion: ejecuta el plan de victoria mediante eventos SSE en tiempo real.
// Entrada: respuesta HTTP.
// Salida: stream de eventos `plan`, `step`, `log`, `error` y `end`.
// Restricciones: la conexion debe permanecer abierta durante la ejecucion.
// Objetivo: permitir que el frontend vea el avance en vivo.
function ejecutarPlanStream(respuestaHttp) {
    // configurar SSE
    respuestaHttp.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });

    function sseSend(obj) {
        try {
            // Adjuntar estado actual en cada evento para que el frontend pueda actualizar UI en vivo
            const estado = obtenerEstadoJuego();
            const payload = Object.assign({}, obj, { estado });
            respuestaHttp.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch (e) {
            // ignore
        }
    }

    const salida = correrProlog('forzar_gane_plan_ui');
    if (!salida.ok) {
        const mensaje = limpiarMensajeErrorProlog(salida.err);
        sseSend({ type: 'error', message: mensaje });
        sseSend({ type: 'end' });
        return respuestaHttp.end();
    }

    let plan = [];
    try {
        plan = JSON.parse(salida.out || '[]');
    } catch (e) {
        sseSend({ type: 'error', message: salida.out || 'Plan inválido' });
        sseSend({ type: 'end' });
        return respuestaHttp.end();
    }

    sseSend({ type: 'plan', plan });

    // ejecución secuencial con envíos por paso (similar a ejecutarPlan)
    const posActualResp = correrProlog("jugador(M), format('~q', [M])");
    let posicionActual = posActualResp && posActualResp.ok ? (posActualResp.out || '') : '';
    if (posicionActual && (posicionActual.startsWith("'") || posicionActual.startsWith('"'))) {
        posicionActual = posicionActual.slice(1, -1);
    }

    (async () => {
        for (const paso of plan) {
            const texto = String(paso || '').trim();
            sseSend({ type: 'log', message: `Ejecutando: ${texto}` });

            // Reutilizar parsing de pasos ya implementado en ejecutarPlan
            let m = texto.match(/^Ir a\s+(.+?)\s+y recoger\s+(.+)$/i);
            if (m) {
                const destino = m[1].trim();
                const artefacto = m[2].trim();
                const metaMover = `mover_ui(${escaparAtomPrologLocal(destino)})`;
                let outMover = correrProlog(metaMover);
                sseSend({ type: 'step', paso: texto, accion: 'mover', destino, ok: outMover.ok, out: outMover.ok ? outMover.out : limpiarMensajeErrorProlog(outMover.err) });

                if (!outMover.ok) {
                    const rutaMeta = `ruta(${escaparAtomPrologLocal(posicionActual)}, ${escaparAtomPrologLocal(destino)}, Camino), format('~q', [Camino])`;
                    const salidaRuta = correrProlog(rutaMeta);
                    if (salidaRuta.ok && salidaRuta.out) {
                        try {
                            const lista = leerLista(salidaRuta.out);
                            if (Array.isArray(lista) && lista.length > 1) {
                                for (const siguiente of lista.slice(1)) {
                                    const metaPaso = `mover_ui(${escaparAtomPrologLocal(siguiente)})`;
                                    const outPaso = correrProlog(metaPaso);
                                    sseSend({ type: 'step', paso: `Ir a ${siguiente}`, accion: 'mover', destino: siguiente, ok: outPaso.ok, out: outPaso.ok ? outPaso.out : limpiarMensajeErrorProlog(outPaso.err) });
                                    if (!outPaso.ok) break;
                                    posicionActual = siguiente;
                                }
                            }
                        } catch (e) {}
                    }
                    const estadoPost = obtenerEstadoJuego();
                    if (estadoPost && typeof estadoPost === 'string') {
                        const m2 = estadoPost.match(/estado\(([^,]+),/);
                        if (m2) {
                            let mod = m2[1].trim();
                            if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                            posicionActual = mod;
                        }
                    }
                } else {
                    posicionActual = destino;
                }

                const metaTomar = `tomar_artefacto_ui(${escaparAtomPrologLocal(artefacto)})`;
                const outTomar = correrProlog(metaTomar);
                sseSend({ type: 'step', paso: texto, accion: 'tomar', artefacto, ok: outTomar.ok, out: outTomar.ok ? outTomar.out : limpiarMensajeErrorProlog(outTomar.err) });
                if (outTomar.ok) {
                    const estadoPost = obtenerEstadoJuego();
                    if (estadoPost && typeof estadoPost === 'string') {
                        const m2 = estadoPost.match(/estado\(([^,]+),/);
                        if (m2) {
                            let mod2 = m2[1].trim();
                            if ((mod2.startsWith("'") || mod2.startsWith('"')) && (mod2.endsWith("'") || mod2.endsWith('"'))) mod2 = mod2.slice(1,-1);
                            posicionActual = mod2;
                        }
                    }
                }
                // peque�o delay para dar tiempo al frontend a actualizar (opcional)
                await new Promise(r => setTimeout(r, 120));
                continue;
            }

            // Reparar
            m = texto.match(/^Reparar\s+(.+?)\s+en\s+(.+)$/i);
            if (m) {
                const sistema = m[1].trim();
                const modulo = m[2].trim();
                const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
                let outMover = correrProlog(metaMover);
                sseSend({ type: 'step', paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : limpiarMensajeErrorProlog(outMover.err) });
                if (!outMover.ok) {
                    const rutaMeta = `ruta(${escaparAtomPrologLocal(posicionActual)}, ${escaparAtomPrologLocal(modulo)}, Camino), format('~q', [Camino])`;
                    const salidaRuta = correrProlog(rutaMeta);
                    if (salidaRuta.ok && salidaRuta.out) {
                        try {
                            const lista = leerLista(salidaRuta.out);
                            if (Array.isArray(lista) && lista.length > 1) {
                                for (const siguiente of lista.slice(1)) {
                                    const metaPaso = `mover_ui(${escaparAtomPrologLocal(siguiente)})`;
                                    const outPaso = correrProlog(metaPaso);
                                    sseSend({ type: 'step', paso: `Ir a ${siguiente}`, accion: 'mover', destino: siguiente, ok: outPaso.ok, out: outPaso.ok ? outPaso.out : limpiarMensajeErrorProlog(outPaso.err) });
                                    if (!outPaso.ok) break;
                                    posicionActual = siguiente;
                                }
                            }
                        } catch (e) {}
                    }
                    const estadoPost = obtenerEstadoJuego();
                    if (estadoPost && typeof estadoPost === 'string') {
                        const m2 = estadoPost.match(/estado\(([^,]+),/);
                        if (m2) {
                            let mod = m2[1].trim();
                            if ((mod.startsWith("'") || mod.startsWith('"')) && (mod.endsWith("'") || mod.endsWith('"'))) mod = mod.slice(1,-1);
                            posicionActual = mod;
                        }
                    }
                } else {
                    posicionActual = modulo;
                }

                const metaReparar = `reparar_ui(${escaparAtomPrologLocal(sistema)})`;
                const outReparar = correrProlog(metaReparar);
                sseSend({ type: 'step', paso: texto, accion: 'reparar', sistema, ok: outReparar.ok, out: outReparar.ok ? outReparar.out : limpiarMensajeErrorProlog(outReparar.err) });
                await new Promise(r => setTimeout(r, 120));
                continue;
            }

            // Rescatar
            m = texto.match(/^Rescatar\s+(.+?)\s+en\s+(.+)$/i);
            if (m) {
                const trip = m[1].trim();
                const modulo = m[2].trim();
                const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
                const outMover = correrProlog(metaMover);
                sseSend({ type: 'step', paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : limpiarMensajeErrorProlog(outMover.err) });

                const metaRescatar = `rescatar_ui(${escaparAtomPrologLocal(trip)})`;
                const outRescatar = correrProlog(metaRescatar);
                sseSend({ type: 'step', paso: texto, accion: 'rescatar', tripulante: trip, ok: outRescatar.ok, out: outRescatar.ok ? outRescatar.out : limpiarMensajeErrorProlog(outRescatar.err) });
                await new Promise(r => setTimeout(r, 120));
                continue;
            }

            // Pasar por X para desbloquear acceso a Y
            m = texto.match(/^Pasar por\s+(.+?)\s+para desbloquear acceso a\s+(.+)$/i);
            if (m) {
                const modulo = m[1].trim();
                const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
                const outMover = correrProlog(metaMover);
                sseSend({ type: 'step', paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : limpiarMensajeErrorProlog(outMover.err) });
                if (outMover.ok) {
                    posicionActual = modulo;
                }
                await new Promise(r => setTimeout(r, 120));
                continue;
            }

            // Ir a X simple
            m = texto.match(/^Ir a\s+(.+)$/i);
            if (m) {
                const modulo = m[1].trim();
                const metaMover = `mover_ui(${escaparAtomPrologLocal(modulo)})`;
                const outMover = correrProlog(metaMover);
                sseSend({ type: 'step', paso: texto, accion: 'mover', destino: modulo, ok: outMover.ok, out: outMover.ok ? outMover.out : limpiarMensajeErrorProlog(outMover.err) });
                await new Promise(r => setTimeout(r, 120));
                continue;
            }

            sseSend({ type: 'step', paso: texto, accion: 'unknown', ok: false, out: 'Paso no reconocido' });
            await new Promise(r => setTimeout(r, 120));
        }

        const estadoFinal = obtenerEstadoJuego();
        sseSend({ type: 'end', finalEstado: estadoFinal, pendientes: plan });
        return respuestaHttp.end();
    })();
}

module.exports = {
    enviarBien,
    enviarError,
    ejecutarAccion,
    ejecutarConsultaLista,
    ejecutarAyuda,
    ejecutarForzarGane,
    ejecutarForzarGanePlan,
    ejecutarPlan,
    ejecutarPlanStream,
    obtenerEstadoJuego
};

