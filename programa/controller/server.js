const express = require('express');
const bodyParser = require('body-parser');
const { correrProlog, leerLista } = require('./ejecutor_prolog');

// Servidor para hablar con Prolog
const app = express();
app.use(bodyParser.json());

// Esto deja que el navegador pueda hacer peticiones mientras probamos localmente.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') 
        return res.sendStatus(200);
    
    next();
});


// Manda una respuesta normal en JSON.
function enviarBien(res, datos) {
    res.json(datos);
}


// Manda un error en JSON.
function enviarError(res, mensaje) {
    res.status(500).json({ error: mensaje });
}

// Si Prolog manda una lista, la pasamos a lista de JS.
function convertirSalida(texto) {
    return leerLista(texto) || texto;
}

// Se usa cuando queremos devolver una lista.
function ejecutarLista(meta, res) {
    const salida = correrProlog(meta);

    if (!salida.ok) 
        return enviarError(res, salida.err);

    enviarBien(res, { raw: salida.out, list: convertirSalida(salida.out) });
}

// Se usa cuando solo queremos devolver texto.
function ejecutarTexto(meta, res) {
    const salida = correrProlog(meta);

    if (!salida.ok) 
        return enviarError(res, salida.err);

    enviarBien(res, { out: salida.out });
}

// Modulos
app.get('/api/modulos', (req, res) => {
    ejecutarLista("listar_modulos_ui(Ms), format('~q', [Ms])", res);
});

// Artefactos
app.get('/api/artefactos', (req, res) => {
    ejecutarLista("listar_artefactos_ui(As), format('~q', [As])", res);
});

// Iniciar partida
app.post('/api/iniciar', (req, res) => {
    const nombreJugador = req.body && req.body.nombre ? req.body.nombre : 'anonimo';
    const meta = `iniciar_partida_ui('${nombreJugador}')`;
    ejecutarTexto(meta, res);
});

// Tomar artefacto
app.post('/api/tomar', (req, res) => {
    const artefacto = req.body && req.body.artefacto ? req.body.artefacto : null;
    if (!artefacto) 
        return res.status(400).json({ error: 'artefacto missing' });
    const meta = `tomar_artefacto_ui(${artefacto})`;
    ejecutarTexto(meta, res);
});

// Guardar partida
app.post('/api/guardar', (req, res) => {
    ejecutarTexto('guardar_partida_ui', res);
});

// Id actual
app.get('/api/partida_actual', (req, res) => {
    const salida = correrProlog('partida_actual_ui(Id), format("~w", [Id])');

    if (!salida.ok) 
        return enviarError(res, salida.err);
    enviarBien(res, { id: salida.out });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Se esta ejecutando en el puerto ${PORT}`));

module.exports = app;
