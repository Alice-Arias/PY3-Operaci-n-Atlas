const express = require('express');
const { correrProlog } = require('./ejecutor_prolog');
const {
    enviarBien,
    enviarError,
    ejecutarAccion,
    ejecutarConsultaLista,
    ejecutarAyuda,
    ejecutarForzarGane
} = require('./servicio_prolog_api');
const { ejecutarForzarGanePlan } = require('./servicio_prolog_api');
const { ejecutarPlan } = require('./servicio_prolog_api');
const { ejecutarPlanStream } = require('./servicio_prolog_api');

const router = express.Router();

// Nombre: escaparAtomProlog/1
// Descripcion: duplica comillas simples para construir atoms seguros en Prolog.
// Entrada: texto libre.
// Salida: texto escapado para interpolarlo en consultas.
// Restricciones: no hace validacion semantica del contenido.
// Objetivo: evitar que una ruta rompa una consulta Prolog al insertar texto.
function escaparAtomProlog(texto) {
    return String(texto).replace(/'/g, "''");
}

// Ruta: GET /modulos
// Descripcion: devuelve los modulos disponibles para la interfaz.
router.get('/modulos', (req, res) => {
    ejecutarConsultaLista("listar_modulos_ui(Ms), format('~q', [Ms])", res);
});

// Ruta: GET /modulos_info
// Descripcion: devuelve nombre y descripcion de los modulos.
router.get('/modulos_info', (req, res) => {
    ejecutarConsultaLista("listar_modulos_info_ui(Ms), format('~q', [Ms])", res);
});

// Ruta: GET /artefactos
// Descripcion: devuelve la lista de artefactos visibles o disponibles.
router.get('/artefactos', (req, res) => {
    ejecutarConsultaLista("listar_artefactos_ui(As), format('~q', [As])", res);
});

// Ruta: GET /conexiones
// Descripcion: devuelve las conexiones entre modulos.
router.get('/conexiones', (req, res) => {
    ejecutarConsultaLista("listar_conexiones_ui(Cs), format('~q', [Cs])", res);
});

// Ruta: GET /ruta
// Descripcion: calcula rutas entre dos modulos usando los parametros `inicio` y `fin`.
router.get('/ruta', (req, res) => {
    const inicio = req.query && req.query.inicio ? String(req.query.inicio).trim() : '';
    const fin = req.query && req.query.fin ? String(req.query.fin).trim() : '';

    if (!inicio || !fin) {
        return res.status(400).json({ error: 'Faltan los modulos de inicio y fin.' });
    }

    return ejecutarConsultaLista(`findall(Camino, ruta('${escaparAtomProlog(inicio)}', '${escaparAtomProlog(fin)}', Camino), Rutas), format('~q', [Rutas])`, res);
});

// Ruta: GET /registro
// Descripcion: devuelve el registro persistente de partidas.
router.get('/registro', (req, res) => {
    ejecutarConsultaLista("listar_registro_partidas_ui(Rs), format('~q', [Rs])", res);
});

// Ruta: GET /pendientes
// Descripcion: devuelve partidas pendientes filtradas por nombre de jugador.
router.get('/pendientes', (req, res) => {
    const nombre = req.query && req.query.nombre ? String(req.query.nombre).trim() : '';

    if (!nombre) {
        return res.status(400).json({ error: 'Falta el nombre del jugador.' });
    }

    return ejecutarConsultaLista(`listar_partidas_pendientes_ui('${escaparAtomProlog(nombre)}', Ps), format('~q', [Ps])`, res);
});

// Ruta: GET /estado
// Descripcion: devuelve el estado completo actual de la partida.
router.get('/estado', (req, res) => {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    return enviarBien(res, { estado: salida.out });
});

// Ruta: POST /iniciar
// Descripcion: inicia una partida nueva para el nombre recibido.
router.post('/iniciar', (req, res) => {
    const nombreJugador = req.body && req.body.nombre ? req.body.nombre : 'anonimo';
    const meta = `iniciar_partida_ui('${nombreJugador}')`;
    ejecutarAccion(meta, res);
});

// Ruta: POST /mover
// Descripcion: mueve al jugador al modulo indicado.
router.post('/mover', (req, res) => {
    const destino = req.body && req.body.destino ? req.body.destino : null;

    if (!destino) {
        return res.status(400).json({ error: 'Falta el destino.' });
    }

    return ejecutarAccion(`mover_ui(${destino})`, res);
});

// Ruta: POST /tomar
// Descripcion: toma el artefacto indicado si esta disponible.
router.post('/tomar', (req, res) => {
    const artefacto = req.body && req.body.artefacto ? req.body.artefacto : null;

    if (!artefacto) {
        return res.status(400).json({ error: 'Falta el artefacto.' });
    }

    return ejecutarAccion(`tomar_artefacto_ui(${artefacto})`, res);
});

// Ruta: POST /reparar
// Descripcion: repara el sistema indicado en el modulo actual.
router.post('/reparar', (req, res) => {
    const sistema = req.body && req.body.sistema ? req.body.sistema : null;

    if (!sistema) {
        return res.status(400).json({ error: 'Falta el sistema.' });
    }

    return ejecutarAccion(`reparar_ui(${sistema})`, res);
});

// Ruta: POST /rescatar
// Descripcion: rescata al tripulante indicado en el modulo actual.
router.post('/rescatar', (req, res) => {
    const tripulante = req.body && req.body.tripulante ? req.body.tripulante : null;

    if (!tripulante) {
        return res.status(400).json({ error: 'Falta el nombre del tripulante.' });
    }

    return ejecutarAccion(`rescatar_ui(${tripulante})`, res);
});

// Ruta: POST /guardar
// Descripcion: guarda la partida actual en disco.
router.post('/guardar', (req, res) => {
    ejecutarAccion('guardar_partida_ui', res);
});

// Ruta: POST /cargar
// Descripcion: carga una partida previamente guardada por id.
router.post('/cargar', (req, res) => {
    const idPartida = req.body && req.body.id !== undefined ? req.body.id : null;

    if (idPartida === null) {
        return res.status(400).json({ error: 'Falta el id de partida.' });
    }

    return ejecutarAccion(`cargar_partida_ui(${idPartida})`, res);
});

// Ruta: POST /ayuda
// Descripcion: solicita la ayuda actualizada de Prolog.
router.post('/ayuda', (req, res) => {
    ejecutarAyuda(res);
});

// Ruta: POST /forzar_gane
// Descripcion: consulta si la partida sigue teniendo solucion.
router.post('/forzar_gane', (req, res) => {
    ejecutarForzarGane(res);
});

// Ruta: POST /forzar_gane_plan
// Descripcion: devuelve un plan de acciones para completar la partida.
router.post('/forzar_gane_plan', (req, res) => {
    ejecutarForzarGanePlan(res);
});

// Ruta: POST /forzar_gane_execute
// Descripcion: ejecuta el plan de victoria paso a paso.
router.post('/forzar_gane_execute', (req, res) => {
    ejecutarPlan(res);
});

// Ruta: GET /forzar_gane_execute_stream
// Descripcion: ejecuta el plan de victoria como stream SSE.
router.get('/forzar_gane_execute_stream', (req, res) => {
    ejecutarPlanStream(res);
});

// Ruta: POST /verificar
// Descripcion: verifica si la partida ya cumple la victoria.
router.post('/verificar', (req, res) => {
    ejecutarAccion('verifica_victoria_ui', res);
});

// Ruta: GET /partida_actual
// Descripcion: devuelve el id de la partida actual activa.
router.get('/partida_actual', (req, res) => {
    const salida = correrProlog('partida_actual_ui(Id), format("~w", [Id])');

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    return enviarBien(res, { id: salida.out });
});

module.exports = router;
