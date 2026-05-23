const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PROLOG_FILE = "../backend/juego.pl";


// =========================================================
// FUNCIÓN BASE (PROLOG ↔ NODE)
// =========================================================

function ejecutarProlog(query, res) {

    const command = `swipl -s ${PROLOG_FILE} -g "${query}" -t halt`;

    exec(command, (error, stdout, stderr) => {

        if (error) {
            return res.json({
                ok: false,
                error: stderr || error.message
            });
        }

        return res.json({
            ok: true,
            data: stdout.trim()
        });
    });
}


// =========================================================
// MOVIMIENTO
// =========================================================

app.post("/mover", (req, res) => {
    const { destino } = req.body;

    ejecutarProlog(`mover(${destino})`, res);
});


// =========================================================
// TOMAR ARTEFACTO
// =========================================================

app.post("/tomar", (req, res) => {
    const { artefacto } = req.body;

    ejecutarProlog(`tomar(${artefacto})`, res);
});


// =========================================================
// INVENTARIO
// =========================================================

app.get("/inventario", (req, res) => {
    ejecutarProlog("que_tengo", res);
});


// =========================================================
// DONDE ESTA ARTEFACTO
// =========================================================

app.get("/donde/:artefacto", (req, res) => {
    ejecutarProlog(`donde_esta(${req.params.artefacto})`, res);
});


// =========================================================
// RUTA ENTRE MÓDULOS
// =========================================================

app.get("/ruta/:inicio/:fin", (req, res) => {
    ejecutarProlog(
        `ruta(${req.params.inicio},${req.params.fin},Camino)`,
        res
    );
});


// =========================================================
// VERIFICAR VICTORIA
// =========================================================

app.get("/ganar", (req, res) => {
    ejecutarProlog("verifica_gane", res);
});


// =========================================================
// INICIAR SERVIDOR
// =========================================================

app.listen(3001, () => {
    console.log(" Controller corriendo en http://localhost:3001");
});