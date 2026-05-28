% maneja registro de partidas de jugadores.
% Descripcion: crea ids, buscar partidas pendientes, reanuda guardados.
% Entrada: nombre del jugador o id de partida.
% Salida: registro persistente y archivos por partida.
% Restricciones: usa la carpeta `partidas guardadas`.

:- dynamic jugador_nombre/1.
:- dynamic partida_actual/1.
:- dynamic partida_registro/4.

% registrar_partida/4
% Descripcion: guarda o actualiza una partida en el registro.
% Entrada: jugador, id, archivo y estado.
% Salida: deja el registro actualizado.
% Restricciones: si ya existia, se reemplaza.
registrar_partida(NombreJugador, IdPartida, Archivo, Estado) :- retractall(partida_registro(NombreJugador, IdPartida, _, _)),%retractall es para evitar duplicados, borra el registro viejo si existia
    assertz(partida_registro(NombreJugador, IdPartida, Archivo, Estado)),  persistir_registro_partidas.

% partida_archivo/3
% Descripcion: arma el nombre del archivo de guardado.
% Entrada: nombre del jugador e id de la partida.
% Salida: ruta completa dentro de `partidas guardadas`.
% Restricciones: el nombre se limpia un poco para evitar espacios.
partida_archivo(NombreJugador, IdPartida, Archivo) :- atom_string(NombreJugador, NombreTexto),
    split_string(NombreTexto, " ", "", Partes),
    atomic_list_concat(Partes, '_', NombreSeguro),
    number_string(IdPartida, IdTexto),
    atomic_list_concat(['partida_', NombreSeguro, '_', IdTexto, '.sav'], Relativo),
    atomic_list_concat(['data', Relativo], '/', Archivo).

% generar_id_partida/1
% Descripcion: crea un identificador nuevo para una partida.
% Entrada: no recibe nada.
% Salida: devuelve un numero 0, 1, 2, 3... 
% Restricciones: usa el siguiente numero libre.
generar_id_partida(IdPartida) :-  findall(Id, (partida_registro(_, Id, _, _), integer(Id)), Ids),
    ( Ids == []  ->  IdPartida = 0 ;  max_list(Ids, Maximo), IdPartida is Maximo + 1 ).

% cargar_registro_partidas/0
% Descripcion: lee el registro guardado desde disco.
% Entrada: no recibe nada.
% Salida: carga los hechos `partida_registro/4`.
% Restricciones: si no existe el archivo, no hace nada.
cargar_registro_partidas :- retractall(partida_registro(_, _, _, _)), archivo_registro_partidas(Archivo), exists_file(Archivo), consult(Archivo), !.
cargar_registro_partidas :- limpiar_registros_sin_archivo.

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

registro_con_archivo_existente(partida_registro(_, _, Archivo, _)) :-
    exists_file(Archivo).

% persistir_registro_partidas/0
% Descripcion: escribe el registro actual en disco.
% Entrada: no recibe nada.
% Salida: actualiza el archivo del registro.
% Restricciones: debe existir permiso de escritura.
persistir_registro_partidas :- archivo_registro_partidas(Archivo),
    findall(partida_registro(Nombre, Id, Ruta, Estado), partida_registro(Nombre, Id, Ruta, Estado), Registros),
    setup_call_cleanup(
        open(Archivo, write, Stream),
        forall(member(Registro, Registros), format(Stream, '~q.~n', [Registro])),
        close(Stream)).

% partidas_pendientes/2
% Descripcion: busca las partidas que aun estan pendientes.
% Entrada: nombre del jugador.
% Salida: lista de partidas sin terminar.
% Restricciones: solo devuelve partidas con estado pendiente.
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

avisar_partidas_pendientes(NombreJugador) :-
    partidas_pendientes(NombreJugador, Pendientes),
    ( Pendientes == []->  true;   format("Tienes estas partidas sin finalizar: ~w~n", [Pendientes]), writeln("Deseas terminarlas?")).

% iniciar_partida/1
% Descripcion: inicia una partida nueva para un jugador.
% Entrada: nombre del jugador.
% Salida: crea estado inicial, id y registro.
% Restricciones: si ya hay partidas pendientes, avisa primero.
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

% cargar_partida_id/1
% Descripcion: abre una partida usando su id.
% Entrada: id de la partida.
% Salida: carga el archivo relacionado.
% Restricciones: el id debe existir en el registro.
cargar_partida_id(IdPartida) :- partida_registro(NombreJugador, IdPartida, Archivo, _),  format("Cargando partida de ~w con id ~w.~n", [NombreJugador, IdPartida]), cargar_partida(Archivo).
