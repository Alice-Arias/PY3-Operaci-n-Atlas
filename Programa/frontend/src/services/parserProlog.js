// Nombre: limpiarElemento/1
// Descripcion: elimina comillas externas de un elemento textual de Prolog.
// Entrada: texto a limpiar.
// Salida: cadena sin comillas externas o el valor original si no aplica.
// Restricciones: solo quita una capa de comillas simples o dobles.
// Objetivo: convertir salidas crudas de Prolog en texto legible.
function limpiarElemento(texto) {
    if (!texto || typeof texto !== 'string') return texto;
    const valor = texto.trim();
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
        return valor.slice(1, -1);
    }
    return valor;
}

// Nombre: dividirNivelSuperior/1
// Descripcion: separa elementos de nivel superior sin romper listas anidadas.
// Entrada: texto que contiene elementos separados por coma.
// Salida: arreglo de fragmentos de nivel principal.
// Restricciones: asume parentesis y corchetes balanceados.
// Objetivo: permitir parsear estructuras complejas sin un parser completo.
function dividirNivelSuperior(texto) {
    const elementos = [];
    let acumulado = '';
    let profundidad = 0;

    for (let i = 0; i < texto.length; i += 1) {
        const caracter = texto[i];

        if (caracter === '[' || caracter === '(') profundidad += 1;
        if (caracter === ']' || caracter === ')') profundidad -= 1;

        if (caracter === ',' && profundidad === 0) {
            elementos.push(acumulado.trim());
            acumulado = '';
            continue;
        }

        acumulado += caracter;
    }

    if (acumulado.trim() !== '') elementos.push(acumulado.trim());
    return elementos;
}

// Nombre: parsearListaProlog/1
// Descripcion: convierte una lista textual de Prolog en un arreglo de JavaScript.
// Entrada: texto con sintaxis de lista Prolog.
// Salida: arreglo de elementos o lista vacia si no hay contenido.
// Restricciones: solo entiende listas simples o anidadas por nivel superior.
// Objetivo: unificar la lectura de listas que devuelve el backend.
function parsearListaProlog(texto) {
    if (!texto || typeof texto !== 'string') return [];

    const valor = texto.trim();
    if (!valor.startsWith('[') || !valor.endsWith(']')) {
        return [limpiarElemento(valor)].filter(Boolean);
    }

    const contenido = valor.slice(1, -1).trim();
    if (contenido === '') return [];

    return dividirNivelSuperior(contenido).map((item) => limpiarElemento(item));
}

// Nombre: parsearTerminos/3
// Descripcion: convierte una lista de terminos Prolog en objetos JavaScript.
// Entrada: texto, prefijo esperado y nombres de campos destino.
// Salida: arreglo de objetos mapeados por campos.
// Restricciones: solo acepta terminos que empiezan con el prefijo indicado.
// Objetivo: transformar estructuras Prolog en registros faciles de usar en React.
function parsearTerminos(texto, prefijo, campos) {
    const lista = parsearListaProlog(texto);
    return lista
        .map((item) => {
            const textoItem = item.trim();
            if (!textoItem.startsWith(`${prefijo}(`) || !textoItem.endsWith(')')) {
                return null;
            }
            const contenido = textoItem.slice(prefijo.length + 1, -1);
            const valores = dividirNivelSuperior(contenido).map((parte) => limpiarElemento(parte));
            const registro = {};
            campos.forEach((campo, indice) => {
                registro[campo] = valores[indice] || null;
            });
            return registro;
        })
        .filter(Boolean);
}

// Nombre: parsearEstadoProlog/1
// Descripcion: reconstruye el estado completo de la partida desde la salida de Prolog.
// Entrada: texto serializado que describe el estado.
// Salida: objeto con modulo, inventario, sistemas, tripulacion y otros datos.
// Restricciones: espera exactamente siete secciones internas.
// Objetivo: entregar un objeto estable para la interfaz.
export function parsearEstadoProlog(texto) {
    if (!texto || typeof texto !== 'string') return null;

    const valor = texto.trim();
    const coincidencia = valor.match(/^estado\s*\((.*)\)$/s);
    if (!coincidencia) return null;

    const partes = dividirNivelSuperior(coincidencia[1]);
    if (partes.length !== 7) return null;

    return {
        moduloActual: limpiarElemento(partes[0]),
        inventario: parsearListaProlog(partes[1]),
        visitados: parsearListaProlog(partes[2]),
        sistemas: parsearTerminos(partes[3], 'sistema_data', ['modulo', 'sistema', 'estado']),
        tripulantes: parsearTerminos(partes[4], 'tripulante_data', ['nombre', 'modulo', 'estado']),
        modulosConectados: parsearListaProlog(partes[5]),
        artefactosDisponibles: parsearTerminos(partes[6], 'artefacto_data', ['artefacto', 'modulo'])
    };
}

// Nombre: parsearConexionesProlog/1
// Descripcion: convierte la salida de conexiones en una lista de origen y destino.
// Entrada: texto con terminos `conexion(...)`.
// Salida: arreglo de objetos con `origen` y `destino`.
// Restricciones: descarta conexiones incompletas.
// Objetivo: alimentar el mapa y las rutas de la UI.
export function parsearConexionesProlog(texto) {
    if (!texto || typeof texto !== 'string') return [];

    return parsearTerminos(texto, 'conexion', ['origen', 'destino'])
        .filter((conexion) => conexion.origen && conexion.destino);
}

// Nombre: parsearModulosInfo/1
// Descripcion: convierte la salida de modulos en objetos con modulo y descripcion.
// Entrada: texto con terminos `modulo_data(...)`.
// Salida: arreglo de registros legibles.
// Restricciones: ignora items sin nombre de modulo.
// Objetivo: mostrar descripciones de cada modulo en la interfaz.
export function parsearModulosInfo(texto) {
    if (!texto || typeof texto !== 'string') return [];

    return parsearTerminos(texto, 'modulo_data', ['modulo', 'descripcion'])
        .filter((item) => item.modulo);
}

// Nombre: parsearRegistroProlog/1
// Descripcion: convierte el registro de partidas en objetos accesibles desde React.
// Entrada: texto con terminos `partida_registro(...)`.
// Salida: arreglo de registros con jugador, id, archivo y estado.
// Restricciones: descarta registros sin id valido.
// Objetivo: poblar la lista de misiones guardadas.
export function parsearRegistroProlog(texto) {
    if (!texto || typeof texto !== 'string') return [];

    return parsearTerminos(texto, 'partida_registro', ['jugador', 'idPartida', 'archivo', 'estado'])
        .filter((registro) => registro.jugador && registro.idPartida !== null);
}

// Nombre: parsearPendientesProlog/1
// Descripcion: convierte la salida de partidas pendientes en un arreglo utilizable.
// Entrada: texto con terminos `partida(...)`.
// Salida: arreglo de registros con id y archivo.
// Restricciones: solo conserva entradas con id valido.
// Objetivo: permitir continuar partidas desde la pantalla inicial.
export function parsearPendientesProlog(texto) {
    if (!texto || typeof texto !== 'string') return [];

    return parsearTerminos(texto, 'partida', ['idPartida', 'archivo'])
        .filter((registro) => registro.idPartida !== null);
}
