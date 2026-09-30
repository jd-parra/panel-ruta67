import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarUnidades } from '../nucleo/api/central';

/** Unidades con su línea y su recolector (GET /central/unidades). Crear unidades llega en el siguiente paso. */
export function UnidadesPantalla() {
  const { datos, error, cargando, recargar } = useCarga(listarUnidades);
  const lista = [...(datos ?? [])].sort((a, b) => a.codigo - b.codigo);

  return (
    <>
      <Encabezado
        titulo="Unidades"
        subtitulo="Autobuses, su línea y el recolector que cobra en cada uno"
      />
      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!lista.length}
        mensajeVacio="No hay unidades registradas."
        onReintentar={() => void recargar()}
      >
        <section className="tarjeta sin-relleno">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Placa</th>
                <th>Línea</th>
                <th>Recolector</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td>{u.codigo}</td>
                  <td>
                    <strong>{u.placa}</strong>
                  </td>
                  <td>{u.lineaNombre}</td>
                  <td>{u.recolector?.nombre ?? <span className="suave">Sin asignar</span>}</td>
                  <td className="suave">{u.recolector?.telefono ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </EstadoCarga>
    </>
  );
}
