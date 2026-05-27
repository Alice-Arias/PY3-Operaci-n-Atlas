const { correrProlog } = require('./ejecutor_prolog');
const meta = "cargar_partida('data/partida_ali_5.sav'), (mover(modulo_medico) -> format('MOVIDO') ; (motivo_no_puedo_ir(modulo_medico, M), format('MOTIVO: ~w', [M])))";
const r = correrProlog(meta);
if (r.ok) console.log(r.out);
else console.error('ERROR:', r.err);
