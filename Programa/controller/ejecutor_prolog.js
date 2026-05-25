const { execSync } = require("child_process");
const path = require("path");

const SWIPL = "swipl";

// Ruta principal del proyecto Prolog
const MAIN = path.join(__dirname, "..", "main.pl");

// Traductor/interfaz Prolog
const TRADUCTOR = path.join(__dirname, "traductor.pl");

// Carpeta raíz del proyecto
const ROOT_DIR = path.join(__dirname, "..");

function convertirRuta(ruta) {
    return ruta.replace(/\\/g, "\\\\");
}

function armarMetaCompleta(meta) {

    const cargarArchivos =
        `consult('${convertirRuta(MAIN)}'), ` +
        `consult('${convertirRuta(TRADUCTOR)}'), `;

    return cargarArchivos + meta + ", halt.";
}

// Corre el comando de Prolog y devuelve la salida o el error.
function ejecutarComando(metaCompleta) {

    const comando = `${SWIPL} -q -g "${metaCompleta}"`;

    try {

        const salida = execSync(comando, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            cwd: ROOT_DIR
        });

        return {
            ok: true,
            out: salida.trim()
        };

    } catch (error) {

        return {
            ok: false,
            err: (error.stderr || error.message).toString()
        };
    }
}

// Recibe una meta Prolog en texto y la ejecuta.
function correrProlog(meta) {

    const metaCompleta = armarMetaCompleta(meta);

    return ejecutarComando(metaCompleta);
}

// Revisa si el texto parece una lista Prolog como [a,b,c].
function esListaProlog(cadena) {

    if (!cadena)
        return false;

    const textoLista = cadena.trim();

    return textoLista.startsWith("[") && textoLista.endsWith("]");
}

// Quita comillas al principio y al final si existen.
function limpiarElemento(texto) {

    if (texto.startsWith("'") && texto.endsWith("'"))
        return texto.slice(1, -1);

    if (texto.startsWith('"') && texto.endsWith('"'))
        return texto.slice(1, -1);

    return texto;
}

// Divide una lista Prolog simple en partes.
function separarElementos(textoLista) {

    return textoLista
        .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
        .map((textoParte) => textoParte.trim());
}

// Convierte una lista Prolog como [a,b,c] en un array de JS.
function leerLista(cadena) {

    if (!esListaProlog(cadena))
        return null;

    const textoLista = cadena.trim();

    const textoInterno = textoLista.slice(1, -1).trim();

    if (textoInterno === "")
        return [];

    const partes = separarElementos(textoInterno);

    return partes.map((elementoLista) =>
        limpiarElemento(elementoLista)
    );
}

module.exports = {
    correrProlog,
    leerLista
};