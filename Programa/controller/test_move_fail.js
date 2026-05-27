const { correrProlog } = require('./ejecutor_prolog');
const meta = "cargar_partida('data/partida_ali_5.sav'), (mover(centro_comunicaciones) -> format('MOVIDO') ; (motivo_no_puedo_ir(centro_comunicaciones, M), format('MOTIVO: ~w', [M])))";
const r = correrProlog(meta);
if (r.ok) console.log('OK:', r.out);
else console.error('ERR:', r.err);
