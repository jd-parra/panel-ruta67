import estilos from '../../componentes/Formulario.module.css';
import { SIN_TOPE, useFormularioTabulador } from '../../hooks/useFormularioTabulador';
import type { Categoria, Tabulador } from '../../nucleo/tipos';
import {
  formatearBs,
  formatearFechaHora,
  formatearPorcentaje,
  NOMBRE_CATEGORIA,
} from '../../utils/formato';

const CATEGORIAS = Object.keys(NOMBRE_CATEGORIA) as Categoria[];

interface Props {
  vigente: Tabulador | null;
  existentes: Tabulador[];
  alCrear: (t: Tabulador) => void;
  alCancelar: () => void;
}

/** Carga de una gaceta nueva (POST /central/tabuladores), con revisión antes de publicar. */
export function FormularioTabulador({ vigente, existentes, alCrear, alCancelar }: Props) {
  const f = useFormularioTabulador(vigente, existentes, alCrear);

  return (
    <form
      className={`tarjeta pila ${estilos.formulario}`}
      onSubmit={(ev) => {
        ev.preventDefault();
        if (f.revisando) void f.publicar();
        else f.revisar();
      }}
    >
      <div>
        <h2 className={estilos.titulo}>Nuevo tabulador</h2>
        <p className="suave">
          Carga los precios de una gaceta nueva. Empieza con los valores del vigente: cambia solo lo
          que cambió.
        </p>
      </div>

      {f.revisando && f.datos ? (
        <Revision datos={f.datos} vigente={vigente} yaEmpezo={f.yaEmpezo} />
      ) : (
        <>
          <fieldset className={estilos.grupo}>
            <legend>Gaceta</legend>
            <div className={estilos.campos}>
              <label className={estilos.campo} style={{ gridColumn: 'span 2' }}>
                Fuente
                <input
                  value={f.fuente}
                  onChange={(ev) => f.setFuente(ev.target.value)}
                  placeholder="Gaceta Oficial N° 43.210"
                  autoFocus
                />
                <span className={estilos.ayuda}>Gaceta o acuerdo del Concejo de donde salen</span>
              </label>
              <label className={estilos.campo}>
                Entra en vigor el
                <input type="date" value={f.fecha} onChange={(ev) => f.setFecha(ev.target.value)} />
              </label>
              <label className={estilos.campo}>
                A la hora
                <input type="time" value={f.hora} onChange={(ev) => f.setHora(ev.target.value)} />
                <span className={estilos.ayuda}>Hora de Venezuela</span>
              </label>
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Precios completos</legend>
            <div className={estilos.campos}>
              <label className={estilos.campo}>
                Pasaje urbano
                <ConSufijo sufijo="Bs" valor={f.urbano} alCambiar={f.setUrbano} placeholder="200" />
                <span className={estilos.ayuda}>Lo que paga un pasajero general en la ciudad</span>
              </label>
              <label className={estilos.campo}>
                Recargo domingo y feriado
                <ConSufijo sufijo="%" valor={f.recargo} alCambiar={f.setRecargo} placeholder="0" />
                <span className={estilos.ayuda}>0 si cuesta lo mismo todos los días</span>
              </label>
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Descuentos por categoría</legend>
            <div className={estilos.campos}>
              {CATEGORIAS.map((c) => (
                <label key={c} className={estilos.campo}>
                  {NOMBRE_CATEGORIA[c]}
                  <ConSufijo
                    sufijo="%"
                    valor={f.descuentos[c]}
                    alCambiar={(v) => f.setDescuento(c, v)}
                  />
                </label>
              ))}
            </div>
            <span className={estilos.ayuda}>
              Por ley: estudiantes 50 %; adultos mayores y personas con discapacidad 100 %.
            </span>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Escala suburbana</legend>
            <span className={estilos.ayuda}>
              Las líneas suburbanas cobran según los km de cada ruta. Ordena los rangos de menor a
              mayor; el último debería ser «sin tope» para que ninguna ruta quede sin precio.
            </span>
            <div className={estilos.tabla}>
              <table>
                <thead>
                  <tr>
                    <th>Hasta (km)</th>
                    <th>Monto completo</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {f.rangos.map((r, i) => {
                    const ultimo = i === f.rangos.length - 1;
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="fila">
                            {r.sinTope ? (
                              <span className="etiqueta">Sin tope</span>
                            ) : (
                              <ConSufijo
                                sufijo="km"
                                valor={r.hastaKm}
                                alCambiar={(v) => f.cambiarRango(r.id, { hastaKm: v })}
                                placeholder="10"
                              />
                            )}
                            {ultimo && (
                              <label className="suave fila" style={{ gap: 4, fontSize: 13 }}>
                                <input
                                  type="checkbox"
                                  checked={r.sinTope}
                                  onChange={(ev) =>
                                    f.cambiarRango(r.id, { sinTope: ev.target.checked })
                                  }
                                />
                                sin tope
                              </label>
                            )}
                          </div>
                        </td>
                        <td>
                          <ConSufijo
                            sufijo="Bs"
                            valor={r.monto}
                            alCambiar={(v) => f.cambiarRango(r.id, { monto: v })}
                            placeholder="280"
                          />
                        </td>
                        <td className="numero">
                          {f.rangos.length > 1 && (
                            <button
                              type="button"
                              className="boton peligro"
                              onClick={() => f.quitarRango(r.id)}
                            >
                              Quitar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <button type="button" className="boton secundario" onClick={f.agregarRango}>
                Agregar rango
              </button>
            </div>
          </fieldset>
        </>
      )}

      {f.error && <div className="aviso error">{f.error}</div>}

      <div className="fila">
        <span style={{ flex: 1 }} />
        {f.revisando ? (
          <>
            <button
              type="button"
              className="boton secundario"
              onClick={f.volverAEditar}
              disabled={f.guardando}
            >
              Volver a editar
            </button>
            <button type="submit" className="boton" disabled={f.guardando}>
              {f.guardando ? 'Publicando…' : 'Publicar tabulador'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="boton secundario" onClick={alCancelar}>
              Cancelar
            </button>
            <button type="submit" className="boton">
              Revisar
            </button>
          </>
        )}
      </div>
    </form>
  );
}

/** Resumen de lo que se va a publicar, marcando lo que cambia respecto al vigente. */
function Revision({
  datos,
  vigente,
  yaEmpezo,
}: {
  datos: Omit<Tabulador, 'id'>;
  vigente: Tabulador | null;
  yaEmpezo: boolean;
}) {
  const cambia = (antes: number | undefined, ahora: number) =>
    vigente && antes !== ahora ? <span className={estilos.cambio}> (cambia)</span> : null;

  return (
    <>
      <div className={estilos.revision}>
        <strong>{datos.fuente}</strong>
        <span className="suave">
          {yaEmpezo
            ? 'Entra en vigor de inmediato'
            : `Entra en vigor el ${formatearFechaHora(datos.vigenteDesde)}`}
        </span>
        <ul>
          <li>
            Pasaje urbano: <strong>{formatearBs(datos.urbanoMinimo)}</strong>
            {vigente && vigente.urbanoMinimo !== datos.urbanoMinimo && (
              <span className={estilos.cambio}> (antes {formatearBs(vigente.urbanoMinimo)})</span>
            )}
          </li>
          <li>
            Recargo domingo y feriado:{' '}
            <strong>{formatearPorcentaje(datos.recargoDomingoFeriado)}</strong>
            {cambia(vigente?.recargoDomingoFeriado, datos.recargoDomingoFeriado)}
          </li>
          {CATEGORIAS.map((c) => (
            <li key={c}>
              Descuento {NOMBRE_CATEGORIA[c].toLowerCase()}:{' '}
              <strong>{formatearPorcentaje(datos.descuentos[c])}</strong>
              {cambia(vigente?.descuentos[c], datos.descuentos[c])}
            </li>
          ))}
          {datos.suburbano.map((r, i) => (
            <li key={i}>
              Suburbano{' '}
              {r.hastaKm >= SIN_TOPE
                ? i === 0
                  ? 'cualquier distancia'
                  : `más de ${datos.suburbano[i - 1].hastaKm} km`
                : `hasta ${r.hastaKm} km`}
              : <strong>{formatearBs(r.monto)}</strong>
            </li>
          ))}
        </ul>
      </div>
      <div className="aviso" style={{ background: 'var(--aviso-claro)', color: '#78350f' }}>
        <strong>Antes de publicar:</strong> un tabulador{' '}
        <strong>no se puede borrar ni editar</strong>. Al publicarlo se avisa a todos los pasajeros
        del cambio de tarifa y los recolectores lo reciben solos. Si te equivocas, tendrás que
        publicar otro que lo reemplace.
      </div>
    </>
  );
}

function ConSufijo({
  sufijo,
  valor,
  alCambiar,
  placeholder,
}: {
  sufijo: string;
  valor: string;
  alCambiar: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={estilos.conSufijo}>
      <input
        value={valor}
        onChange={(ev) => alCambiar(ev.target.value.replace(/[^\d.,]/g, ''))}
        placeholder={placeholder}
        inputMode="decimal"
      />
      <span>{sufijo}</span>
    </div>
  );
}
