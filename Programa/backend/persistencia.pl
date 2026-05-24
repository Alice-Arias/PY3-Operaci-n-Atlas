% Este modulo guarda y carga una partida completa.
% Descripcion: serializa el estado actual a un archivo y luego lo restaura.
% Entrada: usa el estado dinamico del juego.
% Salida: archivos .sav y estado recuperado.
% Restricciones: los archivos deben poder leerse y escribirse.

:- dynamic jugador/1.
:- dynamic artefactosLogrados/1.
:- dynamic usado/1.
:- dynamic visitado/1.
:- dynamic tomado/1.
:- dynamic sistema/4.
:- dynamic tripulante/4.
:- dynamic jugador_nombre/1.
:- dynamic partida_actual/1.
:- dynamic partida_registro/4.

% capturar_estado_partida/1
% Descripcion: junta todo el estado en un solo termino.
% Entrada: no recibe nada.
% Salida: produce una estructura con toda la partida.
% Restricciones: requiere que exista una partida activa.
capturar_estado_partida(estado_partida(NombreJugador, IdPartida, Jugador, Inventario, Usados, Visitados, Tomados, Sistemas, Tripulacion)) :-
    jugador_nombre(NombreJugador),
    partida_actual(IdPartida),
    jugador(Jugador),
    artefactosLogrados(Inventario),
    findall(Artefacto, usado(Artefacto), Usados),
    findall(Modulo, visitado(Modulo), Visitados),
    findall(Artefacto, tomado(Artefacto), Tomados),
    findall(sistema(Modulo, Sistema, Requeridos, Estado), sistema(Modulo, Sistema, Requeridos, Estado), Sistemas),
    findall(tripulante(Nombre, Modulo, Requeridos, Estado), tripulante(Nombre, Modulo, Requeridos, Estado), Tripulacion).

% restaurar_estado_partida/1
% Descripcion: toma una partida guardada y la vuelve estado dinamico.
% Entrada: la estructura `estado_partida(...)`.
% Salida: deja el juego listo para seguir jugando.
% Restricciones: el termino debe tener la forma correcta.
restaurar_estado_partida(estado_partida(NombreJugador, IdPartida, Jugador, Inventario, Usados, Visitados, Tomados, Sistemas, Tripulacion)) :-
    retractall(jugador(_)),
    retractall(artefactosLogrados(_)),
    retractall(usado(_)),
    retractall(visitado(_)),
    retractall(tomado(_)),
    retractall(sistema(_, _, _, _)),
    retractall(tripulante(_, _, _, _)),
    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)),
    assertz(jugador(Jugador)),
    assertz(artefactosLogrados(Inventario)),
    assertz(jugador_nombre(NombreJugador)),
    assertz(partida_actual(IdPartida)),
    forall(member(Usado, Usados), assertz(usado(Usado))),%forall es para iterar sobre la lista y agregar cada elemento al estado dinamico, en este caso con assertz para agregarlo al final de la base de hechos
    forall(member(Visitado, Visitados), assertz(visitado(Visitado))),
    forall(member(Tomado, Tomados), assertz(tomado(Tomado))),
    forall(member(sistema(Modulo, Servicio, Requeridos, Estado), Sistemas), assertz(sistema(Modulo, Servicio, Requeridos, Estado))),
    forall(member(tripulante(Nombre, Modulo, Requeridos, Estado), Tripulacion), assertz(tripulante(Nombre, Modulo, Requeridos, Estado))).

% guardar_partida/1
% Descripcion: escribe la partida en un archivo.
% Entrada: ruta del archivo.
% Salida: crea o reemplaza el archivo con la partida.
% Restricciones: la ruta debe ser valida.
guardar_partida(Archivo) :- capturar_estado_partida(Estado),
    setup_call_cleanup(
        open(Archivo, write, Stream),
        format(Stream, '~q.~n', [Estado]),% ~q.~n' es para escribir el termino de forma legible y con un punto al final
        close(Stream)),
    (jugador_nombre(NombreJugador), partida_actual(IdPartida),
        ( partida_registro(NombreJugador, IdPartida, _, EstadoPrevio) ->  EstadoRegistro = EstadoPrevio ;  EstadoRegistro = pendiente)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, EstadoRegistro);   true), format("Partida guardada en ~w.~n", [Archivo]).

guardar_partida :- ( jugador_nombre(NombreJugador), partida_actual(IdPartida)->  partida_archivo(NombreJugador, IdPartida, Archivo),  guardar_partida(Archivo)
    ;   archivo_partida_por_defecto(Archivo),guardar_partida(Archivo) ).

% cargar_partida/1
% Descripcion: lee una partida desde un archivo.
% Entrada: ruta del archivo.
% Salida: restaura el estado guardado.
% Restricciones: el archivo debe existir y estar bien escrito.
cargar_partida(Archivo) :- exists_file(Archivo),
    setup_call_cleanup(%setup_call_cleanup es para asegurarnos de cerrar el archivo aunque haya errores
        open(Archivo, read, Stream),
        read(Stream, Estado),
        close(Stream)),
    restaurar_estado_partida(Estado),
    ( jugador_nombre(NombreJugador),partida_actual(IdPartida),\+ partida_registro(NombreJugador, IdPartida, _, _)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, pendiente);   true), format("Partida cargada desde ~w.~n", [Archivo]).

cargar_partida :-(jugador_nombre(NombreJugador),  partida_actual(IdPartida)
    ->  partida_archivo(NombreJugador, IdPartida, Archivo), cargar_partida(Archivo) ; archivo_partida_por_defecto(Archivo), cargar_partida(Archivo) ).

% marcar_partida_finalizada_actual/0
% Descripcion: cambia el estado de la partida a finalizada.
% Entrada: no recibe nada.
% Salida: actualiza el registro de esa partida.
% Restricciones: debe haber una partida activa.
marcar_partida_finalizada_actual :- jugador_nombre(NombreJugador),
    partida_actual(IdPartida),
    ( partida_registro(NombreJugador, IdPartida, Archivo, _)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, finalizada) ;partida_archivo(NombreJugador, IdPartida, Archivo), registrar_partida(NombreJugador, IdPartida, Archivo, finalizada)).
