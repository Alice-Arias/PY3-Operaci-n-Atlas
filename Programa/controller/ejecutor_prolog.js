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
// Nombre: convertirRuta/1
// Descripcion: adapta una ruta de Windows o Unix al formato que Prolog acepta.
// Entrada: ruta del sistema operativo actual.
// Salida: cadena con separadores compatibles con Prolog.
// Restricciones: solo normaliza barras; no valida la existencia del archivo.
// Objetivo: evitar fallos al cargar modulos desde distintas plataformas.
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
// Nombre: armarMetaCompleta/1
// Descripcion: construye la consulta base que arranca Prolog con todos los modulos.
// Entrada: una meta opcional para ejecutar tras cargar el sistema.
// Salida: cadena lista para pasar a `swipl -g`.
// Restricciones: asume que el entorno necesita `main.pl`, persistencia y traductor.
// Objetivo: estandarizar el arranque de todas las consultas Prolog.
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
// Nombre: ejecutarComando/1
// Descripcion: ejecuta una meta de Prolog en un proceso SWI-Prolog.
// Entrada: meta completa ya preparada para el argumento `-g`.
// Salida: objeto con `ok` y `out` o con `ok=false` y `err`.
// Restricciones: depende de que `swipl` este disponible en el sistema.
// Objetivo: concentrar la ejecucion real de Prolog en un unico punto.
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
// Nombre: correrProlog/1
// Descripcion: prepara y ejecuta una consulta Prolog de alto nivel.
// Entrada: meta logica compacta sin el arranque comun.
// Salida: resultado de `ejecutarComando/1`.
// Restricciones: la meta debe ser una cadena valida para Prolog.
// Objetivo: exponer una funcion simple para el resto del backend.
function correrProlog(meta) {
    const metaCompleta = armarMetaCompleta(meta);
    return ejecutarComando(metaCompleta);
}

// Nombre: esListaProlog/1
// Descripcion: comprueba si una cadena tiene forma de lista Prolog.
// Entrada: texto a revisar.
// Salida: verdadero si comienza con `[` y termina con `]`.
// Restricciones: no analiza contenido interno.
// Objetivo: decidir si conviene parsear una salida como lista.
function esListaProlog(cadena) {
    if (!cadena) return false;
    const textoLista = cadena.trim();
    return textoLista.startsWith("[") && textoLista.endsWith("]");
}

// Nombre: limpiarElemento/1
// Descripcion: elimina comillas externas de un elemento textual de Prolog.
// Entrada: texto a limpiar.
// Salida: cadena sin comillas externas.
// Restricciones: solo quita una capa de comillas simples o dobles.
// Objetivo: convertir salidas crudas de Prolog en texto legible.
function limpiarElemento(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const t = texto.trim();
    if ((t.startsWith("'") && t.endsWith("'")) ||
        (t.startsWith('"') && t.endsWith('"'))) {
        return t.slice(1, -1);
    }
    return t;
}

// Nombre: separarElementos/1
// Descripcion: divide una lista Prolog sin romper sublistas o terminos anidados.
// Entrada: texto que contiene los elementos internos de una lista.
// Salida: array de elementos separados por comas de nivel superior.
// Restricciones: asume parentesis y corchetes balanceados.
// Objetivo: permitir parsear estructuras complejas sin usar un parser completo.
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

// Nombre: leerLista/1
// Descripcion: convierte una lista Prolog textual en un arreglo de JavaScript.
// Entrada: cadena con la lista en sintaxis Prolog.
// Salida: arreglo o null si la entrada no tiene formato de lista.
// Restricciones: solo entiende listas de texto, no terminos ejecutables.
// Objetivo: reutilizar una lectura simple de listas en todo el backend.
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