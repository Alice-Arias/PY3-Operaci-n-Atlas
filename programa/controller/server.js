const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const {
    correrProlog,
    leerLista
} = require('./ejecutor_prolog');

// -----------------------------------------------------------------------------
// CONFIGURACION BASE
// -----------------------------------------------------------------------------
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function enviarBien(res, datos) {
    res.json(datos);
}
// quita los mensajes de error del codigo para que los unuarios solo vean lo relevante
function enviarError(res, mensaje) {
    let mensajeLimpio = mensaje || 'Error desconocido.';

    if (mensajeLimpio.includes('halt') ||
        mensajeLimpio.trim() === '' ||
        mensajeLimpio.includes('ERROR: Execution Aborted')) {
        mensajeLimpio = 'La accion no pudo completarse. Verifica que cumples los requisitos.';
    }

    if (mensajeLimpio.length > 300) {
        const matchError = mensajeLimpio.match(/ERROR:[^\n]+/);
        if (matchError) {
            mensajeLimpio = matchError[0];
        } else {
            mensajeLimpio = 'Error al ejecutar la accion en Prolog.';
        }
    }

    res.status(500).json({ error: mensajeLimpio });
}

// Convierte la salida de texto a lista JS si aplica
function convertirSalida(texto) {
    try {
        return leerLista(texto) || texto;
    } catch {
        return texto;
    }
}

// -----------------------------------------------------------------------------
// OBTENER ESTADO GLOBAL
// -----------------------------------------------------------------------------
function obtenerEstadoJuego() {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");
    if (!salida.ok) return null;
    return salida.out;
}
// -----------------------------------------------------------------------------
// EJECUTAR ACCION: corre meta, obtiene estado nuevo y responde
// -----------------------------------------------------------------------------
function ejecutarAccion(meta, res) {
    const salida = correrProlog(meta);

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }
    // Despues de la accion, obtener el estado actualizado
    const estado = obtenerEstadoJuego();
    enviarBien(res, {
        out: salida.out,
        estado
    });
}
// -----------------------------------------------------------------------------
// EJECUTAR CONSULTA DE LISTA
// -----------------------------------------------------------------------------
function ejecutarLista(meta, res) {
    const salida = correrProlog(meta);

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    enviarBien(res, {
        raw: salida.out,
        list: convertirSalida(salida.out)
    });
}
// -----------------------------------------------------------------------------
// MODULOS
// -----------------------------------------------------------------------------
app.get('/api/modulos', (req, res) => {
    ejecutarLista(
        "listar_modulos_ui(Ms), format('~q', [Ms])",
        res
    );
});
// -----------------------------------------------------------------------------
// ARTEFACTOS
// -----------------------------------------------------------------------------
app.get('/api/artefactos', (req, res) => {
    ejecutarLista(
        "listar_artefactos_ui(As), format('~q', [As])",
        res
    );
});
// -----------------------------------------------------------------------------
// ESTADO ACTUAL
// -----------------------------------------------------------------------------
app.get('/api/estado', (req, res) => {
    const salida = correrProlog("estado_ui(E), format('~q', [E])");

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    enviarBien(res, { estado: salida.out });
});
// -----------------------------------------------------------------------------
// INICIAR PARTIDA
// -----------------------------------------------------------------------------
app.post('/api/iniciar', (req, res) => {
    const nombreJugador = (req.body && req.body.nombre)
        ? req.body.nombre
        : 'anonimo';

    // Pasa el nombre como atomo para coincidir con los atomos del resto del juego
    const meta = `iniciar_partida_ui('${nombreJugador}')`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// MOVER
// siempre pasa atomos sin comillas para coincidir con el formato
// -----------------------------------------------------------------------------
app.post('/api/mover', (req, res) => {
    const destino = (req.body && req.body.destino) ? req.body.destino : null;
    if (!destino) {
        return res.status(400).json({ error: 'Falta el destino.' });
    }
    const meta = `mover_ui(${destino})`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// TOMAR ARTEFACTO
// -----------------------------------------------------------------------------
app.post('/api/tomar', (req, res) => {
    const artefacto = (req.body && req.body.artefacto) ? req.body.artefacto : null;

    if (!artefacto) {
        return res.status(400).json({ error: 'Falta el artefacto.' });
    }

    const meta = `tomar_artefacto_ui(${artefacto})`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// REPARAR SISTEMA
// -----------------------------------------------------------------------------
app.post('/api/reparar', (req, res) => {
    const sistema = (req.body && req.body.sistema) ? req.body.sistema : null;

    if (!sistema) {
        return res.status(400).json({ error: 'Falta el sistema.' });
    }

    const meta = `reparar_ui(${sistema})`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// RESCATAR TRIPULANTE
// -----------------------------------------------------------------------------
app.post('/api/rescatar', (req, res) => {
    const tripulante = (req.body && req.body.tripulante) ? req.body.tripulante : null;

    if (!tripulante) {
        return res.status(400).json({ error: 'Falta el nombre del tripulante.' });
    }

    const meta = `rescatar_ui(${tripulante})`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// GUARDAR PARTIDA
// -----------------------------------------------------------------------------
app.post('/api/guardar', (req, res) => {
    ejecutarAccion('guardar_partida_ui', res);
});
// -----------------------------------------------------------------------------
// CARGAR PARTIDA
// -----------------------------------------------------------------------------
app.post('/api/cargar', (req, res) => {
    const id = (req.body && req.body.id !== undefined) ? req.body.id : null;

    if (id === null) {
        return res.status(400).json({ error: 'Falta el id de partida.' });
    }

    const meta = `cargar_partida_ui(${id})`;
    ejecutarAccion(meta, res);
});
// -----------------------------------------------------------------------------
// AYUDA
// -----------------------------------------------------------------------------
app.post('/api/ayuda', (req, res) => {
    ejecutarAccion('ayuda_ui', res);
});
// -----------------------------------------------------------------------------
// VERIFICAR VICTORIA
// -----------------------------------------------------------------------------
app.post('/api/verificar', (req, res) => {
    ejecutarAccion('verifica_victoria_ui', res);
});
// -----------------------------------------------------------------------------
// PARTIDA ACTUAL
// -----------------------------------------------------------------------------
app.get('/api/partida_actual', (req, res) => {
    const salida = correrProlog('partida_actual_ui(Id), format("~w", [Id])');

    if (!salida.ok) {
        return enviarError(res, salida.err);
    }

    enviarBien(res, { id: salida.out });
});
// -----------------------------------------------------------------------------
// TEST
// -----------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor Atlas activo' });
});
// -----------------------------------------------------------------------------
// INICIAR SERVIDOR
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
========================================
 SERVIDOR NODE + PROLOG ACTIVO
 PUERTO: ${PORT}
========================================
`);
});

module.exports = app;