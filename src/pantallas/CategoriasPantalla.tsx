import { useState } from 'react';
import { EstadoCarga, EstadoVacio } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarCategoriasPendientes, resolverCategoria } from '../nucleo/api/central';
import { mensajeDeError } from '../nucleo/api/cliente';
import { formatearFechaHora, NOMBRE_CATEGORIA } from '../utils/formato';

/** Estudiantes y exonerados que esperan verificación del carnet (§6.5). Mientras tanto pagan como general. */
export function CategoriasPantalla() {
  const { datos, setDatos, error, cargando, recargar } = useCarga(listarCategoriasPendientes);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const resolver = async (id: string, verificada: boolean) => {
    setProcesando(id);
    setErrorAccion(null);
    try {
      await resolverCategoria(id, verificada);
      setDatos((us) => us?.filter((u) => u.id !== id) ?? us);
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setProcesando(null);
    }
  };

  return (
    <>
      <Encabezado
        titulo="Categorías pendientes"
        subtitulo="Aprueba la categoría cuando el pasajero muestre su carnet. Si la rechazas, paga como general."
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
          <EstadoVacio icono="carnet" titulo="No hay nadie esperando revisión">
            <p>
              Aquí aparecen las personas que se registraron en la app como{' '}
              <strong>estudiantes</strong> o como{' '}
              <strong>adultos mayores o personas con discapacidad</strong>. Mientras nadie las
              revise, pagan el pasaje completo.
            </p>
            <ol>
              <li>Una persona se registra en la app y elige su categoría.</li>
              <li>Aparece en esta lista. Pídele que te muestre su carnet.</li>
              <li>
                Si el carnet es válido, toca <strong>Aprobar</strong> y empezará a pagar con
                descuento. Si no, toca <strong>Rechazar</strong> y seguirá pagando el pasaje
                completo.
              </li>
            </ol>
          </EstadoVacio>
        }
        onReintentar={() => void recargar()}
      >
        <section className="tarjeta sin-relleno">
          <table>
            <thead>
              <tr>
                <th>Pasajero</th>
                <th>Teléfono</th>
                <th>Categoría pedida</th>
                <th>Registrado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {datos?.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.telefono}</td>
                  <td>
                    <span className="etiqueta">
                      {u.categoria ? NOMBRE_CATEGORIA[u.categoria] : '—'}
                    </span>
                  </td>
                  <td className="suave">{u.creadoEn ? formatearFechaHora(u.creadoEn) : '—'}</td>
                  <td>
                    <div className="fila" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="boton peligro"
                        disabled={procesando === u.id}
                        onClick={() => void resolver(u.id, false)}
                      >
                        Rechazar
                      </button>
                      <button
                        className="boton"
                        disabled={procesando === u.id}
                        onClick={() => void resolver(u.id, true)}
                      >
                        Aprobar
                      </button>
                    </div>
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
