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

% Nombre: limpiar_estado_dinamico/0
% Descripcion: elimina todos los hechos dinamicos de la partida actual.
% Entrada: no recibe datos.
% Salida: deja vacia la memoria dinamica para volver a cargar el inicio.
% Restricciones: debe ejecutarse antes de cargar cualquier estado nuevo.
% Objetivo: evitar que una partida nueva herede datos de una partida anterior.
limpiar_estado_dinamico :-  retractall(jugador(_)),
    retractall(artefactosLogrados(_)),
    retractall(usado(_)),%retractall es para eliminar todos los hechos que coincidan con el patron, en este caso con cualquier jugador, cualquier inventario, cualquier artefacto usado, etc. Es importante para limpiar el estado antes de cargar el nuevo.
    retractall(visitado(_)),
    retractall(tomado(_)),
    retractall(sistema(_, _, _, _)),
    retractall(tripulante(_, _, _, _)),
    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)).

% Nombre: cargar_estado_jugador/0
% Descripcion: carga el modulo inicial del jugador desde los datos base.
% Entrada: no recibe datos.
% Salida: asienta el jugador inicial en memoria dinamica.
% Restricciones: depende de que exista `jugador_inicial/1` en los datos.
% Objetivo: restaurar el punto de partida del operario.
cargar_estado_jugador :- findall(Jugador, jugador_inicial(Jugador), Lista), cargar_lista_simple(jugador, Lista).%findall es para buscar todos los hechos que coincidan con el patron, en este caso con cualquier jugador inicial, y ponerlos en una lista. Luego esa lista se carga con cargar_lista_simple, que itera sobre la lista y asienta cada hecho con asentar_hecho_simple.

% Nombre: cargar_inventario_inicial/0
% Descripcion: carga el inventario inicial del juego.
% Entrada: no recibe datos.
% Salida: deja asentados los artefactos iniciales.
% Restricciones: se apoya en los hechos `inventario_inicial/1`.
% Objetivo: arrancar la partida con el inventario esperado.
cargar_inventario_inicial :- findall(Inventario, inventario_inicial(Inventario), Lista), cargar_lista_simple(artefactosLogrados, Lista).


% Nombre: cargar_visitados_iniciales/0
% Descripcion: carga los modulos visitados al arrancar la partida.
% Entrada: no recibe datos.
% Salida: deja registrados los modulos ya recorridos.
% Restricciones: depende de `visitado_inicial/1`.
% Objetivo: conservar el estado inicial del recorrido.
cargar_visitados_iniciales :- findall(Modulo, visitado_inicial(Modulo), Lista),  cargar_lista_simple(visitado, Lista).

% Nombre: cargar_usados_iniciales/0
% Descripcion: carga los artefactos ya usados al inicio.
% Entrada: no recibe datos.
% Salida: deja marcados los artefactos usados por defecto.
% Restricciones: depende de `usado_inicial/1`.
% Objetivo: iniciar el juego con el historial correcto.
cargar_usados_iniciales :-findall(Artefacto, usado_inicial(Artefacto), Lista),  cargar_lista_simple(usado, Lista).

% Nombre: cargar_tomados_iniciales/0
% Descripcion: carga los artefactos ya tomados al inicio.
% Entrada: no recibe datos.
% Salida: deja marcados los objetos recogidos por defecto.
% Restricciones: depende de `tomado_inicial/1`.
% Objetivo: mantener coherencia entre inventario y estado inicial.
cargar_tomados_iniciales :-  findall(Artefacto, tomado_inicial(Artefacto), Lista), cargar_lista_simple(tomado, Lista).

% Nombre: cargar_sistemas_iniciales/0
% Descripcion: carga los sistemas del escenario con su estado inicial.
% Entrada: no recibe datos.
% Salida: asienta todos los hechos `sistema/4` iniciales.
% Restricciones: depende de `sistema_inicial/4`.
% Objetivo: reconstruir el estado de las instalaciones de la estacion.
cargar_sistemas_iniciales :- findall(sistema(Modulo, Sistema, Requeridos, Estado), sistema_inicial(Modulo, Sistema, Requeridos, Estado), Lista),cargar_lista_compuesta(sistema, Lista).

% Nombre: cargar_tripulacion_inicial/0
% Descripcion: carga la tripulacion inicial del escenario.
% Entrada: no recibe datos.
% Salida: asienta todos los hechos `tripulante/4` iniciales.
% Restricciones: depende de `tripulante_inicial/4`.
% Objetivo: restaurar a las personas atrapadas con su estado base.
cargar_tripulacion_inicial :- findall(tripulante(Nombre, Modulo, Requeridos, Estado), tripulante_inicial(Nombre, Modulo, Requeridos, Estado), Lista),  cargar_lista_compuesta(tripulante, Lista).

% Nombre: cargar_lista_simple/2
% Descripcion: recorre una lista e inserta hechos simples en memoria dinamica.
% Entrada: predicado destino y lista de elementos.
% Salida: cada elemento queda asentado con su predicado correspondiente.
% Restricciones: la lista debe contener elementos compatibles con el predicado.
% Objetivo: reutilizar una unica rutina de carga para varios tipos de datos.
cargar_lista_simple(_, []).
cargar_lista_simple(Predicado, [Elemento | Resto]) :- asentar_hecho_simple(Predicado, Elemento), cargar_lista_simple(Predicado, Resto).


% Nombre: asentar_hecho_simple/2
% Descripcion: inserta un hecho dinamico simple segun el predicado elegido.
% Entrada: nombre del predicado y elemento a guardar.
% Salida: el hecho queda registrado en memoria dinamica.
% Restricciones: solo admite los predicados simples definidos aqui.
% Objetivo: encapsular la escritura de hechos basicos.
asentar_hecho_simple(jugador, Elemento) :-  assertz(jugador(Elemento)).% assertz es para agregar un hecho al final de la base de hechos,

asentar_hecho_simple(artefactosLogrados, Elemento) :- assertz(artefactosLogrados(Elemento)).

asentar_hecho_simple(visitado, Elemento) :-  assertz(visitado(Elemento)).

asentar_hecho_simple(usado, Elemento) :- assertz(usado(Elemento)).

asentar_hecho_simple(tomado, Elemento) :-assertz(tomado(Elemento)).

% Nombre: cargar_lista_compuesta/2
% Descripcion: recorre una lista e inserta hechos compuestos en memoria dinamica.
% Entrada: predicado destino y lista de terminos estructurados.
% Salida: cada termino queda asentado con su forma correspondiente.
% Restricciones: la lista debe contener terminos ya estructurados.
% Objetivo: reutilizar una unica rutina para hechos compuestos como sistema/4.
cargar_lista_compuesta(_, []).
cargar_lista_compuesta(Predicado, [Elemento | Resto]) :-  asentar_hecho_compuesto(Predicado, Elemento), cargar_lista_compuesta(Predicado, Resto).

% Nombre: asentar_hecho_compuesto/2
% Descripcion: inserta hechos dinamicos compuestos como sistema/4 o tripulante/4.
% Entrada: nombre del predicado y termino completo a guardar.
% Salida: el hecho queda registrado en memoria dinamica.
% Restricciones: solo maneja los predicados compuestos declarados aqui.
% Objetivo: centralizar la insercion de estructuras complejas.
asentar_hecho_compuesto(sistema, sistema(Modulo, Sistema, Requeridos, Estado)) :- assertz(sistema(Modulo, Sistema, Requeridos, Estado)).
asentar_hecho_compuesto(tripulante, tripulante(Nombre, Modulo, Requeridos, Estado)) :- assertz(tripulante(Nombre, Modulo, Requeridos, Estado)).
