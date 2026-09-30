import { useCallback, useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { obtenerResumen } from '../nucleo/api/central';
import type { Categoria } from '../nucleo/tipos';
import { formatearBs, NOMBRE_CATEGORIA } from '../utils/formato';
import estilos from './ResumenPantalla.module.css';

const PERIODOS = [
  { valor: 'hoy', texto: 'Hoy', dias: 0 },
  { valor: 'semana', texto: 'Últimos 7 días', dias: 6 },
  { valor: 'mes', texto: 'Últimos 30 días', dias: 29 },
] as const;

/** 00:00 de hace `dias` días en hora de Mérida (UTC-4), como ISO. */
function inicioHaceDias(dias: number) {
  const OFFSET_VE_MS = -4 * 3600 * 1000;
  const local = new Date(Date.now() + OFFSET_VE_MS - dias * 24 * 3600 * 1000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_VE_MS).toISOString();
}

/** Recaudado, cobros, pasajeros y recargas del periodo, por línea y por categoría (GET /central/resumen). */
export function ResumenPantalla() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]['valor']>('hoy');
  const dias = PERIODOS.find((p) => p.valor === periodo)!.dias;
  const cargar = useCallback(() => obtenerResumen(inicioHaceDias(dias)), [dias]);
  const { datos: r, error, cargando, recargar } = useCarga(cargar);

  return (
    <>
      <Encabezado
        titulo="Resumen"
        subtitulo="Lo cobrado en las unidades y lo recargado por los pasajeros"
        acciones={
          <>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value as typeof periodo)}>
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.texto}
                </option>
              ))}
            </select>
            <button className="boton secundario" onClick={() => void recargar()}>
              Actualizar
            </button>
          </>
        }
      />
      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!r}
        onReintentar={() => void recargar()}
      >
        {r && (
          <div className="pila">
            <div className={estilos.cifras}>
              <Cifra etiqueta="Recaudado" valor={formatearBs(r.recaudado)} destacada />
              <Cifra etiqueta="Cobros" valor={r.cobros.toLocaleString('es-VE')} />
              <Cifra etiqueta="Pasajeros" valor={r.pasajeros.toLocaleString('es-VE')} />
              <Cifra etiqueta="Recargado" valor={formatearBs(r.recargado)} />
            </div>

            <div className={estilos.dos}>
              <section className="tarjeta sin-relleno">
                <h3 className={estilos.titulo}>Por línea</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Línea</th>
                      <th className="numero">Cobros</th>
                      <th className="numero">Recaudado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.porLinea.map((l) => (
                      <tr key={l.lineaCodigo}>
                        <td>{l.lineaNombre}</td>
                        <td className="numero">{l.cobros}</td>
                        <td className="numero">{formatearBs(l.recaudado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="tarjeta sin-relleno">
                <h3 className={estilos.titulo}>Por categoría</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th className="numero">Cobros</th>
                      <th className="numero">Recaudado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(r.porCategoria) as Categoria[]).map((c) => (
                      <tr key={c}>
                        <td>{NOMBRE_CATEGORIA[c]}</td>
                        <td className="numero">{r.porCategoria[c].cobros}</td>
                        <td className="numero">{formatearBs(r.porCategoria[c].recaudado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        )}
      </EstadoCarga>
    </>
  );
}

function Cifra({
  etiqueta,
  valor,
  destacada,
}: {
  etiqueta: string;
  valor: string;
  destacada?: boolean;
}) {
  return (
    <div className={`tarjeta ${destacada ? estilos.destacada : ''}`}>
      <span className={estilos.etiqueta}>{etiqueta}</span>
      <strong className={estilos.valor}>{valor}</strong>
    </div>
  );
}
