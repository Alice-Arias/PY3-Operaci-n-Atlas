% Este modulo tiene ayudas simples para todo el backend.
% Descripcion: valida datos vacios y pone valores por defecto.
% Entrada: usa datos que le mandan otros predicados.
% Salida: devuelve valores limpios o valores por defecto.
% Restricciones: se usa como apoyo, no como logica principal.


% Nombre: valor_vacio/1
% Descripcion: determina si un dato esta vacio o no representa un valor util.
% Entrada: un termino cualquiera.
% Salida: verdadero si el termino es una variable, un atom vacio, una cadena vacia o un string vacio.
% Restricciones: no transforma datos; solo valida ausencia de contenido.
% Objetivo: centralizar la deteccion de valores vacios para reutilizarla en otros predicados.
valor_vacio(Dato) :- var(Dato), !.
valor_vacio(Dato) :-Dato == '', !.
valor_vacio(Dato) :- Dato == "", !.
valor_vacio(Dato) :-string(Dato), string_length(Dato, 0), !.
valor_vacio(Dato) :- atom(Dato), atom_length(Dato, 0), !.%atom es para verificar si el dato es un atom, y atom_length es para verificar si el atom esta vacio}

% Nombre: avisar_error_simple/2
% Descripcion: muestra un aviso cuando un dato falta o no es valido.
% Entrada: una etiqueta para identificar el problema y un valor por defecto.
% Salida: escribe un mensaje informativo en consola.
% Restricciones: solo informa; no corrige el flujo de ejecucion.
% Objetivo: dejar rastro claro de cuando se usa un valor de respaldo.
avisar_error_simple(Etiqueta, Defecto) :-format("Okey, esta linea tiene este error en ~w. Uso el valor por defecto: ~w~n", [Etiqueta, Defecto]).%format es para imprimir un mensaje con variables, ~w es para imprimir la variable sin formato especial, y ~n es para agregar un salto de linea al final del mensaje.


% Nombre: usar_default_si_vacio/4
% Descripcion: reemplaza un dato vacio por un valor por defecto.
% Entrada: dato original, valor por defecto, etiqueta de contexto y variable de salida.
% Salida: deja en Resultado el dato original o el defecto cuando aplica.
% Restricciones: si el dato esta vacio, tambien emite un aviso.
% Objetivo: simplificar la limpieza defensiva de parametros.
usar_default_si_vacio(Dato, Defecto, Etiqueta, Resultado) :- valor_vacio(Dato), !, avisar_error_simple(Etiqueta, Defecto), Resultado = Defecto.
usar_default_si_vacio(Dato, _, _, Dato).


% Nombre: texto_a_atom_simple/4
% Descripcion: convierte texto, atom o numero a un atom valido de Prolog.
% Entrada: dato original, valor por defecto, etiqueta y variable de salida.
% Salida: AtomFinal queda como atom equivalente al dato limpio.
% Restricciones: acepta strings, atoms, numeros y otros terminos genericos.
% Objetivo: normalizar entradas de texto antes de usarlas en la logica.
texto_a_atom_simple(Dato, Defecto, Etiqueta, AtomFinal) :-
    usar_default_si_vacio(Dato, Defecto, Etiqueta, DatoSeguro),
    (   string(DatoSeguro) ->  atom_string(AtomFinal, DatoSeguro) ; atom(DatoSeguro) ->  AtomFinal = DatoSeguro ; number(DatoSeguro)
    ->  number_string(DatoSeguro, TextoNumero),  atom_string(AtomFinal, TextoNumero) ;   term_string(DatoSeguro, TextoGenerico), atom_string(AtomFinal, TextoGenerico)).
%->  es para hacer una especie de if

% Nombre: entero_con_default/4
% Descripcion: intenta convertir un dato a entero o usa un defecto.
% Entrada: dato original, valor por defecto, etiqueta y variable de salida.
% Salida: EnteroFinal contiene un entero valido.
% Restricciones: si la conversion falla, se reporta y se usa el defecto.
% Objetivo: asegurar que los numeros usados por el sistema sean enteros.
entero_con_default(Dato, Defecto, Etiqueta, EnteroFinal) :-
    usar_default_si_vacio(Dato, Defecto, Etiqueta, DatoSeguro),
    (   integer(DatoSeguro) ->  EnteroFinal = DatoSeguro;   atom(DatoSeguro), catch(atom_number(DatoSeguro, Numero), _, fail)
    ->  EnteroFinal = Numero ; string(DatoSeguro), catch(number_string(Numero, DatoSeguro), _, fail)
    ->  EnteroFinal = Numero;  avisar_error_simple(Etiqueta, Defecto), EnteroFinal = Defecto ).


% Nombre: estado_registro_valido/2
% Descripcion: valida que el estado del registro sea uno de los valores admitidos.
% Entrada: estado recibido y estado normalizado de salida.
% Salida: devuelve pendiente o finalizada.
% Restricciones: solo acepta los estados conocidos por el sistema.
% Objetivo: evitar estados inconsistentes en el registro de partidas.
estado_registro_valido(Estado, pendiente) :- var(Estado),!, format("Okey, esta linea tiene este error en estado del registro. Uso el valor por defecto: pendiente~n", []).

estado_registro_valido(pendiente, pendiente).
estado_registro_valido(finalizada, finalizada).

estado_registro_valido(Estado, pendiente) :- format("Okey, esta linea tiene este error en estado del registro. Uso el valor por defecto: pendiente~n", []),
    \+ member(Estado, [pendiente, finalizada]).%\+ lo que hace es negar que el estado sea alguno de los validos, entonces si no es ninguno, avisa y pone pendiente.
