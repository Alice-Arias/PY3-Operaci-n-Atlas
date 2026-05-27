% =============================================================================
% TRADUCTOR — Capa de interfaz entre frontend y backend
%
% ARQUITECTURA DE PERSISTENCIA:
%   Cada llamada a swipl inicia un proceso nuevo y se perdia el proceso porque se reiniciaba todo.
%   para que se mantenga el progreso:
%     1. Restaurar el estado desde disco al inicio.
%     2. Ejecuta la logica del juego.
%     3. Guardar el nuevo estado en disco al final(que es un archivo que se crea que se llama estado_ui.pl).
% =============================================================================

:- use_module(library(lists)).

% -----------------------------------------------------------------------------
% REINICIAR ESTADO
% -----------------------------------------------------------------------------
reiniciar_estado_ui :-
    borrar_estado_en_disco,
    estado_inicial,
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% LISTAR MODULOS
% (son estaticos)
% -----------------------------------------------------------------------------
listar_modulos_ui(Modulos) :-
    findall(
        Modulo,
        modulo(Modulo, _),
        Modulos
    ).

% -----------------------------------------------------------------------------
% LISTAR MODULOS CON DESCRIPCION
% -----------------------------------------------------------------------------
listar_modulos_info_ui(ModulosInfo) :-
    findall(
        modulo_data(Modulo, Descripcion),
        modulo(Modulo, Descripcion),
        ModulosInfoSinOrden
    ),
    sort(ModulosInfoSinOrden, ModulosInfo).
% -----------------------------------------------------------------------------
% LISTAR ARTEFACTOS
% (son estaticos)
% -----------------------------------------------------------------------------
listar_artefactos_ui(Artefactos) :-
    findall(
        Artefacto,
        artefacto(Artefacto, _),
        Artefactos
    ).

% -----------------------------------------------------------------------------
% LISTAR CONEXIONES ENTRE MODULOS
% -----------------------------------------------------------------------------
listar_conexiones_ui(Conexiones) :-
    findall(
        conexion(Origen, Destino),
        enlace(Origen, Destino),
        Conexiones
    ).

% -----------------------------------------------------------------------------
% LISTAR REGISTRO DE PARTIDAS
% -----------------------------------------------------------------------------
listar_registro_partidas_ui(Registros) :-
    findall(
        partida_registro(Jugador, IdPartida, Archivo, Estado),
        partida_registro(Jugador, IdPartida, Archivo, Estado),
        RegistrosSinOrden
    ),
    sort(RegistrosSinOrden, Registros).

% -----------------------------------------------------------------------------
% LISTAR PARTIDAS PENDIENTES POR JUGADOR
% -----------------------------------------------------------------------------
listar_partidas_pendientes_ui(NombreJugador, Pendientes) :-
    partidas_pendientes(NombreJugador, PendientesSinOrden),
    sort(PendientesSinOrden, Pendientes).
% -----------------------------------------------------------------------------
% INICIAR PARTIDA
% se borra los datos del estado anterior guardado para crear dinamicamente el nuevo
% -----------------------------------------------------------------------------
iniciar_partida_ui(NombreJugador) :-
    borrar_estado_en_disco,
    estado_inicial,
    generar_id_partida(IdPartida),
    retractall(jugador_nombre(_)),
    retractall(partida_actual(_)),
    assertz(jugador_nombre(NombreJugador)),
    assertz(partida_actual(IdPartida)),
    partida_archivo(NombreJugador, IdPartida, Archivo),

    registrar_partida(
        NombreJugador,
        IdPartida,
        Archivo,
        pendiente
    ),
    guardar_estado_en_disco,
    format(
        "Partida iniciada para ~w con id ~w.",
        [NombreJugador, IdPartida]
    ).

% -----------------------------------------------------------------------------
% PARTIDA ACTUAL
% -----------------------------------------------------------------------------
partida_actual_ui(IdPartida) :-
    restaurar_estado_desde_disco,
    partida_actual(IdPartida).
% -----------------------------------------------------------------------------
% TOMAR ARTEFACTO
% -----------------------------------------------------------------------------
tomar_artefacto_ui(Artefacto) :-
    restaurar_estado_desde_disco,
    tomar(Artefacto),
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% MOVER
% -----------------------------------------------------------------------------
mover_ui(Modulo) :-
    restaurar_estado_desde_disco,
    mover(Modulo),
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% REPARAR
% -----------------------------------------------------------------------------
reparar_ui(Sistema) :-
    restaurar_estado_desde_disco,
    reparar(Sistema),
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% RESCATAR
% -----------------------------------------------------------------------------
rescatar_ui(Tripulante) :-
    restaurar_estado_desde_disco,
    rescatar(Tripulante),
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% GUARDAR PARTIDA (manual)
% -----------------------------------------------------------------------------
guardar_partida_ui :-
    restaurar_estado_desde_disco,
    guardar_partida,
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% CARGAR PARTIDA
% -----------------------------------------------------------------------------
cargar_partida_ui(IdPartida) :-
    cargar_partida_id(IdPartida),
    guardar_estado_en_disco.
% -----------------------------------------------------------------------------
% AYUDA
% -----------------------------------------------------------------------------
ayuda_ui :-
    restaurar_estado_desde_disco,
    como_gano.
% -----------------------------------------------------------------------------
% VERIFICAR VICTORIA
% -----------------------------------------------------------------------------
verifica_victoria_ui :-
    restaurar_estado_desde_disco,
    verifica_gane.
% -----------------------------------------------------------------------------
% ESTADO GLOBAL PARA REACT
% Restaura el estado desde disco y construye el termino estado/7
% con toda la informacion que necesita el frontend para que muestre los datos.
% -----------------------------------------------------------------------------
estado_ui(
    estado(
        ModuloActual,
        Inventario,
        Visitados,
        Sistemas,
        Tripulantes,
        ModulosConectados,
        ArtefactosDisponibles
    )
) :-
    restaurar_estado_desde_disco,
    % -----------------------------------------------------------------
    % POSICION ACTUAL DEL JUGADOR
    % -----------------------------------------------------------------
    jugador(ModuloActual),
    % -----------------------------------------------------------------
    % INVENTARIO
    % -----------------------------------------------------------------
    artefactosLogrados(Inventario),
    % -----------------------------------------------------------------
    % MODULOS VISITADOS
    % -----------------------------------------------------------------
    findall(
        Visitado,
        visitado(Visitado),
        Visitados
    ),
    % -----------------------------------------------------------------
    % SISTEMAS DEL JUEGO (estado actual)
    % -----------------------------------------------------------------
    findall(
        sistema_data(Modulo, Sistema, Estado),
        sistema(Modulo, Sistema, _, Estado),
        Sistemas
    ),
    % -----------------------------------------------------------------
    % TRIPULANTES (estado actual)
    % -----------------------------------------------------------------
    findall(
        tripulante_data(Nombre, Modulo, Estado),
        tripulante(Nombre, Modulo, _, Estado),
        Tripulantes
    ),
    % -----------------------------------------------------------------
    % MODULOS CONECTADOS AL ACTUAL (accesibles desde aqui)
    % -----------------------------------------------------------------
    findall(
        Conexion,
        modulo_conectado(ModuloActual, Conexion),
        ModulosConectadosSinOrden
    ),
    sort(ModulosConectadosSinOrden, ModulosConectados),
    % -----------------------------------------------------------------
    % ARTEFACTOS DISPONIBLES (no tomados aun)
    % -----------------------------------------------------------------
    findall(
        artefacto_data(Artefacto, Modulo),
        (
            artefacto(Artefacto, Modulo),
            \+ tomado(Artefacto)
        ),
        ArtefactosDisponibles
    ).