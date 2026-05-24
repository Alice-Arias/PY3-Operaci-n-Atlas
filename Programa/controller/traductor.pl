% Traductor (capa de interfaz entre frontend y backend)
% Descripcion: predicados sencillos que delegan en la logica del juego.
% Nota: aqui NO va la logica del juego, solo se exponen "contratos" claros
% que el frontend (o el servidor HTTP) puede invocar.

% -----------------------------------------------------------------------------
% ctrl_estado_inicial/0
% Descripcion: reinicia el estado del juego (llama a estado_inicial/0 del backend).
% Entrada: ninguna.
% Salida: el estado dinamico del juego queda reiniciado en memoria.
% Restricciones: requiere que backend/datos.pl y backend/estado.pl esten cargados.
% Nombre simple para la UI: reiniciar_estado/0
reiniciar_estado_ui :-  estado_inicial.

% -----------------------------------------------------------------------------
% ctrl_listar_modulos/1
% Descripcion: devuelve la lista de modulos del mundo.
% Entrada: una variable que recibira la lista.
% Salida: Modulos es una lista de átomos con los nombres de los modulos.
% Restricciones: lee hechos modulo/2 definidos en backend/datos.pl.
listar_modulos_ui(Modulos) :-  findall(Modulo, modulo(Modulo,_), Modulos).

% -----------------------------------------------------------------------------
% ctrl_listar_artefactos/1
% Descripcion: devuelve la lista de artefactos definidos en el mundo.
% Entrada: una variable que recibira la lista.
% Salida: Artefactos es una lista de átomos con los nombres de los artefactos.
% Restricciones: lee hechos artefacto/2 definidos en backend/datos.pl.
listar_artefactos_ui(Artefactos) :- findall(Artefacto, artefacto(Artefacto,_), Artefactos).

% -----------------------------------------------------------------------------
% ctrl_iniciar_partida/1
% Descripcion: inicia una partida para un jugador dado (delegando a iniciar_partida/1).
% Entrada: NombreJugador (atom o string convertible a atom).
% Salida: se crea el estado inicial y se registra la partida.
% Restricciones: si hay partidas pendientes, el backend puede avisar.
iniciar_partida_ui(NombreJugador) :- iniciar_partida(NombreJugador).

% -----------------------------------------------------------------------------
% ctrl_partida_actual/1
% Descripcion: obtiene el id de la partida actualmente activa.
% Entrada: una variable que recibira el id.
% Salida: IdPartida (numero o atomo, segun implementacion).
% Restricciones: requiere que exista una partida activa.
partida_actual_ui(IdPartida) :- partida_actual(IdPartida).

% -----------------------------------------------------------------------------
% ctrl_tomar/1
% Descripcion: intenta que el jugador tome un artefacto (delegando a tomar/1).
% Entrada: Artefacto (atom).
% Salida: efecto secundario en el estado (agrega artefacto al inventario si es posible).
% Restricciones: el jugador debe estar en el modulo donde esta el artefacto.
tomar_artefacto_ui(Artefacto) :- tomar(Artefacto).

% -----------------------------------------------------------------------------
% ctrl_guardar_partida/0
% Descripcion: guarda la partida actual en disco (delegando a guardar_partida/0).
% Entrada: ninguna.
% Salida: crea o actualiza el archivo .sav correspondiente.
% Restricciones: debe existir una partida activa (o usara archivo por defecto).
guardar_partida_ui :- guardar_partida.


