import { useMemo, useState } from 'react';
import { useEditorLinea } from '../../hooks/useEditorLinea';
import type { Linea } from '../../nucleo/tipos';
import { formatearBs } from '../../utils/formato';
import estilos from './EditorLinea.module.css';
import { MapaRuta } from './MapaRuta';

/** Formulario de una línea y sus rutas. Los recolectores reciben los cambios solos (paquete:actualizado). */
export function EditorLinea({ linea, alGuardar }: { linea: Linea; alGuardar: (l: Linea) => void }) {
  const e = useEditorLinea(linea, alGuardar);
  const [trazando, setTrazando] = useState<number | null>(null);
  const rutaTrazo = e.rutas.find((r) => r.codigo === trazando) ?? null;
  const otros = useMemo(
    () =>
      e.rutas
        .filter((r) => r.codigo !== trazando)
        .map((r) => ({ nombre: r.nombre || `Ruta ${r.codigo}`, trazo: r.trazo })),
    [e.rutas, trazando],
  );

  return (
    <section className="tarjeta pila">
      <div className={estilos.cabecera}>
        <label className={estilos.campo}>
          Nombre de la línea
          <input value={e.nombre} onChange={(ev) => e.setNombre(ev.target.value)} />
        </label>
        <label className={estilos.campo}>
          Tipo
          <select value={e.tipo} onChange={(ev) => e.setTipo(ev.target.value as Linea['tipo'])}>
            <option value="urbana">Urbana</option>
            <option value="suburbana">Suburbana</option>
          </select>
        </label>
        <span className="suave">Código {linea.codigo}</span>
      </div>

      <div>
        <h3 className={estilos.subtitulo}>Rutas</h3>
        <p className="suave">
          Sin precio fijo, la ruta cobra según el tabulador vigente
          {e.tipo === 'urbana' ? ' (urbano mínimo)' : ' (escala suburbana por km)'}. Las rutas no se
          borran para no perder el historial de cobros.
        </p>
      </div>

      <div className={estilos.tabla}>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Km</th>
              <th>Precio fijo (Bs)</th>
              <th className="numero">Tarifa general</th>
              <th>Mapa</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {e.rutas.map((r) => (
              <tr key={r.codigo}>
                <td>
                  {r.codigo} {r.nueva && <span className="etiqueta">Nueva</span>}
                </td>
                <td>
                  <input
                    value={r.nombre}
                    onChange={(ev) => e.cambiarRuta(r.codigo, { nombre: ev.target.value })}
                    placeholder="Centro – …"
                  />
                </td>
                <td>
                  <input
                    className={estilos.corto}
                    value={r.km}
                    onChange={(ev) => e.cambiarRuta(r.codigo, { km: ev.target.value })}
                    inputMode="decimal"
                  />
                </td>
                <td>
                  <input
                    className={estilos.corto}
                    value={r.precioFijo}
                    onChange={(ev) => e.cambiarRuta(r.codigo, { precioFijo: ev.target.value })}
                    placeholder="Según tabulador"
                    inputMode="decimal"
                  />
                </td>
                <td className="numero">
                  {r.tarifaCompleta != null ? (
                    formatearBs(r.tarifaCompleta)
                  ) : (
                    <span className="suave">—</span>
                  )}
                </td>
                <td>
                  <button
                    className={`boton ${trazando === r.codigo ? '' : 'secundario'}`}
                    onClick={() => setTrazando(trazando === r.codigo ? null : r.codigo)}
                  >
                    {r.trazo.length || r.paradas.length
                      ? `Editar mapa (${r.paradas.length} paradas)`
                      : 'Trazar en el mapa'}
                  </button>
                </td>
                <td>
                  {r.nueva && (
                    <button className="boton peligro" onClick={() => e.quitarNueva(r.codigo)}>
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rutaTrazo && (
        <MapaRuta
          key={`${linea.id}-${rutaTrazo.codigo}`}
          ruta={rutaTrazo}
          otros={otros}
          onCambiar={(cambios) => e.cambiarRuta(rutaTrazo.codigo, cambios)}
          onCerrar={() => setTrazando(null)}
        />
      )}

      {e.error && <div className="aviso error">{e.error}</div>}
      {e.guardado && !e.hayCambios && (
        <div className="aviso exito">Guardado. Los recolectores ya tienen los cambios.</div>
      )}

      <div className="fila">
        <button className="boton secundario" onClick={e.agregarRuta}>
          Agregar ruta
        </button>
        <span style={{ flex: 1 }} />
        <button
          className="boton secundario"
          onClick={e.descartar}
          disabled={!e.hayCambios || e.guardando}
        >
          Descartar
        </button>
        <button
          className="boton"
          onClick={() => void e.guardar()}
          disabled={!e.hayCambios || e.guardando}
        >
          {e.guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </section>
  );
}
