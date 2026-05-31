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

% Nombre: predicados_base_snapshot/1
% Descripcion: lista de predicados estaticos que deben viajar con una partida guardada.
% Entrada: no recibe datos.
% Salida: indicador de predicados a serializar y restaurar.
% Restricciones: debe mantenerse alineada con backend/datos.pl.
% Objetivo: conservar el mismo mundo logico aunque el archivo base cambie despues.
predicados_base_snapshot([
    archivo_partida_por_defecto/1,
    archivo_registro_partidas/1,
    modulo/2,
    enlace/2,
    artefacto/2,
    sistema_inicial/4,
    tripulante_inicial/4,
    necesita/2,
    necesita_estado/3,
    paso_previo/2,
    objetivo_sistema/2,
    objetivo_tripulante/2,
    jugador_inicial/1,
    inventario_inicial/1,
    visitado_inicial/1,
    usado_inicial/1,
    tomado_inicial/1
]).

% Nombre: predicados_estado_partida/1
% Descripcion: lista de predicados dinamicos que representan el progreso actual.
% Entrada: no recibe datos.
% Salida: indicador de predicados que se restauran al cargar una partida.
% Restricciones: debe incluir solo los hechos mutables de la sesion.
% Objetivo: rehidratar la partida exactamente como estaba al guardarse.
predicados_estado_partida([
    jugador/1,
    artefactosLogrados/1,
    usado/1,
    visitado/1,
    tomado/1,
    sistema/4,
    tripulante/4,
    jugador_nombre/1,
    partida_actual/1
]).

% Nombre: formato_guardado_partida/1
% Descripcion: version del formato de archivo usada por los guardados nuevos.
% Entrada: no recibe datos.
% Salida: entero de version.
% Restricciones: aumentar solo si cambia la estructura del archivo guardado.
% Objetivo: distinguir guardados nuevos de archivos heredados.
formato_guardado_partida(2).

% Nombre: clausulas_predicado/2
% Descripcion: obtiene todas las clausulas de un predicado disponible en memoria.
% Entrada: indicador de predicado y variable para la lista de clausulas.
% Salida: lista de clausulas listas para escribir en disco.
% Restricciones: solo funciona con predicados existentes en el modulo actual.
% Objetivo: serializar tanto hechos como reglas sin depender de un formato manual.
clausulas_predicado(Predicado/Aridad, Clausulas) :-
    functor(Plantilla, Predicado, Aridad),
    findall((Cabeza :- Cuerpo), clause(Plantilla, Cuerpo), Clausulas).

% Nombre: escribir_clausulas_predicado/2
% Descripcion: vuelca todas las clausulas de un predicado en un stream.
% Entrada: stream abierto e indicador de predicado.
% Salida: escribe hechos y reglas con sintaxis Prolog valida.
% Restricciones: asume que el predicado existe y puede enumerarse.
% Objetivo: construir archivos de guardado autocontenidos.
escribir_clausulas_predicado(Stream, Predicado/Aridad) :-
    clausulas_predicado(Predicado/Aridad, Clausulas),
    forall(member((Cabeza :- Cuerpo), Clausulas), portray_clause(Stream, (Cabeza :- Cuerpo))).

% Nombre: escribir_snapshot_base/1
% Descripcion: escribe en disco la base estatica necesaria para reconstruir la partida.
% Entrada: stream abierto.
% Salida: clausulas estaticas del mundo Atlas.
% Restricciones: debe escribirse antes del estado dinamico de la partida.
% Objetivo: congelar el mapa, requisitos y configuracion usados por esa partida.
escribir_snapshot_base(Stream) :-
    predicados_base_snapshot(Predicados),
    forall(member(Predicado, Predicados), escribir_clausulas_predicado(Stream, Predicado)).

% Nombre: escribir_estado_dinamico/1
% Descripcion: escribe en disco el estado actual de la partida.
% Entrada: stream abierto.
% Salida: clausulas mutables guardadas como Prolog.
% Restricciones: debe escribirse despues del snapshot base.
% Objetivo: persistir el progreso del jugador en el mismo archivo.
escribir_estado_dinamico(Stream) :-
    predicados_estado_partida(Predicados),
    forall(member(Predicado, Predicados), escribir_clausulas_predicado(Stream, Predicado)).

% Nombre: detectar_formato_guardado_v2/1
% Descripcion: comprueba si un archivo usa el formato nuevo con snapshot completo.
% Entrada: ruta del archivo.
% Salida: verdadero si el primer termino marca la version nueva.
% Restricciones: no modifica el archivo y tolera fallos de lectura.
% Objetivo: mantener compatibilidad con guardados antiguos.
detectar_formato_guardado_v2(Archivo) :-
    setup_call_cleanup(
        open(Archivo, read, Stream),
        read(Stream, PrimerTermino),
        close(Stream)
    ),
    PrimerTermino =.. [partida_guardada_version, Version],
    formato_guardado_partida(Version).

% Nombre: limpiar_predicados_snapshot/0
% Descripcion: borra la base estatica y el estado dinamico antes de restaurar un guardado nuevo.
% Entrada: no recibe datos.
% Salida: deja el modulo listo para consultar un archivo autocontenido.
% Restricciones: solo debe usarse cuando el archivo guardado trae snapshot completo.
% Objetivo: evitar mezclar el mundo actual con el mundo historico de una partida.
limpiar_predicados_snapshot :-
    predicados_base_snapshot(BasePredicados),
    forall(member(Predicado, BasePredicados), catch(abolish_predicado_guardado(Predicado), _, true)),
    predicados_estado_partida(EstadoPredicados),
    forall(member(Predicado, EstadoPredicados), catch(abolish_predicado_guardado(Predicado), _, true)).

% Nombre: abolish_predicado_guardado/1
% Descripcion: elimina por completo la definicion de un predicado guardado.
% Entrada: indicador de predicado.
% Salida: deja el predicado sin clausulas en memoria.
% Restricciones: el indicador debe estar en forma Nombre/Aridad.
% Objetivo: permitir cargar un snapshot limpio sin arrastrar hechos previos.
abolish_predicado_guardado(Predicado/Aridad) :-
    functor(Plantilla, Predicado, Aridad),
    abolish(Plantilla).

% Nombre: capturar_estado_partida/1
% Descripcion: junta todo el estado en un unico termino serializable.
% Entrada: no recibe datos.
% Salida: estructura `estado_partida(...)` con todo el progreso.
% Restricciones: requiere que exista una partida activa.
% Objetivo: preparar la informacion para guardarla en disco.
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

% Nombre: restaurar_estado_partida/1
% Descripcion: toma una partida guardada y la vuelve estado dinamico.
% Entrada: la estructura `estado_partida(...)`.
% Salida: deja el juego listo para seguir jugando.
% Restricciones: el termino debe tener la forma correcta.
% Objetivo: reconstruir una partida exacta desde su archivo.
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

% Nombre: guardar_partida/1
% Descripcion: escribe la partida actual en un archivo.
% Entrada: ruta del archivo.
% Salida: crea o reemplaza el archivo con la partida.
% Restricciones: la ruta debe ser valida y escribible.
% Objetivo: persistir el estado actual para continuar luego.
guardar_partida(Archivo) :-
    setup_call_cleanup(
        open(Archivo, write, Stream),
        (
            formato_guardado_partida(Version),
            format(Stream, 'partida_guardada_version(~w).~n', [Version]),
            escribir_snapshot_base(Stream),
            escribir_estado_dinamico(Stream)
        ),
        close(Stream)
    ),
    (jugador_nombre(NombreJugador), partida_actual(IdPartida),
        ( partida_registro(NombreJugador, IdPartida, _, EstadoPrevio) ->  EstadoRegistro = EstadoPrevio ;  EstadoRegistro = pendiente)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, EstadoRegistro);   true), format("Partida guardada en ~w.~n", [Archivo]).

guardar_partida :- ( jugador_nombre(NombreJugador), partida_actual(IdPartida)->  partida_archivo(NombreJugador, IdPartida, Archivo),  guardar_partida(Archivo)
    ;   archivo_partida_por_defecto(Archivo),guardar_partida(Archivo) ).

% Nombre: cargar_partida/1
% Descripcion: lee una partida desde un archivo y la restaura.
% Entrada: ruta del archivo.
% Salida: recupera el estado guardado en memoria dinamica.
% Restricciones: el archivo debe existir y estar bien escrito.
% Objetivo: reanudar una partida previa desde disco.
restaurar_partida_legacy(Archivo) :-
    setup_call_cleanup(%setup_call_cleanup es para asegurarnos de cerrar el archivo aunque haya errores
        open(Archivo, read, Stream),
        read(Stream, Estado),
        close(Stream)),
    restaurar_estado_partida(Estado),
    ( jugador_nombre(NombreJugador),partida_actual(IdPartida),\+ partida_registro(NombreJugador, IdPartida, _, _)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, pendiente);   true), format("Partida cargada desde ~w.~n", [Archivo]).

cargar_partida(Archivo) :- exists_file(Archivo), detectar_formato_guardado_v2(Archivo), !,
    limpiar_predicados_snapshot,
    consult(Archivo),
    ( jugador_nombre(NombreJugador),partida_actual(IdPartida),\+ partida_registro(NombreJugador, IdPartida, _, _)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, pendiente);   true), format("Partida cargada desde ~w.~n", [Archivo]).

cargar_partida(Archivo) :- exists_file(Archivo), restaurar_partida_legacy(Archivo).

cargar_partida :-(jugador_nombre(NombreJugador),  partida_actual(IdPartida)
    ->  partida_archivo(NombreJugador, IdPartida, Archivo), cargar_partida(Archivo) ; archivo_partida_por_defecto(Archivo), cargar_partida(Archivo) ).

% Nombre: marcar_partida_finalizada_actual/0
% Descripcion: cambia el estado de la partida activa a finalizada.
% Entrada: no recibe datos.
% Salida: actualiza el registro correspondiente.
% Restricciones: debe haber una partida activa.
% Objetivo: dejar constancia de que la partida ya termino.
marcar_partida_finalizada_actual :- jugador_nombre(NombreJugador),
    partida_actual(IdPartida),
    ( partida_registro(NombreJugador, IdPartida, Archivo, _)
    ->  registrar_partida(NombreJugador, IdPartida, Archivo, finalizada) ;partida_archivo(NombreJugador, IdPartida, Archivo), registrar_partida(NombreJugador, IdPartida, Archivo, finalizada)).
