% Acciones que modifican el estado dinamico del juego.

% Nombre: tomar/1
% Descripcion: recoge un artefacto desde el modulo actual y lo agrega al inventario.
% Entrada: nombre del artefacto.
% Salida: mensaje de exito o fallo segun el contexto.
% Restricciones: el artefacto debe estar en el modulo actual y no haber sido tomado antes.
% Objetivo: permitir que el jugador amplie su inventario durante la partida.
tomar(Artefacto) :-
    jugador(ModuloActual),
    artefacto(Artefacto, ModuloActual),
    \+ tomado(Artefacto),
    retract(artefactosLogrados(ListaActual)),
    agregar_a_lista_unica(Artefacto, ListaActual, ListaNueva),
    assertz(artefactosLogrados(ListaNueva)),
    assertz(tomado(Artefacto)),
    format("Tomaste ~w.~n", [Artefacto]).

tomar(Artefacto) :-
    jugador(ModuloActual),
    artefacto(Artefacto, OtroModulo),
    OtroModulo \= ModuloActual,
    formatear_identificador_legible(Artefacto, ArtefactoLegible),
    format("No puedes tomar ~w desde ~w porque esta en ~w.~n", [ArtefactoLegible, ModuloActual, OtroModulo]),
    !,
    fail.

tomar(Artefacto) :-
    tomado(Artefacto),
    formatear_identificador_legible(Artefacto, ArtefactoLegible),
    format("No puedes tomar ~w porque ya lo tienes en tu inventario.~n", [ArtefactoLegible]),
    !,
    fail.

tomar(Artefacto) :-
    formatear_identificador_legible(Artefacto, ArtefactoLegible),
    format("No puedes tomar ~w porque no esta disponible en este momento.~n", [ArtefactoLegible]),
    !,
    fail.

% Nombre: usar/1
% Descripcion: marca un artefacto como usado cuando ya esta en el inventario.
% Entrada: nombre del artefacto.
% Salida: mensaje indicando que el objeto fue usado.
% Restricciones: solo funciona con artefactos que el jugador ya posee.
% Objetivo: registrar uso de objetos que habilitan otras acciones.
usar(Artefacto) :-
    posee_artefacto(Artefacto),
    \+ usado(Artefacto),
    assertz(usado(Artefacto)),
    format("Usaste ~w.~n", [Artefacto]).

% Nombre: mover/1
% Descripcion: desplaza al jugador a un modulo destino si la ruta es valida.
% Entrada: modulo destino.
% Salida: actualiza el jugador y marca el modulo como visitado.
% Restricciones: debe cumplirse `puedo_ir/1`.
% Objetivo: controlar el movimiento del protagonista por la estacion.
mover(ModuloDestino) :-
    (   puedo_ir(ModuloDestino)
    ->  retract(jugador(_)),
        assertz(jugador(ModuloDestino)),
        marcar_visitado(ModuloDestino),
        format("Te moviste a ~w.~n", [ModuloDestino])
    ;   motivo_no_puedo_ir(ModuloDestino, Mensaje),
        writeln(Mensaje),
        fail
    ).

% Nombre: marcar_visitado/1
% Descripcion: registra un modulo como visitado si todavia no estaba marcado.
% Entrada: modulo visitado.
% Salida: asegura el hecho `visitado/1` sin duplicados.
% Restricciones: opera solo sobre la memoria dinamica.
% Objetivo: conservar el historial de exploracion del jugador.
marcar_visitado(ModuloVisitado) :-
    ( visitado(ModuloVisitado)
    -> true
    ;  assertz(visitado(ModuloVisitado))
    ).

% Nombre: reparar/1
% Descripcion: restaura un sistema del modulo actual cuando se cumplen los requisitos.
% Entrada: nombre del sistema.
% Salida: actualiza el estado del sistema a restaurado o informa el motivo del fallo.
% Restricciones: el sistema debe existir en el modulo actual y estar en fallo.
% Objetivo: resolver desperfectos del escenario para avanzar la mision.
reparar(Sistema) :-
    jugador(ModuloActual),
    sistema(ModuloActual, Sistema, Requeridos, fallo),
    requerimientos_cumplidos(Requeridos, posee_artefacto),
    retract(sistema(ModuloActual, Sistema, Requeridos, fallo)),
    assertz(sistema(ModuloActual, Sistema, Requeridos, restaurado)),
    format("Sistema ~w reparado en ~w.~n", [Sistema, ModuloActual]).

reparar(Sistema) :-
    jugador(ModuloActual),
    sistema(ModuloActual, Sistema, _, restaurado),
    formatear_identificador_legible(Sistema, SistemaLegible),
    format("No puedes reparar ~w porque ya esta restaurado en ~w.~n", [SistemaLegible, ModuloActual]),
    !,
    fail.

reparar(Sistema) :-
    jugador(ModuloActual),
    sistema(ModuloActual, Sistema, Requeridos, fallo),
    \+ requerimientos_cumplidos(Requeridos, posee_artefacto),
    requisitos_faltantes_rescate(Requeridos, Faltantes),
    formatear_identificador_legible(Sistema, SistemaLegible),
    mostrar_requisitos_faltantes(Faltantes),
    format("No puedes reparar ~w todavia en ~w porque te faltan requisitos para restaurarlo.~n", [SistemaLegible, ModuloActual]),
    !,
    fail.

reparar(Sistema) :-
    jugador(ModuloActual),
    sistema(OtroModulo, Sistema, _, _),
    OtroModulo \= ModuloActual,
    formatear_identificador_legible(Sistema, SistemaLegible),
    format("No puedes reparar ~w desde ~w porque esta en ~w.~n", [SistemaLegible, ModuloActual, OtroModulo]),
    !,
    fail.

reparar(Sistema) :-
    formatear_identificador_legible(Sistema, SistemaLegible),
    format("No puedes reparar ~w porque no existe o no esta disponible ahora.~n", [SistemaLegible]),
    !,
    fail.

% Nombre: requisito_rescate_cumplido/1
% Descripcion: valida un requisito de rescate usando artefactos o sistemas restaurados.
% Entrada: requisito individual.
% Salida: verdadero si el requisito ya quedo satisfecho.
% Restricciones: considera tanto sistemas restaurados como artefactos poseidos.
% Objetivo: reutilizar una sola regla para distintos tipos de requisitos.
requisito_rescate_cumplido(Requisito) :- sistema_restaurado(Requisito), !.
requisito_rescate_cumplido(Requisito) :- posee_artefacto(Requisito).

% Nombre: requisitos_faltantes_rescate/2
% Descripcion: filtra los requisitos de rescate que aun no se cumplen.
% Entrada: lista de requisitos y variable para los faltantes.
% Salida: lista de requisitos pendientes de resolver.
% Restricciones: conserva el orden relativo de la lista original.
% Objetivo: mostrar al jugador que le falta para rescatar a un tripulante.
requisitos_faltantes_rescate([], []).
requisitos_faltantes_rescate([Requisito | Resto], Faltantes) :-
    requisitos_faltantes_rescate(Resto, FaltantesResto),
    ( requisito_rescate_cumplido(Requisito) ->
        Faltantes = FaltantesResto
    ;
        Faltantes = [Requisito | FaltantesResto]
    ).

% Nombre: mostrar_requisitos_faltantes/1
% Descripcion: imprime los requisitos faltantes separados por tipo.
% Entrada: lista de requisitos pendientes.
% Salida: mensajes en consola para artefactos y sistemas.
% Restricciones: se apoya en `sistema/4` para distinguir categorias.
% Objetivo: comunicar de forma clara por que no se puede rescatar a alguien.
mostrar_requisitos_faltantes([]) :- writeln("No cumples con los requisitos necesarios para rescatar a ese tripulante.").
mostrar_requisitos_faltantes(Faltantes) :-
    % Separar requisitos que son servicios (sistemas) de artefactos
    findall(S, (member(S, Faltantes), sistema(_, S, _, _)), Servicios),
    findall(A, (member(A, Faltantes), \+ sistema(_, A, _, _)), Artefactos),
    formatear_lista_legible(Artefactos, TextoArtefactos),
    formatear_lista_legible(Servicios, TextoServicios),
    ( Artefactos \= [] -> format("Debes conseguir: ~w.~n", [TextoArtefactos]) ; true ),
    ( Servicios \= [] -> format("Debes reparar: ~w.~n", [TextoServicios]) ; true ),
    ( Artefactos = [] , Servicios = [] -> writeln("Faltan requisitos no especificados.") ; true ).

% Nombre: rescatar/1
% Descripcion: rescata a un tripulante atrapado en el modulo actual.
% Entrada: nombre del tripulante.
% Salida: cambia su estado a rescatado o informa el motivo del fallo.
% Restricciones: el tripulante debe estar atrapado en el modulo actual.
% Objetivo: avanzar el objetivo humano de la mision.
rescatar(Tripulante) :-
    jugador(ModuloActual),
    tripulante(Tripulante, ModuloActual, Requeridos, atrapado),
    (   requerimientos_cumplidos(Requeridos, requisito_rescate_cumplido)
    ->  retract(tripulante(Tripulante, ModuloActual, Requeridos, atrapado)),
        assertz(tripulante(Tripulante, ModuloActual, Requeridos, rescatado)),
        format("Rescataste a ~w.~n", [Tripulante])
    ;   requisitos_faltantes_rescate(Requeridos, Faltantes),
        formatear_identificador_legible(Tripulante, TripLegible),
        format("No puedes rescatar a ~w todavía. Para poder rescatarlo necesitas:\n", [TripLegible]),
        mostrar_requisitos_faltantes(Faltantes),
        !,
        fail
    ).

rescatar(Tripulante) :-
    jugador(ModuloActual),
    tripulante(Tripulante, OtroModulo, _, atrapado),
    OtroModulo \= ModuloActual,
    format("No puedes rescatar a ~w desde ~w porque esta en ~w.~n", [Tripulante, ModuloActual, OtroModulo]),
    !,
    fail.

rescatar(Tripulante) :-
    format("No puedes rescatar a ~w porque no esta atrapado o no esta disponible en este momento.~n", [Tripulante]),
    !,
    fail.
