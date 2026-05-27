jugador(centro_comunicaciones).
artefactosLogrados([tarjeta_seguridad,traje_espacial,medicina,fusible,energia,comunicaciones]).
tomado(tarjeta_seguridad).
tomado(traje_espacial).
tomado(medicina).
tomado(fusible).
tomado(energia).
tomado(comunicaciones).
visitado(puente_mando).
visitado(enfermeria).
visitado(modulo_medico).
visitado(camaras_seguridad).
visitado(laboratorio).
visitado(modulo_energia).
visitado(modulo_escape).
visitado(centro_comunicaciones).
sistema(laboratorio, comunicaciones, [traje_espacial,fusible], restaurado).
sistema(modulo_energia, energia, [fusible], restaurado).
sistema(modulo_escape, escape, [energia], restaurado).
tripulante(elena, modulo_energia, [energia], atrapado).
tripulante(kai, enfermeria, [energia], atrapado).
tripulante(sophia, camaras_seguridad, [tarjeta_seguridad], rescatado).
tripulante(marcus, laboratorio, [comunicaciones], rescatado).
jugador_nombre(alison).
partida_actual(17).
