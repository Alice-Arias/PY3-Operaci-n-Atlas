jugador(enfermeria).
artefactosLogrados([tarjeta_seguridad,fusible,traje_espacial,energia,comunicaciones,medicina]).
tomado(tarjeta_seguridad).
tomado(fusible).
tomado(traje_espacial).
tomado(energia).
tomado(comunicaciones).
tomado(medicina).
visitado(puente_mando).
visitado(laboratorio).
visitado(enfermeria).
visitado(modulo_energia).
visitado(centro_comunicaciones).
visitado(modulo_escape).
visitado(modulo_medico).
sistema(laboratorio, comunicaciones, [traje_espacial,fusible], restaurado).
sistema(modulo_energia, energia, [fusible], restaurado).
sistema(modulo_escape, escape, [energia], restaurado).
tripulante(marcus, laboratorio, [comunicaciones], rescatado).
tripulante(elena, modulo_energia, [energia], rescatado).
tripulante(kai, enfermeria, [energia], rescatado).
jugador_nombre('Alice').
partida_actual(10).
