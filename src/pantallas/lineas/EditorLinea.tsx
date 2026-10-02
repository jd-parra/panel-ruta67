import { useMemo, useState } from 'react';
import { EditorTrazo } from '../../componentes/EditorTrazo';
import { useEditorLinea } from '../../hooks/useEditorLinea';
import { Selector } from '../../componentes/Selector';
import type { Linea } from '../../nucleo/tipos';
import { formatearBs } from '../../utils/formato';
import estilos from './EditorLinea.module.css';

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
          <Selector<Linea['tipo']>
            etiqueta="Tipo"
            opciones={[
              { valor: 'urbana', texto: 'Urbana', detalle: 'Pasaje urbano en todas las rutas' },
              {
                valor: 'suburbana',
                texto: 'Suburbana',
                detalle: 'Cobra según los km de cada ruta',
              },
            ]}
            valor={e.tipo}
            alCambiar={e.setTipo}
          />
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
              <th>Recorrido</th>
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
                    {r.trazo.length ? `Editar (${r.trazo.length} puntos)` : 'Trazar en el mapa'}
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
        <div className="pila">
          <div className="fila">
            <div>
              <h3 className={estilos.subtitulo}>
                Recorrido de {rutaTrazo.nombre || `la ruta ${rutaTrazo.codigo}`}
              </h3>
              <p className="suave">
                Haz clic en el mapa para marcar el camino en orden, desde el inicio. Arrastra un
                punto para moverlo y haz clic derecho para quitarlo. Las otras rutas de la línea se
                ven en gris.
              </p>
            </div>
            <span style={{ flex: 1 }} />
            <button
              className="boton secundario"
              onClick={() =>
                e.cambiarRuta(rutaTrazo.codigo, { trazo: rutaTrazo.trazo.slice(0, -1) })
              }
              disabled={!rutaTrazo.trazo.length}
            >
              Deshacer punto
            </button>
            <button
              className="boton peligro"
              onClick={() => e.cambiarRuta(rutaTrazo.codigo, { trazo: [] })}
              disabled={!rutaTrazo.trazo.length}
            >
              Borrar recorrido
            </button>
            <button className="boton secundario" onClick={() => setTrazando(null)}>
              Cerrar mapa
            </button>
          </div>
          <EditorTrazo
            key={`${linea.id}-${rutaTrazo.codigo}`}
            trazo={rutaTrazo.trazo}
            otros={otros}
            onChange={(trazo) => e.cambiarRuta(rutaTrazo.codigo, { trazo })}
          />
        </div>
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
