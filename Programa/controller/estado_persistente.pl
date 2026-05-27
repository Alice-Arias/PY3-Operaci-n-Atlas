% =============================================================================
% MODULO DE PERSISTENCIA DE ESTADO
% Descripcion: guarda y restaura el estado dinamico del juego entre llamadas.
%
% El problema: cada llamada a swipl crea un proceso nuevo que pierde el estado.
% La solucion: escribir el estado en un archivo .pl y consultarlo al inicio.
%
% Archivo de estado: usa la variable de entorno ATLAS_STATE_FILE
% o por defecto el archivo 'estado_actual.pl' en la carpeta del proyecto.
% =============================================================================

% -----------------------------------------------------------------------------
% RUTA DEL ARCHIVO DE ESTADO
% -----------------------------------------------------------------------------
archivo_estado(Ruta) :-
    (   getenv('ATLAS_STATE_FILE', Ruta)
    ->  true
    ;   Ruta = 'estado_actual.pl'
    ).
% -----------------------------------------------------------------------------
% GUARDAR ESTADO EN DISCO
% Escribe todos los hechos dinamicos actuales en clausulas
% -----------------------------------------------------------------------------
guardar_estado_en_disco :-
    archivo_estado(Archivo),
    open(Archivo, write, Stream),
    guardar_hechos_en_stream(Stream),
    close(Stream).
guardar_hechos_en_stream(Stream) :-
    % --- Posicion del jugador ---
    (   jugador(Modulo)
    ->  format(Stream, "jugador(~q).~n", [Modulo])
    ;   true
    ),
    % --- Inventario ---
    (   artefactosLogrados(Inventario)
    ->  format(Stream, "artefactosLogrados(~q).~n", [Inventario])
    ;   format(Stream, "artefactosLogrados([]).~n", [])
    ),
    % --- Artefactos tomados ---
    forall(
        tomado(Art),
        format(Stream, "tomado(~q).~n", [Art])
    ),
    % --- Modulos visitados ---
    forall(
        visitado(V),
        format(Stream, "visitado(~q).~n", [V])
    ),
    % --- Sistemas (con su estado) ---
    forall(
        sistema(Mod, Sis, Arts, Est),
        format(Stream, "sistema(~q, ~q, ~q, ~q).~n", [Mod, Sis, Arts, Est])
    ),
    % --- Tripulantes (con su estado actual) ---
    forall(
        tripulante(Nom, Tmod, TLista, TEst),
        format(Stream, "tripulante(~q, ~q, ~q, ~q).~n", [Nom, Tmod, TLista, TEst])
    ),
    % --- Nombre del jugador ---
    (   jugador_nombre(Nombre)
    ->  format(Stream, "jugador_nombre(~q).~n", [Nombre])
    ;   true
    ),
    % --- Partida actual ---
    (   partida_actual(Id)
    ->  format(Stream, "partida_actual(~q).~n", [Id])
    ;   true
    ).
% -----------------------------------------------------------------------------
% RESTAURAR ESTADO DESDE DISCO
% Limpia los hechos dinamicos actuales y carga los del archivo.
% -----------------------------------------------------------------------------
restaurar_estado_desde_disco :-
    archivo_estado(Archivo),
    (   exists_file(Archivo)
    ->  limpiar_estado_para_persistencia,
        consult(Archivo)
    ;   true   % Si no existe el archivo, usar el estado inicial de main.pl
    ).
% -----------------------------------------------------------------------------
% LIMPIAR ESTADO DINAMICO
% -----------------------------------------------------------------------------
limpiar_estado_para_persistencia :-
    retractall(jugador(_)),
    retractall(artefactosLogrados(_)),
    retractall(tomado(_)),
    retractall(visitado(_)),
    retractall(sistema(_, _, _, _)),
    retractall(tripulante(_, _, _, _)),
    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)).
% -----------.-----------------------------------------------------------------
% BORRAR ARCHIVO DE ESTADO (para nueva partida)
% -----------------------------------------------------------------------------
borrar_estado_en_disco :-
    archivo_estado(Archivo),
    (   exists_file(Archivo)
    ->  delete_file(Archivo)
    ;   true
    ).
