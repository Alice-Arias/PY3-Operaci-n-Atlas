const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rutasApi = require('./rutas_api');

// -----------------------------------------------------------------------------
// CONFIGURACION BASE
// -----------------------------------------------------------------------------
// Nombre: servidor Express de Atlas
// Descripcion: crea la app HTTP principal y registra los middlewares globales.
// Entrada: no recibe datos; se configura al cargar el modulo.
// Salida: instancia de Express lista para escuchar peticiones.
// Restricciones: depende del paquete Express y de rutas validas para el API.
// Objetivo: concentrar el arranque del backend Node en un unico archivo.
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
// Ruta: GET /
// Descripcion: devuelve un mensaje simple de que el servidor esta activo.
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor Atlas activo' });
});
// -----------------------------------------------------------------------------
// INICIAR SERVIDOR
// -----------------------------------------------------------------------------
// Nombre: puerto de escucha del servidor
// Descripcion: determina el puerto donde Express quedara disponible.
// Entrada: variable de entorno PORT o el valor por defecto 3000.
// Salida: numero de puerto usado por `app.listen`.
// Restricciones: el puerto debe estar libre para poder arrancar.
// Objetivo: permitir despliegue flexible local o en hosting.
const PORT = process.env.PORT || 3000;

// Nombre: arranque del servidor HTTP
// Descripcion: inicia la app y escribe un mensaje de confirmacion en consola.
// Entrada: el puerto calculado arriba.
// Salida: servidor escuchando peticiones.
// Restricciones: si el puerto esta ocupado, el arranque fallara.
// Objetivo: dejar disponible el API para el frontend y los scripts.
app.listen(PORT, () => {
    console.log(`
========================================
 SERVIDOR NODE + PROLOG ACTIVO
 PUERTO: ${PORT}
========================================
`);
});

module.exports = app;