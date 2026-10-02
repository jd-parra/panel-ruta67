import { Selector } from '../../componentes/Selector';
import { useFormularioLinea } from '../../hooks/useFormularioLinea';
import type { Linea } from '../../nucleo/tipos';
import estilos from './EditorLinea.module.css';

/** Alta de una línea con sus rutas (POST /central/lineas). Los recolectores la reciben solos. */
export function FormularioLinea({
  lineas,
  alCrear,
  alCancelar,
}: {
  lineas: Linea[];
  alCrear: (l: Linea) => void;
  alCancelar: () => void;
}) {
  const f = useFormularioLinea(lineas, alCrear);

  return (
    <form
      className="tarjeta pila"
      onSubmit={(ev) => {
        ev.preventDefault();
        void f.crear();
      }}
    >
      <div>
        <h3 className={estilos.subtitulo}>Nueva línea</h3>
        <p className="suave" style={{ margin: '4px 0 0' }}>
          Una línea es un recorrido (p. ej. «Mérida – Tabay»). Sus rutas son los trayectos que se
          cobran, cada una con sus km.
        </p>
      </div>

      <div className={estilos.cabecera}>
        <label className={estilos.campo}>
          Nombre de la línea
          <input
            value={f.nombre}
            onChange={(ev) => f.setNombre(ev.target.value)}
            placeholder="Mérida – Tabay"
            autoFocus
          />
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
            valor={f.tipo}
            alCambiar={f.setTipo}
          />
        </label>
        <label className={estilos.campo}>
          Código
          <input
            className={estilos.corto}
            style={{ minWidth: 0, width: 90 }}
            value={f.codigo}
            onChange={(ev) => f.setCodigo(ev.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>

      <div>
        <h3 className={estilos.subtitulo}>Rutas</h3>
        <p className="suave">
          {f.tipo === 'urbana'
            ? 'Urbana: todas las rutas cobran el pasaje urbano del tabulador, salvo que les pongas un precio fijo.'
            : 'Suburbana: cada ruta cobra según sus km en la escala suburbana del tabulador, salvo que le pongas un precio fijo.'}
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
              <th />
            </tr>
          </thead>
          <tbody>
            {f.rutas.map((r) => (
              <tr key={r.codigo}>
                <td>{r.codigo}</td>
                <td>
                  <input
                    value={r.nombre}
                    onChange={(ev) => f.cambiarRuta(r.codigo, { nombre: ev.target.value })}
                    placeholder="Centro – Tabay"
                  />
                </td>
                <td>
                  <input
                    className={estilos.corto}
                    value={r.km}
                    onChange={(ev) => f.cambiarRuta(r.codigo, { km: ev.target.value })}
                    placeholder="8"
                    inputMode="decimal"
                  />
                </td>
                <td>
                  <input
                    className={estilos.corto}
                    value={r.precioFijo}
                    onChange={(ev) => f.cambiarRuta(r.codigo, { precioFijo: ev.target.value })}
                    placeholder="Según tabulador"
                    inputMode="decimal"
                  />
                </td>
                <td>
                  {f.rutas.length > 1 && (
                    <button
                      type="button"
                      className="boton peligro"
                      onClick={() => f.quitarRuta(r.codigo)}
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {f.error && <div className="aviso error">{f.error}</div>}

      <div className="fila">
        <button type="button" className="boton secundario" onClick={f.agregarRuta}>
          Agregar ruta
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="boton secundario"
          onClick={alCancelar}
          disabled={f.guardando}
        >
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={f.guardando}>
          {f.guardando ? 'Creando…' : 'Crear línea'}
        </button>
      </div>
    </form>
  );
}
