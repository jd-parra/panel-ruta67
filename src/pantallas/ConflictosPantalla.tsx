import { useCallback, useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
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
        mensajeVacio="No hay conflictos pendientes."
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
