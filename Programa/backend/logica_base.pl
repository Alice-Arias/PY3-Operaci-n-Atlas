% Utilidades y validaciones base de la logica del juego.

% Nombre: inventario/1
% Descripcion: expone el inventario actual como una lista de artefactos logrados.
% Entrada: una variable para recibir la lista o una lista ya conocida.
% Salida: lista de artefactos almacenados en `artefactosLogrados/1`.
% Restricciones: depende del estado dinamico cargado en memoria.
% Objetivo: ofrecer una consulta uniforme del inventario del jugador.
inventario(ListaInventario) :- artefactosLogrados(ListaInventario).

% Nombre: agregar_a_lista_unica/3
% Descripcion: agrega un elemento a una lista solo si aun no existe.
% Entrada: elemento, lista actual y lista resultante.
% Salida: devuelve la lista original o la lista con el nuevo elemento al final.
% Restricciones: no modifica la lista de entrada; produce una nueva lista.
% Objetivo: evitar duplicados en inventarios y colecciones similares.
agregar_a_lista_unica(Elemento, ListaActual, ListaNueva) :-
    ( member(Elemento, ListaActual) ->
        ListaNueva = ListaActual
    ;
        append(ListaActual, [Elemento], ListaNueva)
    ).

% Nombre: modulo_conectado/2
% Descripcion: verifica si dos modulos tienen una conexion directa en cualquier sentido.
% Entrada: modulo origen y modulo destino.
% Salida: verdadero si existe enlace entre ambos modulos.
% Restricciones: considera la conexion como bidireccional.
% Objetivo: simplificar consultas de navegacion entre areas.
modulo_conectado(ModuloOrigen, ModuloDestino) :- enlace(ModuloOrigen, ModuloDestino).
modulo_conectado(ModuloOrigen, ModuloDestino) :- enlace(ModuloDestino, ModuloOrigen).

% Nombre: posee_artefacto/1
% Descripcion: verifica si el jugador ya obtuvo un artefacto.
% Entrada: nombre del artefacto.
% Salida: verdadero si el artefacto aparece en el inventario actual.
% Restricciones: lee el inventario dinamico, no el catalogo base.
% Objetivo: reutilizar una sola consulta para validar acciones y requisitos.
posee_artefacto(Artefacto) :-
    artefactosLogrados(Inventario),
    member(Artefacto, Inventario).

% Nombre: esta_usado/1
% Descripcion: verifica si un artefacto ya fue usado.
% Entrada: nombre del artefacto.
% Salida: verdadero si existe un hecho `usado/1` para ese artefacto.
% Restricciones: depende del estado dinamico.
% Objetivo: evitar reusar elementos que ya cumplieron su funcion.
esta_usado(Artefacto) :- usado(Artefacto).

% Nombre: sistema_restaurado/1
% Descripcion: verifica si un sistema esta en estado restaurado.
% Entrada: nombre del sistema.
% Salida: verdadero si existe un hecho `sistema/4` con estado restaurado.
% Restricciones: consulta el estado dinamico del sistema.
% Objetivo: usar una validacion legible en acciones y consultas.
sistema_restaurado(Sistema) :- sistema(_, Sistema, _, restaurado).

% Nombre: tripulante_rescatado/1
% Descripcion: verifica si un tripulante ya fue rescatado.
% Entrada: nombre del tripulante.
% Salida: verdadero si su estado dinamico es rescatado.
% Restricciones: depende de los hechos cargados en memoria.
% Objetivo: simplificar la verificacion de progreso de la tripulacion.
tripulante_rescatado(Tripulante) :- tripulante(Tripulante, _, _, rescatado).

% Nombre: formatear_identificador_legible/2
% Descripcion: convierte un identificador con guiones bajos en texto legible.
% Entrada: atom origen y variable de salida.
% Salida: texto con espacios y capitalizacion conservada por atom_string/2.
% Restricciones: requiere que la entrada sea un atom.
% Objetivo: mostrar nombres internos de Prolog de forma amigable para personas.
formatear_identificador_legible(Atom, Texto) :-
    atom(Atom),
    atom_string(Atom, Cadena),
    split_string(Cadena, "_", "", Partes),
    atomic_list_concat(Partes, ' ', AtomLegible),
    atom_string(AtomLegible, Texto).

% Nombre: formatear_lista_legible/2
% Descripcion: convierte una lista de identificadores en un texto separado por comas.
% Entrada: lista de atoms y variable de salida.
% Salida: cadena legible o la palabra `ninguno` cuando la lista esta vacia.
% Restricciones: espera elementos compatibles con `formatear_identificador_legible/2`.
% Objetivo: generar mensajes claros para inventarios, requisitos y listas de ayuda.
formatear_lista_legible([], 'ninguno').
formatear_lista_legible(Lista, Texto) :-
    maplist(formatear_identificador_legible, Lista, PartesLegibles),
    atomic_list_concat(PartesLegibles, ', ', AtomTexto),
    atom_string(AtomTexto, Texto).

% Nombre: faltantes_acceso_modulo/4
% Descripcion: calcula que requisitos faltan para entrar a un modulo.
% Entrada: modulo destino y variables para artefactos, sistemas y pasos previos faltantes.
% Salida: listas ordenadas de requisitos faltantes por categoria.
% Restricciones: solo evalua contra las reglas declaradas en `backend/datos.pl`.
% Objetivo: construir mensajes de bloqueo y ayudas mas precisas.
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

% Nombre: motivo_no_puedo_ir/2
% Descripcion: produce un mensaje explicando por que no se puede ir a un modulo.
% Entrada: modulo destino y variable para el mensaje.
% Salida: texto descriptivo con la causa del bloqueo.
% Restricciones: prioriza inexistencia, falta de conexion y requisitos pendientes.
% Objetivo: mostrar errores entendibles para el jugador.
motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    jugador(_),
    \+ modulo(ModuloDestino, _),
    format(atom(Mensaje), "No puedes ir a este modulo porque ~w no existe.", [ModuloDestino]),
    !.

motivo_no_puedo_ir(ModuloDestino, Mensaje) :-
    jugador(ModuloOrigen),
    modulo(ModuloDestino, _),
    \+ modulo_conectado(ModuloOrigen, ModuloDestino),
    format(atom(Mensaje), "No puedes ir a este modulo porque no hay una conexion directa desde ~w.", [ModuloOrigen]),
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
    ( Artefactos \= [] -> format(atom(ParteArtefactos), "Debes conseguir: ~w.", [TextoArtefactos]) ; ParteArtefactos = "" ),
    ( ServiciosPendientes \= [] -> format(atom(ParteServicios), "Debes reparar: ~w.", [TextoServicios]) ; ParteServicios = "" ),
    ( Previos \= [] -> format(atom(PartePrevios), "Debes pasar por: ~w.", [TextoPrevios]) ; PartePrevios = "" ),
    % Concatenar solo las partes que existen, separando con espacio para legibilidad
    atomic_list_concat([ParteArtefactos, ParteServicios, PartePrevios], ' ', PartesConcatenadas),
    format(atom(Mensaje), "No puedes ir a este modulo todavia. ~w", [PartesConcatenadas]),
    !.

motivo_no_puedo_ir(_ModuloDestino, Mensaje) :-
    format(atom(Mensaje), "No puedes ir a este modulo en este momento.", []).

% Nombre: requerimientos_cumplidos/2
% Descripcion: verifica que una lista de requisitos cumpla un validador dado.
% Entrada: lista de requisitos y predicado validador.
% Salida: verdadero si todos los requisitos pasan la validacion.
% Restricciones: el validador debe ser invocable con un argumento.
% Objetivo: reutilizar la misma logica de comprobacion en distintas acciones.
% Verifica todos los requisitos usando el predicado recibido.
requerimientos_cumplidos([], _).
requerimientos_cumplidos([Requisito | Resto], PredicadoValidador) :-
    call(PredicadoValidador, Requisito),
    requerimientos_cumplidos(Resto, PredicadoValidador).

% Nombre: cumple_necesita/1
% Descripcion: valida que el modulo destino tenga todos los artefactos requeridos.
% Entrada: modulo destino.
% Salida: verdadero si el inventario cubre todos los requisitos.
% Restricciones: usa la lista declarada con `necesita/2`.
% Objetivo: separar la verificacion de artefactos del resto de requisitos.
cumple_necesita(ModuloDestino) :-
    findall(Artefacto, necesita(ModuloDestino, Artefacto), Requeridos),
    requerimientos_cumplidos(Requeridos, posee_artefacto).

% Nombre: cumple_estado/1
% Descripcion: valida que los sistemas exigidos por un modulo esten en su estado correcto.
% Entrada: modulo destino.
% Salida: verdadero si todos los sistemas requeridos cumplen su estado.
% Restricciones: depende de las reglas `necesita_estado/3` y `sistema/4`.
% Objetivo: encapsular la comprobacion de estados previos.
cumple_estado(ModuloDestino) :-
    findall(Servicio-EstadoNecesario, necesita_estado(ModuloDestino, Servicio, EstadoNecesario), Requeridos),
    cumple_lista_estados(Requeridos).

% Nombre: cumple_lista_estados/1
% Descripcion: verifica una lista de pares servicio-estado.
% Entrada: lista de requisitos de estado.
% Salida: verdadero cuando cada servicio coincide con el estado pedido.
% Restricciones: se usa como helper interno de `cumple_estado/1`.
% Objetivo: dividir la validacion de estados en una rutina simple y reutilizable.
cumple_lista_estados([]).
cumple_lista_estados([Servicio-EstadoNecesario | Resto]) :-
    sistema(_, Servicio, _, EstadoNecesario),
    cumple_lista_estados(Resto).

% Nombre: cumple_pasos_previos/1
% Descripcion: verifica que los modulos previos requeridos ya hayan sido visitados.
% Entrada: modulo destino.
% Salida: verdadero si todos los pasos previos se cumplieron.
% Restricciones: depende de `paso_previo/2` y `visitado/1`.
% Objetivo: forzar el orden narrativo del progreso.
cumple_pasos_previos(ModuloDestino) :-
    findall(ModuloPrevio, paso_previo(ModuloDestino, ModuloPrevio), ListaPrevios),
    cumple_previos(ListaPrevios).

% Nombre: cumple_previos/1
% Descripcion: valida una lista de modulos previos visitados.
% Entrada: lista de modulos.
% Salida: verdadero si todos aparecen como visitados.
% Restricciones: helper interno de `cumple_pasos_previos/1`.
% Objetivo: mantener compacta la verificacion de precondiciones narrativas.
cumple_previos([]).
cumple_previos([ModuloPrevio | Resto]) :-
    visitado(ModuloPrevio),
    cumple_previos(Resto).

% Nombre: puedo_ir/1
% Descripcion: comprueba si el jugador puede moverse a un modulo destino.
% Entrada: modulo destino.
% Salida: verdadero si existe modulo, conexion y se cumplen los requisitos.
% Restricciones: combina conectividad, artefactos, estados y pasos previos.
% Objetivo: centralizar la regla completa de navegacion segura.
puedo_ir(ModuloDestino) :-
    jugador(ModuloOrigen),
    modulo(ModuloDestino, _),
    modulo_conectado(ModuloOrigen, ModuloDestino),
    cumple_necesita(ModuloDestino),
    cumple_estado(ModuloDestino),
    cumple_pasos_previos(ModuloDestino).
