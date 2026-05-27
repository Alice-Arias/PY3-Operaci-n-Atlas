% Acciones que modifican el estado dinamico del juego.

tomar(Artefacto) :-
    jugador(ModuloActual),
    artefacto(Artefacto, ModuloActual),
    \+ tomado(Artefacto),
    retract(artefactosLogrados(ListaActual)),
    agregar_a_lista_unica(Artefacto, ListaActual, ListaNueva),
    assertz(artefactosLogrados(ListaNueva)),
    assertz(tomado(Artefacto)),
    format("Tomaste ~w.~n", [Artefacto]).

usar(Artefacto) :-
    posee_artefacto(Artefacto),
    \+ usado(Artefacto),
    assertz(usado(Artefacto)),
    format("Usaste ~w.~n", [Artefacto]).

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

marcar_visitado(ModuloVisitado) :-
    ( visitado(ModuloVisitado)
    -> true
    ;  assertz(visitado(ModuloVisitado))
    ).

reparar(Sistema) :-
    jugador(ModuloActual),
    sistema(ModuloActual, Sistema, Requeridos, fallo),
    requerimientos_cumplidos(Requeridos, posee_artefacto),
    retract(sistema(ModuloActual, Sistema, Requeridos, fallo)),
    assertz(sistema(ModuloActual, Sistema, Requeridos, restaurado)),
    format("Sistema ~w reparado en ~w.~n", [Sistema, ModuloActual]).

requisito_rescate_cumplido(Requisito) :- sistema_restaurado(Requisito), !.
requisito_rescate_cumplido(Requisito) :- posee_artefacto(Requisito).

requisitos_faltantes_rescate([], []).
requisitos_faltantes_rescate([Requisito | Resto], Faltantes) :-
    requisitos_faltantes_rescate(Resto, FaltantesResto),
    ( requisito_rescate_cumplido(Requisito) ->
        Faltantes = FaltantesResto
    ;
        Faltantes = [Requisito | FaltantesResto]
    ).

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
        fail
    ).

rescatar(Tripulante) :-
    jugador(ModuloActual),
    tripulante(Tripulante, OtroModulo, _, atrapado),
    OtroModulo \= ModuloActual,
    format("Okey, no puedes rescatar a ~w desde ~w porque está en ~w.~n", [Tripulante, ModuloActual, OtroModulo]),
    fail.

rescatar(Tripulante) :-
    format("Okey, no encuentro a ~w atrapado en este momento.~n", [Tripulante]),
    fail.
