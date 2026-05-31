% maneja registro de partidas de jugadores.
% Descripcion: crea ids, buscar partidas pendientes, reanuda guardados.
% Entrada: nombre del jugador o id de partida.
% Salida: registro persistente y archivos por partida.
% Restricciones: usa la carpeta `partidas guardadas`.

:- dynamic jugador_nombre/1.
:- dynamic partida_actual/1.
:- dynamic partida_registro/4.

% Nombre: registrar_partida/4
% Descripcion: guarda o actualiza una partida en el registro.
% Entrada: jugador, id, archivo y estado.
% Salida: deja el registro actualizado.
% Restricciones: si ya existia, se reemplaza.
% Objetivo: mantener sincronizado el indice de partidas guardadas.
registrar_partida(NombreJugador, IdPartida, Archivo, Estado) :- retractall(partida_registro(NombreJugador, IdPartida, _, _)),%retractall es para evitar duplicados, borra el registro viejo si existia
    assertz(partida_registro(NombreJugador, IdPartida, Archivo, Estado)),  persistir_registro_partidas.

% Nombre: partida_archivo/3
% Descripcion: arma el nombre del archivo de guardado para una partida.
% Entrada: nombre del jugador e id de la partida.
% Salida: ruta completa dentro de `data/`.
% Restricciones: el nombre se limpia un poco para evitar espacios.
% Objetivo: generar rutas estables y predecibles para cada guardado.
partida_archivo(NombreJugador, IdPartida, Archivo) :- atom_string(NombreJugador, NombreTexto),
    split_string(NombreTexto, " ", "", Partes),
    atomic_list_concat(Partes, '_', NombreSeguro),
    number_string(IdPartida, IdTexto),
    atomic_list_concat(['partida_', NombreSeguro, '_', IdTexto, '.sav'], Relativo),
    atomic_list_concat(['data', Relativo], '/', Archivo).

% Nombre: generar_id_partida/1
% Descripcion: crea un identificador nuevo para una partida.
% Entrada: no recibe nada.
% Salida: devuelve un numero 0, 1, 2, 3... 
% Restricciones: usa el siguiente numero libre.
% Objetivo: evitar colisiones entre partidas guardadas.
generar_id_partida(IdPartida) :-  findall(Id, (partida_registro(_, Id, _, _), integer(Id)), Ids),
    ( Ids == []  ->  IdPartida = 0 ;  max_list(Ids, Maximo), IdPartida is Maximo + 1 ).

% Nombre: cargar_registro_partidas/0
% Descripcion: lee el registro guardado desde disco.
% Entrada: no recibe nada.
% Salida: carga los hechos `partida_registro/4`.
% Restricciones: si no existe el archivo, no hace nada.
% Objetivo: reconstruir el indice persistente al iniciar el sistema.
cargar_registro_partidas :- retractall(partida_registro(_, _, _, _)), archivo_registro_partidas(Archivo), exists_file(Archivo), consult(Archivo), !.
cargar_registro_partidas :- limpiar_registros_sin_archivo.

% Nombre: limpiar_registros_sin_archivo/0
% Descripcion: elimina registros cuyo archivo ya no existe.
% Entrada: no recibe datos.
% Salida: deja solo registros validos en memoria.
% Restricciones: reescribe el registro persistente si detecta cambios.
% Objetivo: evitar referencias rotas a guardados borrados.
limpiar_registros_sin_archivo :-
    findall(
        partida_registro(Nombre, Id, Archivo, Estado),
        partida_registro(Nombre, Id, Archivo, Estado),
        Registros
    ),
    include(registro_con_archivo_existente, Registros, RegistrosValidos),
    ( Registros == RegistrosValidos ->
        true
    ;
        retractall(partida_registro(_, _, _, _)),
        forall(member(Registro, RegistrosValidos), assertz(Registro)),
        persistir_registro_partidas
    ).

% Nombre: registro_con_archivo_existente/1
% Descripcion: valida que el archivo referenciado por un registro exista.
% Entrada: un hecho `partida_registro/4`.
% Salida: verdadero solo si el archivo se encuentra en disco.
% Restricciones: se usa como filtro interno.
% Objetivo: limpiar el indice de partidas corruptas o desactualizadas.
registro_con_archivo_existente(partida_registro(_, _, Archivo, _)) :-
    exists_file(Archivo).

% Nombre: persistir_registro_partidas/0
% Descripcion: escribe el registro actual en disco.
% Entrada: no recibe datos.
% Salida: actualiza el archivo del registro.
% Restricciones: debe existir permiso de escritura.
% Objetivo: mantener persistente el indice de partidas.
persistir_registro_partidas :- archivo_registro_partidas(Archivo),
    findall(partida_registro(Nombre, Id, Ruta, Estado), partida_registro(Nombre, Id, Ruta, Estado), Registros),
    setup_call_cleanup(
        open(Archivo, write, Stream),
        forall(member(Registro, Registros), format(Stream, '~q.~n', [Registro])),
        close(Stream)).

% Nombre: partidas_pendientes/2
% Descripcion: busca las partidas que aun estan pendientes.
% Entrada: nombre del jugador.
% Salida: lista de partidas sin terminar.
% Restricciones: solo devuelve partidas con estado pendiente.
% Objetivo: ofrecer reanudacion rapida de partidas abiertas.
partidas_pendientes(NombreJugador, Pendientes) :-
    downcase_atom(NombreJugador, Buscado),
    findall(
        partida(Id, Archivo),
        (
            partida_registro(Nombre, Id, Archivo, pendiente),
            downcase_atom(Nombre, Buscado)
        ),
        Pendientes
    ).

% Nombre: avisar_partidas_pendientes/1
% Descripcion: informa al jugador si tiene partidas sin finalizar.
% Entrada: nombre del jugador.
% Salida: mensaje de aviso o nada si no hay pendientes.
% Restricciones: solo muestra informacion, no altera datos.
% Objetivo: recordar al jugador que puede continuar una partida previa.
avisar_partidas_pendientes(NombreJugador) :-
    partidas_pendientes(NombreJugador, Pendientes),
    ( Pendientes == []->  true;   format("Tienes estas partidas sin finalizar: ~w~n", [Pendientes]), writeln("Deseas terminarlas?")).

% Nombre: iniciar_partida/1
% Descripcion: inicia una partida nueva para un jugador.
% Entrada: nombre del jugador.
% Salida: crea estado inicial, id y registro.
% Restricciones: si ya hay partidas pendientes, avisa primero.
% Objetivo: arrancar una sesion limpia y numerada para el jugador.
iniciar_partida(NombreJugador) :-
    estado_inicial,

    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)),

    generar_id_partida(IdPartida),

    assertz(jugador_nombre(NombreJugador)),
    assertz(partida_actual(IdPartida)),

    format(
        "Partida iniciada para ~w con id ~w.~n",
        [NombreJugador, IdPartida]
    ).

% Nombre: cargar_partida_id/1
% Descripcion: abre una partida usando su id.
% Entrada: id de la partida.
% Salida: carga el archivo relacionado.
% Restricciones: el id debe existir en el registro.
% Objetivo: permitir reanudar una partida concreta desde el indice.
cargar_partida_id(IdPartida) :- partida_registro(NombreJugador, IdPartida, Archivo, _),  format("Cargando partida de ~w con id ~w.~n", [NombreJugador, IdPartida]), cargar_partida(Archivo).
