% Este modulo tiene ayudas simples para todo el backend.
% Descripcion: valida datos vacios y pone valores por defecto.
% Entrada: usa datos que le mandan otros predicados.
% Salida: devuelve valores limpios o valores por defecto.
% Restricciones: se usa como apoyo, no como logica principal.


% dice si un dato esta vacio o no sirve.
valor_vacio(Dato) :- var(Dato), !.
valor_vacio(Dato) :-Dato == '', !.
valor_vacio(Dato) :- Dato == "", !.
valor_vacio(Dato) :-string(Dato), string_length(Dato, 0), !.
valor_vacio(Dato) :- atom(Dato), atom_length(Dato, 0), !.%atom es para verificar si el dato es un atom, y atom_length es para verificar si el atom esta vacio}

%  imprime un mensaje cuando un dato no viene bien.
avisar_error_simple(Etiqueta, Defecto) :-format("Okey, esta linea tiene este error en ~w. Uso el valor por defecto: ~w~n", [Etiqueta, Defecto]).%format es para imprimir un mensaje con variables, ~w es para imprimir la variable sin formato especial, y ~n es para agregar un salto de linea al final del mensaje.


%  si el dato esta vacio, usa un valor por defecto.
usar_default_si_vacio(Dato, Defecto, Etiqueta, Resultado) :- valor_vacio(Dato), !, avisar_error_simple(Etiqueta, Defecto), Resultado = Defecto.
usar_default_si_vacio(Dato, _, _, Dato).


% convierte texto o atom a atom de Prolog.
texto_a_atom_simple(Dato, Defecto, Etiqueta, AtomFinal) :-
    usar_default_si_vacio(Dato, Defecto, Etiqueta, DatoSeguro),
    (   string(DatoSeguro) ->  atom_string(AtomFinal, DatoSeguro) ; atom(DatoSeguro) ->  AtomFinal = DatoSeguro ; number(DatoSeguro)
    ->  number_string(DatoSeguro, TextoNumero),  atom_string(AtomFinal, TextoNumero) ;   term_string(DatoSeguro, TextoGenerico), atom_string(AtomFinal, TextoGenerico)).
%->  es para hacer una especie de if

%  convierte un dato a entero o usa uno por defecto.
entero_con_default(Dato, Defecto, Etiqueta, EnteroFinal) :-
    usar_default_si_vacio(Dato, Defecto, Etiqueta, DatoSeguro),
    (   integer(DatoSeguro) ->  EnteroFinal = DatoSeguro;   atom(DatoSeguro), catch(atom_number(DatoSeguro, Numero), _, fail)
    ->  EnteroFinal = Numero ; string(DatoSeguro), catch(number_string(Numero, DatoSeguro), _, fail)
    ->  EnteroFinal = Numero;  avisar_error_simple(Etiqueta, Defecto), EnteroFinal = Defecto ).


% permite solo estados conocidos del registro.
estado_registro_valido(Estado, pendiente) :- var(Estado),!, format("Okey, esta linea tiene este error en estado del registro. Uso el valor por defecto: pendiente~n", []).

estado_registro_valido(pendiente, pendiente).
estado_registro_valido(finalizada, finalizada).

estado_registro_valido(Estado, pendiente) :- format("Okey, esta linea tiene este error en estado del registro. Uso el valor por defecto: pendiente~n", []),
    \+ member(Estado, [pendiente, finalizada]).%\+ lo que hace es negar que el estado sea alguno de los validos, entonces si no es ninguno, avisa y pone pendiente.
