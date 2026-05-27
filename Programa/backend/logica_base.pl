% Utilidades y validaciones base de la logica del juego.

inventario(ListaInventario) :- artefactosLogrados(ListaInventario).

agregar_a_lista_unica(Elemento, ListaActual, ListaNueva) :-
    ( member(Elemento, ListaActual) ->
        ListaNueva = ListaActual
    ;
        append(ListaActual, [Elemento], ListaNueva)
    ).

modulo_conectado(ModuloOrigen, ModuloDestino) :- enlace(ModuloOrigen, ModuloDestino).
modulo_conectado(ModuloOrigen, ModuloDestino) :- enlace(ModuloDestino, ModuloOrigen).

posee_artefacto(Artefacto) :-
    artefactosLogrados(Inventario),
    member(Artefacto, Inventario).

esta_usado(Artefacto) :- usado(Artefacto).

sistema_restaurado(Sistema) :- sistema(_, Sistema, _, restaurado).

tripulante_rescatado(Tripulante) :- tripulante(Tripulante, _, _, rescatado).

formatear_identificador_legible(Atom, Texto) :-
    atom(Atom),
    atom_string(Atom, Cadena),
    split_string(Cadena, "_", "", Partes),
    atomic_list_concat(Partes, ' ', AtomLegible),
    atom_string(AtomLegible, Texto).

formatear_lista_legible([], 'ninguno').
formatear_lista_legible(Lista, Texto) :-
    maplist(formatear_identificador_legible, Lista, PartesLegibles),
    atomic_list_concat(PartesLegibles, ', ', AtomTexto),
    atom_string(AtomTexto, Texto).

faltantes_acceso_modulo(ModuloDestino, Artefactos, Sistemas, Previos) :-
    findall(
        Artefacto,
        (
            necesita(ModuloDestino, Artefacto),
            \+ posee_artefacto(Artefacto)
        ),
        ArtefactosSinOrden
    ),
    sort(ArtefactosSinOrden, Artefactos),
    findall(
        Servicio-EstadoNecesario,
        (
            necesita_estado(ModuloDestino, Servicio, EstadoNecesario),
            \+ sistema(_, Servicio, _, EstadoNecesario)
        ),
        SistemasSinOrden
    ),
    sort(SistemasSinOrden, Sistemas),
    findall(
        ModuloPrevio,
        (
            paso_previo(ModuloDestino, ModuloPrevio),
            \+ visitado(ModuloPrevio)
        ),
        PreviosSinOrden
    ),
    sort(PreviosSinOrden, Previos).

motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    jugador(_),
    \+ modulo(ModuloDestino, _),
    format(atom(Mensaje), "No puedes acceder a ~w porque ese modulo no existe.", [ModuloDestino]),
    !.

motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    jugador(ModuloOrigen),
    modulo(ModuloDestino, _),
    \+ modulo_conectado(ModuloOrigen, ModuloDestino),
    format(atom(Mensaje), "No puedes acceder a ~w desde ~w porque no hay una conexion directa.", [ModuloDestino, ModuloOrigen]),
    !.

motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    jugador(ModuloOrigen),
    modulo_conectado(ModuloOrigen, ModuloDestino),
    faltantes_acceso_modulo(ModuloDestino, Artefactos, Sistemas, Previos),
    ( Artefactos \= [] ; Sistemas \= [] ; Previos \= [] ),
    formatear_lista_legible(Artefactos, TextoArtefactos),
    findall(Servicio, member(Servicio-_, Sistemas), ServiciosPendientes),
    formatear_lista_legible(ServiciosPendientes, TextoServicios),
    formatear_lista_legible(Previos, TextoPrevios),
    % Construir mensajes parciales solo si hay elementos pendientes
    ( Artefactos \= [] -> format(atom(ParteArtefactos), "Tienes que conseguir: ~w.", [TextoArtefactos]) ; ParteArtefactos = "" ),
    ( ServiciosPendientes \= [] -> format(atom(ParteServicios), "Tienes que reparar: ~w.", [TextoServicios]) ; ParteServicios = "" ),
    ( Previos \= [] -> format(atom(PartePrevios), "Tienes que pasar por: ~w.", [TextoPrevios]) ; PartePrevios = "" ),
    % Concatenar solo las partes que existen, separando con espacio para legibilidad
    atomic_list_concat([ParteArtefactos, ParteServicios, PartePrevios], ' ', PartesConcatenadas),
    format(atom(Mensaje), "No puedes acceder a ~w todavia. ~w", [ModuloDestino, PartesConcatenadas]),
    !.

motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    format(atom(Mensaje), "No puedes acceder a ~w en este momento.", [ModuloDestino]),
    !.

% Verifica todos los requisitos usando el predicado recibido.
requerimientos_cumplidos([], _).
requerimientos_cumplidos([Requisito | Resto], PredicadoValidador) :-
    call(PredicadoValidador, Requisito),
    requerimientos_cumplidos(Resto, PredicadoValidador).

cumple_necesita(ModuloDestino) :-
    findall(Artefacto, necesita(ModuloDestino, Artefacto), Requeridos),
    requerimientos_cumplidos(Requeridos, posee_artefacto).

cumple_estado(ModuloDestino) :-
    findall(Servicio-EstadoNecesario, necesita_estado(ModuloDestino, Servicio, EstadoNecesario), Requeridos),
    cumple_lista_estados(Requeridos).

cumple_lista_estados([]).
cumple_lista_estados([Servicio-EstadoNecesario | Resto]) :-
    sistema(_, Servicio, _, EstadoNecesario),
    cumple_lista_estados(Resto).

cumple_pasos_previos(ModuloDestino) :-
    findall(ModuloPrevio, paso_previo(ModuloDestino, ModuloPrevio), ListaPrevios),
    cumple_previos(ListaPrevios).

cumple_previos([]).
cumple_previos([ModuloPrevio | Resto]) :-
    visitado(ModuloPrevio),
    cumple_previos(Resto).

puedo_ir(ModuloDestino) :-
    jugador(ModuloOrigen),
    modulo(ModuloDestino, _),
    modulo_conectado(ModuloOrigen, ModuloDestino),
    cumple_necesita(ModuloDestino),
    cumple_estado(ModuloDestino),
    cumple_pasos_previos(ModuloDestino).
