import { useCallback, useState } from 'react';
import { EstadoCarga, EstadoVacio } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { cambiarBloqueo, listarConflictos } from '../nucleo/api/central';
import { mensajeDeError } from '../nucleo/api/cliente';
import type { Conflicto } from '../nucleo/tipos';
import { formatearBs, formatearFechaHora } from '../utils/formato';

const uso = (c: Conflicto['cobroOriginal']) =>
  `Unidad ${c.unidadCodigo} · ${c.recolectorNombre} · ${formatearBs(c.monto)} · ${formatearFechaHora(c.ocurridoEn)}`;

/**
 * Boletos usados dos veces (doble gasto, §8.4). La cuenta del pasajero queda bloqueada;
 * desbloquearla marca sus conflictos como resueltos.
 */
export function ConflictosPantalla() {
  const [todos, setTodos] = useState(false);
  const cargar = useCallback(() => listarConflictos(todos), [todos]);
  const { datos, error, cargando, recargar } = useCarga(cargar);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const desbloquear = async (pasajeroId: string) => {
    setProcesando(pasajeroId);
    setErrorAccion(null);
    try {
      await cambiarBloqueo(pasajeroId, false);
      await recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setProcesando(null);
    }
  };

  return (
    <>
      <Encabezado
        titulo="Conflictos"
        subtitulo="Boletos cobrados dos veces. El pasajero queda bloqueado hasta que lo revises."
        acciones={
          <label className="fila">
            <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
            Ver también los resueltos
          </label>
        }
      />
      {errorAccion && (
        <div className="aviso error" style={{ marginBottom: 16 }}>
          {errorAccion}
        </div>
      )}
      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!datos?.length}
        contenidoVacio={
          todos ? (
            <EstadoVacio icono="escudo" titulo="Nunca ha habido un conflicto">
              <p>Nadie ha intentado pagar dos veces con el mismo boleto.</p>
            </EstadoVacio>
          ) : (
            <EstadoVacio icono="escudo" titulo="Todo en orden">
              <p>
                Aquí aparece cuando alguien intenta{' '}
                <strong>pagar dos veces con el mismo boleto</strong> en autobuses distintos (por
                ejemplo, copiándolo). Es una posible trampa.
              </p>
              <ol>
                <li>
                  El sistema acepta el primer pago y <strong>bloquea la cuenta</strong> de esa
                  persona: no podrá volver a pagar hasta que la revises.
                </li>
                <li>Aquí verás los dos usos: en qué autobús, quién cobró, cuánto y a qué hora.</li>
                <li>
                  Si fue un error, toca <strong>Desbloquear</strong> y la persona podrá volver a
                  pagar. Si fue trampa, déjala bloqueada.
                </li>
              </ol>
            </EstadoVacio>
          )
        }
        onReintentar={() => void recargar()}
      >
        <section className="tarjeta sin-relleno">
          <table>
            <thead>
              <tr>
                <th>Pasajero</th>
                <th>Primer cobro</th>
                <th>Segundo uso</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {datos?.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.pasajero.nombre}
                    <div className="suave">{c.pasajero.telefono}</div>
                  </td>
                  <td>{uso(c.cobroOriginal)}</td>
                  <td>{uso(c.segundoUso)}</td>
                  <td>
                    {c.resuelto ? (
                      <span className="etiqueta exito">Resuelto</span>
                    ) : c.pasajero.bloqueado ? (
                      <span className="etiqueta error">Cuenta bloqueada</span>
                    ) : (
                      <span className="etiqueta">Pendiente</span>
                    )}
                  </td>
                  <td>
                    {!c.resuelto && c.pasajero.bloqueado && (
                      <button
                        className="boton secundario"
                        disabled={procesando === c.pasajero.id}
                        onClick={() => void desbloquear(c.pasajero.id)}
                      >
                        Desbloquear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </EstadoCarga>
    </>
  );
}
