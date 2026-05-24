% Este modulo guarda las cosas que cambian durante la partida.
% Descripcion: aqui se borra el estado viejo y se pone el estado inicial.
% Entrada: no recibe datos.
% Salida: deja listo el juego para empezar.
% Restricciones: debe cargarse despues de `backend/datos.pl`.

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


% Descripcion: limpia todo y vuelve a poner el estado de inicio.
% Entrada: no recibe nada.
% Salida: reinicia jugador, inventario, visitados, sistemas y tripulacion.
% Restricciones: usa los datos que estan en `backend/datos.pl`.
estado_inicial :- limpiar_estado_dinamico,
    cargar_estado_jugador,
    cargar_inventario_inicial,
    cargar_visitados_iniciales,
    cargar_usados_iniciales,
    cargar_tomados_iniciales,
    cargar_sistemas_iniciales,
    cargar_tripulacion_inicial.

%  borra todo lo dinamico antes de cargar el inicio.
limpiar_estado_dinamico :-  retractall(jugador(_)),
    retractall(artefactosLogrados(_)),
    retractall(usado(_)),%retractall es para eliminar todos los hechos que coincidan con el patron, en este caso con cualquier jugador, cualquier inventario, cualquier artefacto usado, etc. Es importante para limpiar el estado antes de cargar el nuevo.
    retractall(visitado(_)),
    retractall(tomado(_)),
    retractall(sistema(_, _, _, _)),
    retractall(tripulante(_, _, _, _)),
    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)).

%  pone el modulo inicial del jugador.
cargar_estado_jugador :- findall(Jugador, jugador_inicial(Jugador), Lista), cargar_lista_simple(jugador, Lista).%findall es para buscar todos los hechos que coincidan con el patron, en este caso con cualquier jugador inicial, y ponerlos en una lista. Luego esa lista se carga con cargar_lista_simple, que itera sobre la lista y asienta cada hecho con asentar_hecho_simple.

% pone el inventario inicial.
cargar_inventario_inicial :- findall(Inventario, inventario_inicial(Inventario), Lista), cargar_lista_simple(artefactosLogrados, Lista).


% pone los modulos visitados al inicio.
cargar_visitados_iniciales :- findall(Modulo, visitado_inicial(Modulo), Lista),  cargar_lista_simple(visitado, Lista).

%  pone los artefactos usados al inicio.
cargar_usados_iniciales :-findall(Artefacto, usado_inicial(Artefacto), Lista),  cargar_lista_simple(usado, Lista).

%pone los artefactos tomados al inicio.
cargar_tomados_iniciales :-  findall(Artefacto, tomado_inicial(Artefacto), Lista), cargar_lista_simple(tomado, Lista).

% pone los sistemas iniciales en memoria.
cargar_sistemas_iniciales :- findall(sistema(Modulo, Sistema, Requeridos, Estado), sistema_inicial(Modulo, Sistema, Requeridos, Estado), Lista),cargar_lista_compuesta(sistema, Lista).

%  pone la tripulacion inicial en memoria.
cargar_tripulacion_inicial :- findall(tripulante(Nombre, Modulo, Requeridos, Estado), tripulante_inicial(Nombre, Modulo, Requeridos, Estado), Lista),  cargar_lista_compuesta(tripulante, Lista).

%  mete hechos simples en memoria dinamica.
cargar_lista_simple(_, []).
cargar_lista_simple(Predicado, [Elemento | Resto]) :- asentar_hecho_simple(Predicado, Elemento), cargar_lista_simple(Predicado, Resto).


%  guarda un hecho simple segun el predicado pedido.
asentar_hecho_simple(jugador, Elemento) :-  assertz(jugador(Elemento)).% assertz es para agregar un hecho al final de la base de hechos,

asentar_hecho_simple(artefactosLogrados, Elemento) :- assertz(artefactosLogrados(Elemento)).

asentar_hecho_simple(visitado, Elemento) :-  assertz(visitado(Elemento)).

asentar_hecho_simple(usado, Elemento) :- assertz(usado(Elemento)).

asentar_hecho_simple(tomado, Elemento) :-assertz(tomado(Elemento)).

%  mete hechos compuestos en memoria dinamica.
cargar_lista_compuesta(_, []).
cargar_lista_compuesta(Predicado, [Elemento | Resto]) :-  asentar_hecho_compuesto(Predicado, Elemento), cargar_lista_compuesta(Predicado, Resto).

% guarda un hecho compuesto segun el predicado pedido.
asentar_hecho_compuesto(sistema, sistema(Modulo, Sistema, Requeridos, Estado)) :- assertz(sistema(Modulo, Sistema, Requeridos, Estado)).
asentar_hecho_compuesto(tripulante, tripulante(Nombre, Modulo, Requeridos, Estado)) :- assertz(tripulante(Nombre, Modulo, Requeridos, Estado)).
