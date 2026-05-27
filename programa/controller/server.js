const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rutasApi = require('./rutas_api');

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
app.use('/api', rutasApi);
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