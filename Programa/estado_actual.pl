jugador(modulo_medico).
artefactosLogrados([tarjeta_seguridad,traje_espacial,fusible,energia,comunicaciones,medicina]).
tomado(tarjeta_seguridad).
tomado(traje_espacial).
tomado(fusible).
tomado(energia).
tomado(comunicaciones).
tomado(medicina).
visitado(puente_mando).
visitado(enfermeria).
visitado(camaras_seguridad).
visitado(laboratorio).
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
jugador_nombre('Ali').
partida_actual(5).
