
% RESTRICCIONES DE ACCESO
necesita(modulo_energia, traje_espacial).
necesita(modulo_escape, tarjeta_seguridad).


% ESTADO REQUERIDO
necesitaEstado(modulo_escape, energia, restaurado).


% PASOS PREVIOS
pasoPrevio(modulo_escape, laboratorio).


% OBJETIVOS
objetivoS(energia, restaurado).
objetivoS(comunicaciones, restaurado).

objetivoT(kai, rescatado).