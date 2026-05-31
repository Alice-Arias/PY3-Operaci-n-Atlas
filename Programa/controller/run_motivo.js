// Script de prueba para consultar el motivo por el que no se puede entrar a un modulo.
// Se usa para verificar la respuesta de Prolog durante el desarrollo.

const { correrProlog } = require('./ejecutor_prolog');

const meta = "cargar_partida('data/partida_ali_5.sav'), motivo_no_puedo_ir(modulo_medico, M), format('~w', [M])";
const r = correrProlog(meta);
if (r.ok) console.log(r.out);
else console.error('ERROR:', r.err);
