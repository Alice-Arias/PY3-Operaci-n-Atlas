% Consultas, rutas y validacion de victoria.

donde_esta(Artefacto) :-
    donde_esta(Artefacto, Lugar),
    format("~w esta en ~w~n", [Artefacto, Lugar]).

donde_esta(Artefacto, inventario) :- tomado(Artefacto), !.
donde_esta(Artefacto, Modulo) :- artefacto(Artefacto, Modulo), \+ tomado(Artefacto).

lista_legible([], 'ninguno').
lista_legible(Lista, Texto) :-
    maplist(term_to_atom, Lista, Atomos),
    atomic_list_concat(Atomos, ', ', AtomTexto),
    atom_string(AtomTexto, Texto).

que_tengo :-
    inventario(ListaInventario),
    ( ListaInventario == [] ->
        writeln("No tienes artefactos aun.")
    ;
        lista_legible(ListaInventario, Texto),
        format("Artefactos logrados: ~w~n", [Texto])
    ).

que_tengo(ListaInventario) :- inventario(ListaInventario).

modulos_visitados :-
    findall(Modulo, visitado(Modulo), ListaVisitados),
    lista_legible(ListaVisitados, TextoVisitados),
    format("Modulos visitados: ~w~n", [TextoVisitados]).

modulos_visitados(ListaVisitados) :- findall(Modulo, visitado(Modulo), ListaVisitados).

ruta(Inicio, Fin, Camino) :-
    ruta_aux(Inicio, Fin, [Inicio], CaminoReversa),
    reverse(CaminoReversa, Camino).

ruta_aux(Fin, Fin, Visitados, Visitados).
ruta_aux(Actual, Fin, Visitados, Camino) :-
    modulo_conectado(Actual, Siguiente),
    \+ member(Siguiente, Visitados),
    ruta_aux(Siguiente, Fin, [Siguiente | Visitados], Camino).

condicion_victoria_cumplida :-
    forall(sistema(_, _, _, _), sistema(_, _, _, restaurado)),
    forall(tripulante(_, _, _, _), tripulante(_, _, _, rescatado)),
    forall(artefacto(Artefacto, _), tomado(Artefacto)).

estado_victoria(ListaRuta, Inventario, Sistemas, Tripulacion) :-
    modulos_visitados(ListaRuta),
    que_tengo(Inventario),
    findall(Modulo-Sistema, sistema(Modulo, Sistema, _, restaurado), Sistemas),
    findall(Tripulante-Modulo, tripulante(Tripulante, Modulo, _, rescatado), Tripulacion).

verifica_gane :-
    condicion_victoria_cumplida,
    marcar_partida_finalizada_actual,
    estado_victoria(Ruta, Inventario, Sistemas, Tripulacion),
    writeln("¡Felicidades! La misión fue completada con éxito."),
    lista_legible(Ruta, TextoRuta),
    lista_legible(Inventario, TextoInventario),
    lista_legible(Sistemas, TextoSistemas),
    lista_legible(Tripulacion, TextoTripulacion),
    format("Ruta realizada: ~w~n", [TextoRuta]),
    format("Artefactos logrados: ~w~n", [TextoInventario]),
    format("Sistemas reparados: ~w~n", [TextoSistemas]),
    format("Tripulación rescatada: ~w~n", [TextoTripulacion]).

verifica_gane :- writeln("Aún no se cumplen todas las condiciones de victoria.").

como_gano :-
    findall(SistemaPendiente, (sistema(_, SistemaPendiente, _, _), \+ sistema_restaurado(SistemaPendiente)), SistemasPendientesSinOrden),
    sort(SistemasPendientesSinOrden, SistemasPendientes),
    findall(TripulantePendiente, (tripulante(TripulantePendiente, _, _, _), \+ tripulante_rescatado(TripulantePendiente)), TripulantesPendientesSinOrden),
    sort(TripulantesPendientesSinOrden, TripulantesPendientes),
    findall(ArtefactoPendiente, (artefacto(ArtefactoPendiente, _), \+ tomado(ArtefactoPendiente)), ArtefactosPendientesSinOrden),
    sort(ArtefactosPendientesSinOrden, ArtefactosPendientes),
    jugador(ModuloActual),
    findall(Destino, (puedo_ir(Destino), Destino \= ModuloActual), MovimientosSinOrden),
    sort(MovimientosSinOrden, MovimientosPosibles),
    ( SistemasPendientes == [] ->
        writeln("No quedan sistemas pendientes.")
    ;
        lista_legible(SistemasPendientes, TextoSistemas),
        format("Sistemas pendientes: ~w~n", [TextoSistemas])
    ),
    ( TripulantesPendientes == [] ->
        writeln("No quedan tripulantes pendientes.")
    ;
        lista_legible(TripulantesPendientes, TextoTripulantes),
        format("Tripulantes pendientes: ~w~n", [TextoTripulantes])
    ),
    ( ArtefactosPendientes == [] ->
        writeln("No quedan artefactos pendientes.")
    ;
        lista_legible(ArtefactosPendientes, TextoArtefactos),
        format("Artefactos pendientes: ~w~n", [TextoArtefactos])
    ),
    ( MovimientosPosibles == [] ->
        format("No hay movimientos posibles desde ~w.~n", [ModuloActual])
    ;
        lista_legible(MovimientosPosibles, TextoMovimientos),
        format("Movimientos posibles desde ~w: ~w~n", [ModuloActual, TextoMovimientos])
    ).
