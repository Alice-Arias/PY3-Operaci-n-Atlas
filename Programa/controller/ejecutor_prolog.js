const { execSync } = require("child_process");
const path = require("path");
const os = require("os");

const SWIPL = "swipl";

//Ruta principal del proyecto Prolog
const MAIN = path.join(__dirname, "..", "main.pl");

//Traductor/interfaz Prolog
const TRADUCTOR = path.join(__dirname, "traductor.pl");

//persistencia de estado
const PERSISTENCIA = path.join(__dirname, "estado_persistente.pl");

// Archivo donde se guarda el estado dinamico entre llamadas
// Se guarda en la carpeta del proyecto (junto a main.pl)
const ESTADO_ARCHIVO = path.join(__dirname, "..", "estado_actual.pl");

// Carpeta raíz del proyecto
const ROOT_DIR = path.join(__dirname, "..");

// -----------------------------------------------------------------------------
// CONVERSION DE RUTAS
// -----------------------------------------------------------------------------
function convertirRuta(ruta) {
    if (os.platform() === 'win32') {
        // En Windows: reemplazar \ por / (Prolog acepta slash en Windows tambien)
        return ruta.replace(/\\/g, '/');
    }
    return ruta;
}
// -----------------------------------------------------------------------------
// ARMAR META COMPLETA
// -----------------------------------------------------------------------------
function armarMetaCompleta(meta) {
    const mainRuta        = convertirRuta(MAIN);
    const persistenciaRuta = convertirRuta(PERSISTENCIA);
    const traductorRuta   = convertirRuta(TRADUCTOR);
    const estadoRuta      = convertirRuta(ESTADO_ARCHIVO);
    const partes = [
        // Pasar la ruta del archivo de estado como variable de entorno
        // para que estado_persistente.pl sepa donde leer/escribir
        `setenv('ATLAS_STATE_FILE', '${estadoRuta}')`,
        `consult('${mainRuta}')`,
        `consult('${persistenciaRuta}')`,
        `consult('${traductorRuta}')`,
    ];

    if (meta && meta.trim() !== '') {
        partes.push(meta.trim());
    }

    partes.push('halt');

    return partes.join(', ');
}
// -----------------------------------------------------------------------------
// EJECUTAR COMANDO SWIPL
// -----------------------------------------------------------------------------
function ejecutarComando(metaCompleta) {
    // Usa una lista de argumentos en lugar de string para que no haya problemas de caracteres
    const comando = `${SWIPL} -q -g "${metaCompleta}"`;
    try {
        const salida = execSync(comando, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            cwd: ROOT_DIR,
            timeout: 15000
        });
        return {
            ok: true,
            out: salida.trim()
        };
    } catch (error) {
        // Construir un mensaje con stdout, stderr y message para no perder los prints de Prolog
        const stdoutText = (error.stdout && typeof error.stdout === 'string') ? error.stdout : (error.stdout ? error.stdout.toString() : '');
        const stderrText = (error.stderr && typeof error.stderr === 'string') ? error.stderr : (error.stderr ? error.stderr.toString() : '');
        const mensajeParts = [];
        if (stdoutText && stdoutText.toString().trim()) mensajeParts.push(stdoutText.toString().trim());
        if (stderrText && stderrText.toString().trim()) mensajeParts.push(stderrText.toString().trim());
        if (error.message) mensajeParts.push(error.message.toString());
        const mensajeError = mensajeParts.join('\n').trim();

        const fallback = 'La accion no pudo completarse. Verifica que cumples los requisitos.';
        return {
            ok: false,
            err: mensajeError || fallback
        };
    }
}
// -----------------------------------------------------------------------------
// API
// -----------------------------------------------------------------------------
function correrProlog(meta) {
    const metaCompleta = armarMetaCompleta(meta);
    return ejecutarComando(metaCompleta);
}

function esListaProlog(cadena) {
    if (!cadena) return false;
    const textoLista = cadena.trim();
    return textoLista.startsWith("[") && textoLista.endsWith("]");
}

function limpiarElemento(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const t = texto.trim();
    if ((t.startsWith("'") && t.endsWith("'")) ||
        (t.startsWith('"') && t.endsWith('"'))) {
        return t.slice(1, -1);
    }
    return t;
}

function separarElementos(textoLista) {
    const elementos = [];
    let acumulado = '';
    let profundidad = 0;

    for (let i = 0; i < textoLista.length; i++) {
        const c = textoLista[i];
        if (c === '[' || c === '(') profundidad++;
        if (c === ']' || c === ')') profundidad--;
        if (c === ',' && profundidad === 0) {
            elementos.push(acumulado.trim());
            acumulado = '';
            continue;
        }
        acumulado += c;
    }

    if (acumulado.trim() !== '') elementos.push(acumulado.trim());
    return elementos;
}

function leerLista(cadena) {
    if (!esListaProlog(cadena)) return null;

    const textoLista = cadena.trim();
    const textoInterno = textoLista.slice(1, -1).trim();

    if (textoInterno === "") return [];

    const partes = separarElementos(textoInterno);
    return partes.map(limpiarElemento);
}

module.exports = {
    correrProlog,
    leerLista
};