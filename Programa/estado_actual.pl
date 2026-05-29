jugador(laboratorio).
artefactosLogrados([tarjeta_seguridad,traje_espacial,fusible,energia,medicina,comunicaciones]).
tomado(tarjeta_seguridad).
tomado(traje_espacial).
tomado(fusible).
tomado(energia).
tomado(medicina).
tomado(comunicaciones).
visitado(puente_mando).
visitado(enfermeria).
visitado(laboratorio).
visitado(modulo_energia).
visitado(centro_comunicaciones).
visitado(modulo_escape).
visitado(modulo_medico).
visitado(camaras_seguridad).
sistema(modulo_energia, energia, [fusible], restaurado).
sistema(laboratorio, comunicaciones, [traje_espacial,fusible], restaurado).
sistema(modulo_escape, escape, [energia], restaurado).
tripulante(kai, enfermeria, [energia], rescatado).
tripulante(elena, modulo_energia, [energia], rescatado).
tripulante(marcus, laboratorio, [comunicaciones], rescatado).
jugador_nombre('Ali').
partida_actual(9).
