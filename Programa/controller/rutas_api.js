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

const router = express.Router();

function escaparAtomProlog(texto) {
    return String(texto).replace(/'/g, "''");
}

router.get('/modulos', (req, res) => {
    ejecutarConsultaLista("listar_modulos_ui(Ms), format('~q', [Ms])", res);
});

router.get('/modulos_info', (req, res) => {
    ejecutarConsultaLista("listar_modulos_info_ui(Ms), format('~q', [Ms])", res);
});

router.get('/artefactos', (req, res) => {
    ejecutarConsultaLista("listar_artefactos_ui(As), format('~q', [As])", res);
});

router.get('/conexiones', (req, res) => {
    ejecutarConsultaLista("listar_conexiones_ui(Cs), format('~q', [Cs])", res);
});

router.get('/registro', (req, res) => {
    ejecutarConsultaLista("listar_registro_partidas_ui(Rs), format('~q', [Rs])", res);
});

router.get('/pendientes', (req, res) => {
    const nombre = req.query && req.query.nombre ? String(req.query.nombre).trim() : '';

    if (!nombre) {
        return res.status(400).json({ error: 'Falta el nombre del jugador.' });
    }

    return ejecutarConsultaLista(`listar_partidas_pendientes_ui('${escaparAtomProlog(nombre)}', Ps), format('~q', [Ps])`, res);
});

router.get('/estado', (req, res) => {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    return enviarBien(res, { estado: salida.out });
});

router.post('/iniciar', (req, res) => {
    const nombreJugador = req.body && req.body.nombre ? req.body.nombre : 'anonimo';
    const meta = `iniciar_partida_ui('${nombreJugador}')`;
    ejecutarAccion(meta, res);
});

router.post('/mover', (req, res) => {
    const destino = req.body && req.body.destino ? req.body.destino : null;

    if (!destino) {
        return res.status(400).json({ error: 'Falta el destino.' });
    }

    return ejecutarAccion(`mover_ui(${destino})`, res);
});

router.post('/tomar', (req, res) => {
    const artefacto = req.body && req.body.artefacto ? req.body.artefacto : null;

    if (!artefacto) {
        return res.status(400).json({ error: 'Falta el artefacto.' });
    }

    return ejecutarAccion(`tomar_artefacto_ui(${artefacto})`, res);
});

router.post('/reparar', (req, res) => {
    const sistema = req.body && req.body.sistema ? req.body.sistema : null;

    if (!sistema) {
        return res.status(400).json({ error: 'Falta el sistema.' });
    }

    return ejecutarAccion(`reparar_ui(${sistema})`, res);
});

router.post('/rescatar', (req, res) => {
    const tripulante = req.body && req.body.tripulante ? req.body.tripulante : null;

    if (!tripulante) {
        return res.status(400).json({ error: 'Falta el nombre del tripulante.' });
    }

    return ejecutarAccion(`rescatar_ui(${tripulante})`, res);
});

router.post('/guardar', (req, res) => {
    ejecutarAccion('guardar_partida_ui', res);
});

router.post('/cargar', (req, res) => {
    const idPartida = req.body && req.body.id !== undefined ? req.body.id : null;

    if (idPartida === null) {
        return res.status(400).json({ error: 'Falta el id de partida.' });
    }

    return ejecutarAccion(`cargar_partida_ui(${idPartida})`, res);
});

router.post('/ayuda', (req, res) => {
    ejecutarAyuda(res);
});

router.post('/forzar_gane', (req, res) => {
    ejecutarForzarGane(res);
});

router.post('/verificar', (req, res) => {
    ejecutarAccion('verifica_victoria_ui', res);
});

router.get('/partida_actual', (req, res) => {
    const salida = correrProlog('partida_actual_ui(Id), format("~w", [Id])');

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    return enviarBien(res, { id: salida.out });
});

module.exports = router;
