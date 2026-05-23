
% MOVIMIENTO DEL JUGADOR
puedo_ir(Destino) :- jugador(Origen),
    conectado(Origen, Destino),
    cumple_requisitos_artefactos(Destino),
    cumple_requisitos_estado(Destino),
    cumple_requisito_paso(Destino).


mover(Destino) :- puedo_ir(Destino),
    jugador(Origen),
    retract(jugador(Origen)),
    assert(jugador(Destino)),
    assert(visitado(Destino)).   % R012: historial



% REQUISITOS DE ACCESO

% ARTEFACTOS NECESARIOS
cumple_requisitos_artefactos(Destino) :- \+ necesita(Destino, _). % Si no se requiere artefacto, se cumple automáticamente

cumple_requisitos_artefactos(Destino) :- necesita(Destino, ArtefactoRequerido),
                                        artefactosLogrados(Lista),
                                        member(ArtefactoRequerido, Lista).


% ESTADO DE SISTEMAS
cumple_requisitos_estado(Destino) :- \+ necesitaEstado(Destino, _, _).

cumple_requisitos_estado(Destino) :- necesitaEstado(Destino, Sistema, EstadoRequerido),
    sistema(_, Sistema, _, EstadoRequerido).


% PASO PREVIO
cumple_requisito_paso(Destino) :-  \+ pasoPrevio(Destino, _).

cumple_requisito_paso(Destino) :- pasoPrevio(Destino, ModuloAnterior),
    jugador(ModuloAnterior).


% INVENTARIO 
tomar(Artefacto) :- jugador(ModuloActual),
    artefacto(Artefacto, ModuloActual),
    artefactosLogrados(ListaActual),
    \+ member(Artefacto, ListaActual),
    retract(artefactosLogrados(ListaActual)),
    assert(artefactosLogrados([Artefacto | ListaActual])).


que_tengo :-  artefactosLogrados([]),
    write('No tienes artefactos aún.').

que_tengo :- artefactosLogrados(Lista),
    Lista \= [],
    write('Artefactos: '),
    write(Lista).


% R010 - DONDE ESTA UN ARTEFACTO
donde_esta(Artefacto) :- artefacto(Artefacto, Modulo),
    write(Artefacto),
    write(' está en: '),
    write(Modulo).


% USO DE ARTEFACTOS

usar(Artefacto) :- artefactosLogrados(Lista), member(Artefacto, Lista).


% REPARAR SISTEMAS
reparar(Sistema) :- jugador(ModuloActual), sistema(ModuloActual, Sistema, _, _).


% RESCATAR TRIPULANTES
rescatar(Tripulante) :-jugador(ModuloActual), tripulante(Tripulante, ModuloActual, _, atrapado).



% RUTAS ENTRE MÓDULOS
ruta(Inicio, Fin, Camino) :-  ruta_auxiliar(Inicio, Fin, [Inicio], Camino).

ruta_auxiliar(Fin, Fin, Camino, Camino).

ruta_auxiliar(Actual, Fin, Visitados, Camino) :-  conectado(Actual, Siguiente),
    \+ member(Siguiente, Visitados),
    ruta_auxiliar(Siguiente, Fin, [Siguiente | Visitados], Camino).



% R012 - MÓDULOS VISITADOS
modulos_visitados :- findall(M, visitado(M), Lista),
    write('Módulos visitados: '),
    write(Lista).


% R014 - COMO GANAR
como_gano :- findall(S, objetivoS(S, _), Sistemas),
    findall(T, objetivoT(T, _), Tripulantes),
    findall(R, necesita(_, R), Recursos),

    write('Sistemas por completar: '), write(Sistemas), nl,
    write('Tripulantes por rescatar: '), write(Tripulantes), nl,
    write('Recursos necesarios: '), write(Recursos).


%  VICTORIA
verifica_gane :-
    objetivoS(S, R),
    sistema(_, S, _, R),
    objetivoT(T, rescatado),
    tripulante(T, _, _, rescatado),
    write('HAS GANADO EL JUEGO ').