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

todos_los_sistemas_restaurados :-
    forall(sistema(_, _, _, Estado), Estado == restaurado).

toda_la_tripulacion_rescatada :-
    forall(tripulante(_, _, _, Estado), Estado == rescatado).

todos_los_artefactos_recogidos :-
    forall(artefacto(Artefacto, _), tomado(Artefacto)).

condicion_victoria_cumplida :-
    todos_los_sistemas_restaurados,
    toda_la_tripulacion_rescatada,
    todos_los_artefactos_recogidos.

estado_victoria(ListaRuta, Inventario, Sistemas, Tripulacion) :-
    modulos_visitados(ListaRuta),
    que_tengo(Inventario),
    findall(Modulo-Sistema, sistema(Modulo, Sistema, _, restaurado), Sistemas),
    findall(Tripulante-Modulo, tripulante(Tripulante, Modulo, _, rescatado), Tripulacion).

modulos_objetivo_pendientes(ModulosPendientes) :-
    findall(
        Modulo,
        (
            sistema(Modulo, _, _, Estado),
            Estado \= restaurado
        ),
        ModulosSistemas
    ),
    findall(
        Modulo,
        (
            tripulante(_, Modulo, _, Estado),
            Estado \= rescatado
        ),
        ModulosTripulantes
    ),
    findall(
        Modulo,
        (
            artefacto(Artefacto, Modulo),
            \+ tomado(Artefacto)
        ),
        ModulosArtefactos
    ),
    append([ModulosSistemas, ModulosTripulantes, ModulosArtefactos], ModulosUnificados),
    sort(ModulosUnificados, ModulosPendientes).

forzar_gane :-
    jugador(ModuloActual),
    (   condicion_victoria_cumplida
    ->  writeln("¡Felicidades! Esta partida ya cumple las condiciones de victoria."),
        writeln("Si quieres revisar el resultado final, usa la verificacion de victoria.")
    ;   writeln("Sí hay solución. Esta partida todavía puede ganarse desde este estado."),
        como_gano
    ).

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
    jugador(ModuloActual),
    findall(SistemaPendiente, (sistema(_, SistemaPendiente, _, _), \+ sistema_restaurado(SistemaPendiente)), SistemasPendientesSinOrden),
    sort(SistemasPendientesSinOrden, SistemasPendientes),
    findall(TripulantePendiente, (tripulante(TripulantePendiente, _, _, _), \+ tripulante_rescatado(TripulantePendiente)), TripulantesPendientesSinOrden),
    sort(TripulantesPendientesSinOrden, TripulantesPendientes),
    findall(ArtefactoPendiente, (artefacto(ArtefactoPendiente, _), \+ tomado(ArtefactoPendiente)), ArtefactosPendientesSinOrden),
    sort(ArtefactosPendientesSinOrden, ArtefactosPendientes),
    findall(Destino, (puedo_ir(Destino), Destino \= ModuloActual), MovimientosSinOrden),
    sort(MovimientosSinOrden, MovimientosPosibles),
    findall(Destino, (modulo_conectado(ModuloActual, Destino), Destino \= ModuloActual, \+ puedo_ir(Destino)), MovimientosBloqueadosSinOrden),
    sort(MovimientosBloqueadosSinOrden, MovimientosBloqueados),
    format("Okey, desde ~w para ganar la partida debes completar esto:~n", [ModuloActual]),
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
    ),
    ( MovimientosBloqueados == [] ->
        true
    ;
        writeln("Movimientos bloqueados y su razon:"),
        forall(
            member(DestinoBloqueado, MovimientosBloqueados),
            (   motivo_no_puedo_ir(DestinoBloqueado, MensajeBloqueo),
                format("- ~w~n", [MensajeBloqueo])
            )
        )
    ),
    % Generar pasos prácticos y numerados
    findall(P, (member(D, MovimientosBloqueados), pasos_artefactos_para_destino(D, P)), ArtePasosBloqueados),
    findall(P, (member(D, MovimientosBloqueados), pasos_sistemas_para_destino(D, P)), SistPasosBloqueados),
    findall(P, (member(D, MovimientosBloqueados), paso_previos_para_destino(D, P)), PrevPasosBloqueados),
    findall(P, pasos_generales_artefactos(P), ArtePasosGen),
    findall(P, pasos_generales_sistemas(P), SistPasosGen),
    findall(P, pasos_rescate(P), RescatePasos),
    append([PrevPasosBloqueados, ArtePasosBloqueados, SistPasosBloqueados, ArtePasosGen, SistPasosGen, RescatePasos], TodosPasosRaw),
    list_to_set(TodosPasosRaw, TodosPasosSet),
    findall(X, member(X, TodosPasosSet), TodosPasos),
    ( TodosPasos == [] -> writeln("No hay pasos concretos sugeridos en este momento.") ; (writeln("Pasos sugeridos para completar la misión:"), print_pasos(TodosPasos)) ).

% --- Generadores de pasos simples para la ayuda ---------------------------------
paso_previos_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, _, _, Previos),
    member(ModPrevio, Previos),
    format(atom(Texto), "Pasar por ~w para desbloquear acceso a ~w", [ModPrevio, Destino]).

pasos_artefactos_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, Artefactos, _, _),
    member(Arte, Artefactos),
    artefacto(Arte, ModOrig),
    format(atom(Texto), "Ir a ~w y recoger ~w", [ModOrig, Arte]).

pasos_sistemas_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, _, Sistemas, _),
    member(Servicio-_, Sistemas),
    ( sistema(ModuloServicio, Servicio, _, _) -> true ; ModuloServicio = 'desconocido' ),
    format(atom(Texto), "Reparar ~w en ~w", [Servicio, ModuloServicio]).

pasos_generales_artefactos(Texto) :-
    findall(Arte-Module, (artefacto(Arte, Module), \+ tomado(Arte)), Pairs),
    member(Arte-Module, Pairs),
    format(atom(Texto), "Ir a ~w y recoger ~w", [Module, Arte]).

pasos_generales_sistemas(Texto) :-
    findall(Sis-Mod, (sistema(Mod, Sis, _, Estado), Estado \= restaurado), Pairs),
    member(Sis-Mod, Pairs),
    format(atom(Texto), "Reparar ~w en ~w", [Sis, Mod]).

pasos_rescate(Texto) :-
    findall(Trip-Mod, (tripulante(Trip, Mod, _, Estado), Estado \= rescatado), Pairs),
    member(Trip-Mod, Pairs),
    format(atom(Texto), "Rescatar ~w en ~w", [Trip, Mod]).

print_pasos(Lista) :- print_pasos(Lista, 1).
print_pasos([], _).
print_pasos([H|T], N) :-
    format("~w. ~w~n", [N, H]),
    N1 is N + 1,
    print_pasos(T, N1).
