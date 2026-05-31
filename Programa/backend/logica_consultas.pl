% Consultas, rutas y validacion de victoria.

% Nombre: donde_esta/1
% Descripcion: informa la ubicacion de un artefacto.
% Entrada: nombre del artefacto.
% Salida: escribe en consola el modulo actual o el inventario.
% Restricciones: usa la variante interna `donde_esta/2` para obtener el lugar.
% Objetivo: ofrecer una consulta directa para ubicar objetos.
donde_esta(Artefacto) :-
    donde_esta(Artefacto, Lugar),
    format("~w esta en ~w~n", [Artefacto, Lugar]).

donde_esta(Artefacto, inventario) :- tomado(Artefacto), !.
donde_esta(Artefacto, Modulo) :- artefacto(Artefacto, Modulo), \+ tomado(Artefacto).

% Nombre: lista_legible/2
% Descripcion: convierte una lista de terminos en un texto con comas.
% Entrada: lista y variable de salida.
% Salida: cadena legible o la palabra `ninguno` si la lista esta vacia.
% Restricciones: usa `term_to_atom/2`, por lo que espera terminos imprimibles.
% Objetivo: simplificar la presentacion de listas en mensajes de consola.
lista_legible([], 'ninguno').
lista_legible(Lista, Texto) :-
    maplist(term_to_atom, Lista, Atomos),
    atomic_list_concat(Atomos, ', ', AtomTexto),
    atom_string(AtomTexto, Texto).

% Nombre: que_tengo/0
% Descripcion: muestra los artefactos que el jugador ya logro obtener.
% Entrada: no recibe datos.
% Salida: imprime el inventario en formato legible.
% Restricciones: depende del inventario dinamico cargado.
% Objetivo: permitir una consulta rapida del progreso del jugador.
que_tengo :-
    inventario(ListaInventario),
    ( ListaInventario == [] ->
        writeln("No tienes artefactos aun.")
    ;
        lista_legible(ListaInventario, Texto),
        format("Artefactos logrados: ~w~n", [Texto])
    ).

% Nombre: que_tengo/1
% Descripcion: devuelve la lista de artefactos del inventario.
% Entrada: variable para recibir la lista.
% Salida: lista de artefactos obtenidos.
% Restricciones: consulta directa sin formateo.
% Objetivo: reutilizar el inventario en otras consultas o rutinas.
que_tengo(ListaInventario) :- inventario(ListaInventario).

% Nombre: modulos_visitados/0
% Descripcion: imprime los modulos que ya fueron visitados.
% Entrada: no recibe datos.
% Salida: escribe la lista de modulos visitados.
% Restricciones: depende del historial dinamico `visitado/1`.
% Objetivo: ayudar a evaluar el recorrido realizado por el jugador.
modulos_visitados :-
    findall(Modulo, visitado(Modulo), ListaVisitados),
    lista_legible(ListaVisitados, TextoVisitados),
    format("Modulos visitados: ~w~n", [TextoVisitados]).

% Nombre: modulos_visitados/1
% Descripcion: devuelve la lista de modulos visitados.
% Entrada: variable para recibir la lista.
% Salida: lista con todos los modulos marcados como visitados.
% Restricciones: no formatea; solo recolecta datos.
% Objetivo: reutilizar el historial de recorrido en otras reglas.
modulos_visitados(ListaVisitados) :- findall(Modulo, visitado(Modulo), ListaVisitados).

% Nombre: ruta/3
% Descripcion: calcula una ruta entre dos modulos usando busqueda en profundidad.
% Entrada: modulo de inicio, modulo de fin y variable para el camino.
% Salida: lista con la ruta encontrada desde Inicio hasta Fin.
% Restricciones: solo considera conexiones disponibles mediante `modulo_conectado/2`.
% Objetivo: obtener caminos para la navegacion y las ayudas del juego.
ruta(Inicio, Fin, Camino) :-
    ruta_aux(Inicio, Fin, [Inicio], CaminoReversa),
    reverse(CaminoReversa, Camino).

ruta_aux(Fin, Fin, Visitados, Visitados).
ruta_aux(Actual, Fin, Visitados, Camino) :-
    modulo_conectado(Actual, Siguiente),
    \+ member(Siguiente, Visitados),
    ruta_aux(Siguiente, Fin, [Siguiente | Visitados], Camino).

% Nombre: todos_los_sistemas_restaurados/0
% Descripcion: verifica que todos los sistemas esten restaurados.
% Entrada: no recibe datos.
% Salida: verdadero si todos los sistemas tienen estado restaurado.
% Restricciones: recorre todos los hechos `sistema/4`.
% Objetivo: formar parte de la condicion global de victoria.
todos_los_sistemas_restaurados :-
    forall(sistema(_, _, _, Estado), Estado == restaurado).

% Nombre: toda_la_tripulacion_rescatada/0
% Descripcion: verifica que todos los tripulantes esten rescatados.
% Entrada: no recibe datos.
% Salida: verdadero si todos los tripulantes tienen estado rescatado.
% Restricciones: revisa todos los hechos `tripulante/4`.
% Objetivo: formar parte de la condicion global de victoria.
toda_la_tripulacion_rescatada :-
    forall(tripulante(_, _, _, Estado), Estado == rescatado).

% Nombre: todos_los_artefactos_recogidos/0
% Descripcion: comprueba que todos los artefactos hayan sido tomados.
% Entrada: no recibe datos.
% Salida: verdadero si cada artefacto del mapa figura como tomado.
% Restricciones: depende de los hechos `tomado/1`.
% Objetivo: completar la condicion de victoria basada en recoleccion.
todos_los_artefactos_recogidos :-
    forall(artefacto(Artefacto, _), tomado(Artefacto)).

% Nombre: condicion_victoria_cumplida/0
% Descripcion: comprueba si la partida ya puede declararse ganada.
% Entrada: no recibe datos.
% Salida: verdadero solo cuando se cumplen todas las condiciones principales.
% Restricciones: combina sistemas, tripulacion y artefactos.
% Objetivo: centralizar la verificacion de victoria.
condicion_victoria_cumplida :-
    todos_los_sistemas_restaurados,
    toda_la_tripulacion_rescatada,
    todos_los_artefactos_recogidos.

% Nombre: estado_victoria/4
% Descripcion: recopila la informacion final para mostrar el estado ganador.
% Entrada: variables para ruta, inventario, sistemas y tripulacion.
% Salida: listas de progreso final de la partida.
% Restricciones: se usa solo cuando la victoria ya fue alcanzada.
% Objetivo: generar el resumen final de la mision.
estado_victoria(ListaRuta, Inventario, Sistemas, Tripulacion) :-
    modulos_visitados(ListaRuta),
    que_tengo(Inventario),
    findall(Modulo-Sistema, sistema(Modulo, Sistema, _, restaurado), Sistemas),
    findall(Tripulante-Modulo, tripulante(Tripulante, Modulo, _, rescatado), Tripulacion).

% Nombre: modulos_objetivo_pendientes/1
% Descripcion: junta los modulos que aun tienen objetivos pendientes.
% Entrada: variable para recibir la lista.
% Salida: lista ordenada de modulos pendientes de trabajo.
% Restricciones: combina sistemas, tripulantes y artefactos no resueltos.
% Objetivo: apoyar ayudas y planes de avance.
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

% Nombre: forzar_gane/0
% Descripcion: informa si la partida ya es ganable y, si no, propone que hacer.
% Entrada: no recibe datos.
% Salida: mensajes de estado y ayuda para completar la mision.
% Restricciones: no modifica el estado; solo analiza.
% Objetivo: orientar al jugador cuando quiere saber si existe solucion.
forzar_gane :-
    jugador(ModuloActual),
    (   condicion_victoria_cumplida
    ->  writeln("¡Felicidades! Esta partida ya cumple las condiciones de victoria."),
        writeln("Si quieres revisar el resultado final, usa la verificacion de victoria.")
    ;   writeln("Sí hay solución. Esta partida todavía puede ganarse desde este estado."),
        como_gano
    ).

% Nombre: verifica_gane/0
% Descripcion: imprime el resultado final de la partida si ya se cumplieron las condiciones.
% Entrada: no recibe datos.
% Salida: mensaje de victoria o de partida aun incompleta.
% Restricciones: si gana, tambien marca la partida como finalizada.
% Objetivo: cerrar la partida con un resumen claro.
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

% Nombre: como_gano/0
% Descripcion: resume lo que falta para ganar y propone pasos concretos.
% Entrada: no recibe datos.
% Salida: imprime listas de pendientes, rutas posibles y bloqueos.
% Restricciones: se apoya en la informacion dinamica de la partida actual.
% Objetivo: generar una guia de progreso accionable para el jugador.
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

% Nombre: paso_previos_para_destino/2
% Descripcion: genera un paso sugerido para pasar por un modulo previo requerido.
% Entrada: modulo destino y variable para el texto.
% Salida: texto tipo "Pasar por X para desbloquear acceso a Y".
% Restricciones: solo produce pasos para requisitos previos pendientes.
% Objetivo: convertir bloqueos narrativos en instrucciones concretas.
paso_previos_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, _, _, Previos),
    member(ModPrevio, Previos),
    format(atom(Texto), "Pasar por ~w para desbloquear acceso a ~w", [ModPrevio, Destino]).

% Nombre: pasos_artefactos_para_destino/2
% Descripcion: genera un paso sugerido para recoger un artefacto faltante.
% Entrada: modulo destino y variable de texto.
% Salida: instruccion de desplazamiento y recoleccion.
% Restricciones: usa la ubicacion declarada del artefacto.
% Objetivo: guiar al jugador hacia elementos necesarios para avanzar.
pasos_artefactos_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, Artefactos, _, _),
    member(Arte, Artefactos),
    artefacto(Arte, ModOrig),
    format(atom(Texto), "Ir a ~w y recoger ~w", [ModOrig, Arte]).

% Nombre: pasos_sistemas_para_destino/2
% Descripcion: genera un paso sugerido para reparar un sistema pendiente.
% Entrada: modulo destino y variable de texto.
% Salida: instruccion de reparacion con el modulo del sistema.
% Restricciones: si no se conoce el modulo del sistema, usa `desconocido`.
% Objetivo: guiar al jugador hacia la restauracion de sistemas.
pasos_sistemas_para_destino(Destino, Texto) :-
    faltantes_acceso_modulo(Destino, _, Sistemas, _),
    member(Servicio-_, Sistemas),
    ( sistema(ModuloServicio, Servicio, _, _) -> true ; ModuloServicio = 'desconocido' ),
    format(atom(Texto), "Reparar ~w en ~w", [Servicio, ModuloServicio]).

% Nombre: pasos_generales_artefactos/1
% Descripcion: genera pasos generales para recoger artefactos pendientes.
% Entrada: variable para el texto.
% Salida: instruccion para ir al modulo y recoger el artefacto.
% Restricciones: solo considera artefactos que no han sido tomados.
% Objetivo: ofrecer acciones globales cuando no se mira un destino concreto.
pasos_generales_artefactos(Texto) :-
    findall(Arte-Module, (artefacto(Arte, Module), \+ tomado(Arte)), Pairs),
    member(Arte-Module, Pairs),
    format(atom(Texto), "Ir a ~w y recoger ~w", [Module, Arte]).

% Nombre: pasos_generales_sistemas/1
% Descripcion: genera pasos generales para reparar sistemas todavia fallados.
% Entrada: variable para el texto.
% Salida: instruccion de reparacion por sistema y modulo.
% Restricciones: omite sistemas que ya estan restaurados.
% Objetivo: ofrecer una lista global de tareas pendientes.
pasos_generales_sistemas(Texto) :-
    findall(Sis-Mod, (sistema(Mod, Sis, _, Estado), Estado \= restaurado), Pairs),
    member(Sis-Mod, Pairs),
    format(atom(Texto), "Reparar ~w en ~w", [Sis, Mod]).

% Nombre: pasos_rescate/1
% Descripcion: genera pasos generales para rescatar tripulantes pendientes.
% Entrada: variable para el texto.
% Salida: instruccion con tripulante y modulo objetivo.
% Restricciones: solo incluye tripulantes que siguen atrapados.
% Objetivo: apoyar una estrategia general de rescate.
pasos_rescate(Texto) :-
    findall(Trip-Mod, (tripulante(Trip, Mod, _, Estado), Estado \= rescatado), Pairs),
    member(Trip-Mod, Pairs),
    format(atom(Texto), "Rescatar ~w en ~w", [Trip, Mod]).

% Nombre: print_pasos/1
% Descripcion: imprime una lista de pasos sugeridos con numeracion.
% Entrada: lista de textos.
% Salida: mensajes numerados en consola.
% Restricciones: usa una variante interna para llevar el indice.
% Objetivo: mostrar ayudas accionables de forma ordenada.
print_pasos(Lista) :- print_pasos(Lista, 1).
print_pasos([], _).
print_pasos([H|T], N) :-
    format("~w. ~w~n", [N, H]),
    N1 is N + 1,
    print_pasos(T, N1).

% Nombre: forzar_gane_plan/1
% Descripcion: genera un plan estructurado de pasos para completar la mision.
% Entrada: variable para la lista de pasos.
% Salida: lista de cadenas con movimientos, reparaciones y rescates.
% Restricciones: no escribe mensajes; solo construye el plan.
% Objetivo: alimentar al controlador con una guia mecanica y serializable.
forzar_gane_plan(Plan) :-
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
    % Generar pasos prácticos y numerados (reutiliza los predicados existentes)
    findall(P, (member(D, MovimientosBloqueados), pasos_artefactos_para_destino(D, P)), ArtePasosBloqueados),
    findall(P, (member(D, MovimientosBloqueados), pasos_sistemas_para_destino(D, P)), SistPasosBloqueados),
    findall(P, (member(D, MovimientosBloqueados), paso_previos_para_destino(D, P)), PrevPasosBloqueados),
    findall(P, pasos_generales_artefactos(P), ArtePasosGen),
    findall(P, pasos_generales_sistemas(P), SistPasosGen),
    findall(P, pasos_rescate(P), RescatePasos),
    append([PrevPasosBloqueados, ArtePasosBloqueados, SistPasosBloqueados, ArtePasosGen, SistPasosGen, RescatePasos], TodosPasosRaw),
    list_to_set(TodosPasosRaw, TodosPasosSet),
    findall(X, member(X, TodosPasosSet), TodosPasos),
    % Expandir pasos añadiendo movimientos intermedios a partir del modulo actual
    expand_pasos(ModuloActual, TodosPasos, Plan).

% Nombre: expand_pasos/3
% Descripcion: expande una lista de pasos agregando movimientos intermedios cuando hace falta.
% Entrada: modulo origen, lista de pasos y variable para el plan expandido.
% Salida: lista final con pasos desglosados.
% Restricciones: depende de la estructura textual generada por los helpers anteriores.
% Objetivo: hacer que el plan sea ejecutable paso a paso.
expand_pasos(_, [], []).
expand_pasos(Origen, [Paso|Resto], PlanExpandido) :-
    expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen),
    expand_pasos(NuevoOrigen, Resto, RestoExpandido),
    append(PasosGenerados, RestoExpandido, PlanExpandido).

% Nombre: expand_paso/4
% Descripcion: convierte un paso textual en una secuencia de pasos ejecutables.
% Entrada: modulo origen, paso, lista generada y nuevo origen.
% Salida: una o varias instrucciones concretas y el modulo final alcanzado.
% Restricciones: solo reconoce los formatos textuales generados por el plan.
% Objetivo: traducir el plan de ayuda a acciones realmente ejecutables.
expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen) :-
    atomic_list_concat([Left, Arte], ' y recoger ', Paso),
    sub_atom(Left, 0, 5, _, 'Ir a '),
    sub_atom(Left, 5, _, 0, DestAtom),
    atom_string(DestAtom, Dest),
    ( ruta(Origen, Dest, Camino) ->
        % generar movimientos intermedios (sin el destino final)
        Camino = [_|Tail],
        ( append(Intermedios, [Dest], Tail) -> true ; Intermedios = [] ),
        findall(Ms, (member(M, Intermedios), format(atom(Ms), 'Ir a ~w', [M])), Movs),
        % conservar paso final con recoger
        format(atom(Reco), 'Ir a ~w y recoger ~w', [Dest, Arte]),
        append(Movs, [Reco], PasosGenerados),
        NuevoOrigen = Dest
    ;
        % no hay ruta, mantener paso original
        PasosGenerados = [Paso],
        NuevoOrigen = Origen
    ).

% Nombre: expand_paso/4
% Descripcion: convierte un paso de reparacion en instrucciones con movimientos intermedios.
% Entrada: modulo origen, paso, lista generada y nuevo origen.
% Salida: pasos intermedios y la reparacion final.
% Restricciones: solo aplica a textos que empiecen por `Reparar`.
% Objetivo: facilitar la ejecucion del plan desde cualquier posicion.
expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen) :-
    sub_atom(Paso, 0, 8, _, 'Reparar '),
    sub_atom(Paso, 8, _, 0, Rest),
    atomic_list_concat([SistemaAtom, ModAtom], ' en ', Rest),
    atom_string(ModAtom, Mod),
    ( ruta(Origen, Mod, Camino) ->
        Camino = [_|Tail],
        ( append(Intermedios, [Mod], Tail) -> true ; Intermedios = [] ),
        findall(Ms, (member(M, Intermedios), format(atom(Ms), 'Ir a ~w', [M])), Movs),
        append(Movs, [Paso], PasosGenerados),
        NuevoOrigen = Mod
    ;
        PasosGenerados = [Paso],
        NuevoOrigen = Origen
    ).

% Nombre: expand_paso/4
% Descripcion: convierte un paso de rescate en movimientos previos y la accion final.
% Entrada: modulo origen, paso, lista generada y nuevo origen.
% Salida: secuencia de pasos para llegar al modulo y rescatar.
% Restricciones: solo aplica a pasos que empiecen por `Rescatar`.
% Objetivo: guiar la ejecucion del rescate de forma automatizada.
expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen) :-
    sub_atom(Paso, 0, 9, _, 'Rescatar '),
    sub_atom(Paso, 9, _, 0, Rest),
    atomic_list_concat([TripAtom, ModAtom], ' en ', Rest),
    atom_string(ModAtom, Mod),
    ( ruta(Origen, Mod, Camino) ->
        Camino = [_|Tail],
        ( append(Intermedios, [Mod], Tail) -> true ; Intermedios = [] ),
        findall(Ms, (member(M, Intermedios), format(atom(Ms), 'Ir a ~w', [M])), Movs),
        append(Movs, [Paso], PasosGenerados),
        NuevoOrigen = Mod
    ;
        PasosGenerados = [Paso],
        NuevoOrigen = Origen
    ).

% Nombre: expand_paso/4
% Descripcion: expande un paso de desbloqueo previo en sus movimientos necesarios.
% Entrada: modulo origen, paso, lista generada y nuevo origen.
% Salida: movimientos intermedios y la instruccion original.
% Restricciones: solo aplica a pasos de desbloqueo previos.
% Objetivo: traducir las ayudas narrativas a una ruta ejecutable.
expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen) :-
    sub_atom(Paso, 0, 10, _, 'Pasar por '),
    sub_atom(Paso, 10, _, 0, Rest),
    atomic_list_concat([Mprev, _], ' para desbloquear acceso a ', Rest),
    atom_string(Mprev, ModPrev),
    ( ruta(Origen, ModPrev, Camino) ->
        Camino = [_|Tail],
        ( append(Intermedios, [ModPrev], Tail) -> true ; Intermedios = [] ),
        findall(Ms, (member(M, Intermedios), format(atom(Ms), 'Ir a ~w', [M])), Movs),
        append(Movs, [Paso], PasosGenerados),
        NuevoOrigen = ModPrev
    ;
        PasosGenerados = [Paso],
        NuevoOrigen = Origen
    ).

% Nombre: expand_paso/4
% Descripcion: expande una instruccion simple de movimiento en ruta intermedia si existe.
% Entrada: modulo origen, paso, lista generada y nuevo origen.
% Salida: movimientos intermedios y el movimiento final.
% Restricciones: solo aplica a textos que empiecen por `Ir a`.
% Objetivo: hacer que incluso los movimientos simples respeten el mapa.
expand_paso(Origen, Paso, PasosGenerados, NuevoOrigen) :-
    sub_atom(Paso, 0, 5, _, 'Ir a '),
    sub_atom(Paso, 5, _, 0, DestAtom),
    atom_string(DestAtom, Dest),
    ( ruta(Origen, Dest, Camino) ->
        Camino = [_|Tail],
        ( append(Intermedios, [Dest], Tail) -> true ; Intermedios = [] ),
        findall(Ms, (member(M, Intermedios), format(atom(Ms), 'Ir a ~w', [M])), Movs),
        % evitar duplicar el "Ir a Dest" si Intermedios ya contiene Dest
        append(Movs, [Paso], PasosGenerados),
        NuevoOrigen = Dest
    ;
        PasosGenerados = [Paso],
        NuevoOrigen = Origen
    ).

% Nombre: expand_paso/4
% Descripcion: conserva un paso tal cual cuando no coincide con ningun formato conocido.
% Entrada: modulo origen, texto de paso y variables de salida.
% Salida: el mismo paso y el mismo origen.
% Restricciones: se usa solo como clausula de respaldo.
% Objetivo: evitar que un formato inesperado rompa la generacion del plan.
expand_paso(Origen, Paso, [Paso], Origen) :-
    \+ sub_atom(Paso, 0, 5, _, 'Ir a '),
    \+ sub_atom(Paso, 0, 8, _, 'Reparar '),
    \+ sub_atom(Paso, 0, 9, _, 'Rescatar '),
    \+ sub_atom(Paso, 0, 10, _, 'Pasar por ').
