
% ENLACES ENTRE MÓDULOS
enlace(puente_mando, laboratorio).
enlace(laboratorio, modulo_energia).
enlace(puente_mando, enfermeria).
enlace(enfermeria, modulo_escape).

% CONEXIÓN BIDIRECCIONAL
conectado(X, Y) :- enlace(X, Y).
conectado(X, Y) :- enlace(Y, X).