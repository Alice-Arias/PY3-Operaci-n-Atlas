% Este modulo tiene la logica principal del juego.
% Descripcion: aqui estan movimiento, objetos, reparacion, rescate y victoria.
% Entrada: consulta los hechos dinamicos del estado actual.
% Salida: responde si una accion se puede hacer o cambia el estado.
% Restricciones: requiere que el estado ya haya sido inicializado.

inventario(Lista) :- artefactosLogrados(Lista).

% agregar_a_lista_unica/3
% Descripcion: agrega un elemento sin repetirlo.
% Entrada: un elemento, una lista vieja y una lista nueva.
% Salida: devuelve la lista con el elemento agregado o igual si ya estaba.
% Restricciones: funciona mejor con listas normales.
agregar_a_lista_unica(Elemento, Lista, NuevaLista) :- ( member(Elemento, Lista) ->  NuevaLista = Lista ;   append(Lista, [Elemento], NuevaLista) ).

% modulo_conectado/2
% Descripcion: dice si dos modulos estan unidos por un enlace.
% Entrada: modulo de origen y modulo destino.
% Salida: verdadero si hay conexion.
% Restricciones: la conexion puede ser en cualquier sentido.
modulo_conectado(Origen, Destino) :- enlace(Origen, Destino).
modulo_conectado(Origen, Destino) :- enlace(Destino, Origen).

posee_artefacto(Artefacto) :-artefactosLogrados(Lista), member(Artefacto, Lista).

esta_usado(Artefacto) :- usado(Artefacto).

sistema_restaurado(Sistema) :-sistema(_, Sistema, _, restaurado).

tripulante_rescatado(Tripulante) :-tripulante(Tripulante, _, _, rescatado).

% requerimientos_cumplidos/2
% Descripcion: revisa si una lista de requisitos ya se cumplio.
% Entrada: lista de requisitos y predicado a comprobar.
% Salida: verdadero si todos los requisitos pasan.
% Restricciones: la lista vacia siempre cumple.
requerimientos_cumplidos([], _).
%call es un predicado que permite usar el nombre del requisito como argumento.
requerimientos_cumplidos([Artefacto | Resto], Predicado) :- call(Predicado, Artefacto), requerimientos_cumplidos(Resto, Predicado).





% Consultas


% donde_esta/1
% Descripcion: imprime donde se encuentra un artefacto.
% Entrada: nombre del artefacto.
% Salida: muestra un mensaje en pantalla.
% Restricciones: el artefacto debe existir en el mundo.
donde_esta(Artefacto) :- donde_esta(Artefacto, Lugar), format("~w esta en ~w~n", [Artefacto, Lugar]).%~w~n es para imprimir variables sin formato especial y con salto de linea.
donde_esta(Artefacto, inventario) :-  tomado(Artefacto), !.
donde_esta(Artefacto, Modulo) :-artefacto(Artefacto, Modulo),  \+ tomado(Artefacto).

que_tengo :-  inventario(Lista), ( Lista == [] ->  writeln("No tienes artefactos aun.") ;   format("Artefactos logrados: ~w~n", [Lista])).
que_tengo(Lista) :- inventario(Lista).

modulos_visitados :-findall(Modulo, visitado(Modulo), Lista),format("Modulos visitados: ~w~n", [Lista]).

modulos_visitados(Lista) :-findall(Modulo, visitado(Modulo), Lista).


% Toma y uso de artefactos

% tomar/1
% Descripcion: recoge un artefacto del modulo actual.
% Entrada: nombre del artefacto.
% Salida: lo agrega al inventario y lo marca como tomado.
% Restricciones: el jugador debe estar en el modulo correcto.
tomar(Artefacto) :- jugador(ModuloActual),
    artefacto(Artefacto, ModuloActual), \+ tomado(Artefacto),
    retract(artefactosLogrados(ListaActual)),
    agregar_a_lista_unica(Artefacto, ListaActual, NuevaLista),
    assertz(artefactosLogrados(NuevaLista)),
    assertz(tomado(Artefacto)),
    format("Tomaste ~w.~n", [Artefacto]).

% usar/1
% Descripcion: marca un artefacto como usado.
% Entrada: nombre del artefacto.
% Salida: lo registra en la lista de usados.
% Restricciones: el artefacto debe estar en el inventario.
usar(Artefacto) :- posee_artefacto(Artefacto),\+ usado(Artefacto),  assertz(usado(Artefacto)), format("Usaste ~w.~n", [Artefacto]).


% Movimientos
cumple_necesita(Modulo) :- findall(Artefacto, necesita(Modulo, Artefacto), Requeridos), requerimientos_cumplidos(Requeridos, posee_artefacto).

cumple_estado(Modulo) :- findall(Servicio-EstadoNecesario, necesita_estado(Modulo, Servicio, EstadoNecesario), Requeridos), cumple_lista_estados(Requeridos).

cumple_lista_estados([]).
cumple_lista_estados([Servicio-EstadoNecesario | Resto]) :- sistema(_, Servicio, _, EstadoNecesario), cumple_lista_estados(Resto).

cumple_pasos_previos(Modulo) :- findall(Previo, paso_previo(Modulo, Previo), Lista), cumple_previos(Lista).

cumple_previos([]).
cumple_previos([Previo | Resto]) :- visitado(Previo), cumple_previos(Resto).

% puedo_ir/1
% Descripcion: revisa si el jugador puede moverse a otro modulo.
% Entrada: modulo destino.
% Salida: verdadero o falso.
% Restricciones: necesita conexion, objetos y estados correctos.
puedo_ir(Hacia) :- jugador(Desde),
    modulo(Hacia, _),
    modulo_conectado(Desde, Hacia),
    cumple_necesita(Hacia),
    cumple_estado(Hacia),
    cumple_pasos_previos(Hacia).

% mover/1
% Descripcion: cambia al jugador al modulo elegido.
% Entrada: modulo destino.
% Salida: actualiza el jugador y marca el modulo como visitado.
% Restricciones: solo funciona si `puedo_ir/1` es verdadero.
mover(Modulo) :- puedo_ir(Modulo),
    retract(jugador(_)),
    assertz(jugador(Modulo)),
    marcar_visitado(Modulo),
    format("Te moviste a ~w.~n", [Modulo]).

% Reparacion y rescate

% reparar/1
% Descripcion: arregla un sistema roto en el modulo actual.
% Entrada: nombre del sistema.
% Salida: cambia el estado del sistema a restaurado.
% Restricciones: se necesitan los artefactos pedidos.
reparar(Sistema) :- jugador(ModuloActual),
    sistema(ModuloActual, Sistema, Requeridos, fallo),
    requerimientos_cumplidos(Requeridos, posee_artefacto),
    retract(sistema(ModuloActual, Sistema, Requeridos, fallo)),
    assertz(sistema(ModuloActual, Sistema, Requeridos, restaurado)),
    format("Sistema ~w reparado en ~w.~n", [Sistema, ModuloActual]).

% rescatar/1
% Descripcion: rescata a un tripulante atrapado.
% Entrada: nombre del tripulante.
% Salida: cambia su estado a rescatado.
% Restricciones: los sistemas requeridos deben estar restaurados.
rescatar(Tripulante) :- jugador(ModuloActual),
    tripulante(Tripulante, ModuloActual, Requeridos, atrapado),
    requerimientos_cumplidos(Requeridos, sistema_restaurado),
    retract(tripulante(Tripulante, ModuloActual, Requeridos, atrapado)),
    assertz(tripulante(Tripulante, ModuloActual, Requeridos, rescatado)),
    format("Rescataste a ~w.~n", [Tripulante]).


% Rutas y victoria

% ruta/3
% Descripcion: busca una ruta entre dos modulos.
% Entrada: modulo de inicio y modulo final.
% Salida: lista con el camino encontrado.
% Restricciones: evita repetir modulos para no hacer ciclos.
ruta(Inicio, Fin, Camino) :- ruta_aux(Inicio, Fin, [Inicio], Reversa), reverse(Reversa, Camino).
ruta_aux(Fin, Fin, Visitados, Visitados).
ruta_aux(Actual, Fin, Visitados, Camino) :- modulo_conectado(Actual, Siguiente), \+ member(Siguiente, Visitados), ruta_aux(Siguiente, Fin, [Siguiente | Visitados], Camino).

condicion_victoria_cumplida :- forall(objetivo_sistema(Sistema, Estado), sistema(_, Sistema, _, Estado)),  forall(objetivo_tripulante(Tripulante, Estado), tripulante(Tripulante, _, _, Estado)).

estado_victoria(ListaRuta, Inventario, Sistemas, Tripulacion) :-modulos_visitados(ListaRuta),  que_tengo(Inventario),
    findall(Modulo-Sistema, sistema(Modulo, Sistema, _, restaurado), Sistemas),
    findall(Tripulante-Modulo, tripulante(Tripulante, Modulo, _, rescatado), Tripulacion).

% verifica_gane/0
% Descripcion: comprueba si ya se gano la partida.
% Entrada: no recibe nada.
% Salida: muestra mensaje de victoria o de falta de condiciones.
% Restricciones: depende del estado actual del juego.
verifica_gane :-condicion_victoria_cumplida,
    marcar_partida_finalizada_actual,
    estado_victoria(Ruta, Inventario, Sistemas, Tripulacion),
    writeln("Condicion de victoria alcanzada."),
    format("Ruta realizada: ~w~n", [Ruta]),
    format("Lista final de artefactos logrados: ~w~n", [Inventario]),
    format("Sistemas reparados: ~w~n", [Sistemas]),
    format("Tripulacion rescatada: ~w~n", [Tripulacion]).

verifica_gane :- writeln("Aun no se cumplen todas las condiciones de victoria.").

% como_gano/0
% Descripcion: da una pista simple de lo que falta para ganar.
% Entrada: no recibe nada.
% Salida: imprime sistemas, tripulantes y movimientos pendientes.
% Restricciones: sirve solo como ayuda para el jugador.
como_gano :-  findall(Sistema, (objetivo_sistema(Sistema, restaurado), \+ sistema_restaurado(Sistema)), SistemasPendientes),
    findall(Tripulante, (objetivo_tripulante(Tripulante, rescatado), \+ tripulante_rescatado(Tripulante)), TripulantesPendientes),
    jugador(Actual),
    findall(Destino, (puedo_ir(Destino), Destino \= Actual), MovimientosPosibles),
    format("Sistemas pendientes: ~w~n", [SistemasPendientes]),
    format("Tripulantes pendientes: ~w~n", [TripulantesPendientes]),
    format("Movimientos posibles desde ~w: ~w~n", [Actual, MovimientosPosibles]).
