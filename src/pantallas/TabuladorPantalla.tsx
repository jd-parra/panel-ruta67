import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarTabuladores } from '../nucleo/api/central';
import type { Categoria, Tabulador } from '../nucleo/tipos';
import {
  formatearBs,
  formatearFechaHora,
  formatearPorcentaje,
  NOMBRE_CATEGORIA,
} from '../utils/formato';

/** El vigente es el último que ya empezó; los que empiezan después son "próximos". */
function estadoDe(t: Tabulador, lista: Tabulador[]) {
  const ahora = Date.now();
  if (Date.parse(t.vigenteDesde) > ahora) return { texto: 'Próximo', clase: '' };
  const vigente = lista
    .filter((x) => Date.parse(x.vigenteDesde) <= ahora)
    .sort((a, b) => Date.parse(b.vigenteDesde) - Date.parse(a.vigenteDesde))[0];
  return vigente?.id === t.id
    ? { texto: 'Vigente', clase: 'exito' }
    : { texto: 'Anterior', clase: '' };
}

/** Tabuladores de la gaceta (GET /central/tabuladores). Crear uno nuevo llega en el siguiente paso. */
export function TabuladorPantalla() {
  const { datos, error, cargando, recargar } = useCarga(listarTabuladores);
  const lista = [...(datos ?? [])].sort(
    (a, b) => Date.parse(b.vigenteDesde) - Date.parse(a.vigenteDesde),
  );

  return (
    <>
      <Encabezado
        titulo="Tabulador"
        subtitulo="Tarifas por gaceta: urbano mínimo, escala suburbana y descuentos"
      />
      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!lista.length}
        mensajeVacio="No hay tabuladores."
        onReintentar={() => void recargar()}
      >
        <div className="pila">
          {lista.map((t) => {
            const estado = estadoDe(t, lista);
            return (
              <section key={t.id} className="tarjeta pila">
                <div className="fila">
                  <h3 style={{ fontSize: 17 }}>{t.fuente}</h3>
                  <span className={`etiqueta ${estado.clase}`}>{estado.texto}</span>
                  <span className="suave">desde {formatearFechaHora(t.vigenteDesde)}</span>
                </div>
                <div className="fila" style={{ gap: 32, alignItems: 'flex-start' }}>
                  <Dato titulo="Urbano mínimo" valor={formatearBs(t.urbanoMinimo)} />
                  <Dato
                    titulo="Recargo domingo/feriado"
                    valor={formatearPorcentaje(t.recargoDomingoFeriado)}
                  />
                  <div>
                    <span className="suave">Descuentos</span>
                    {(Object.keys(NOMBRE_CATEGORIA) as Categoria[]).map((c) => (
                      <div key={c}>
                        {NOMBRE_CATEGORIA[c]}:{' '}
                        <strong>{formatearPorcentaje(t.descuentos[c])}</strong>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="suave">Escala suburbana</span>
                    {t.suburbano.map((r, i) => (
                      <div key={i}>
                        {r.hastaKm >= 9999
                          ? 'Más de ' + t.suburbano[i - 1]?.hastaKm
                          : `Hasta ${r.hastaKm}`}{' '}
                        km: <strong>{formatearBs(r.monto)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </EstadoCarga>
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <span className="suave">{titulo}</span>
      <div>
        <strong style={{ fontSize: 20 }}>{valor}</strong>
      </div>
    </div>
  );
}
