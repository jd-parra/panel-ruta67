import { useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarLineas, listarRecolectores, listarUnidades } from '../nucleo/api/central';
import type { Unidad } from '../nucleo/tipos';
import { FormularioUnidad } from './unidades/FormularioUnidad';

/** Formulario abierto: `unidad: null` es una unidad nueva. */
type Formulario = { unidad: Unidad | null } | null;

/**
 * Unidades con su línea y su recolector (GET /central/unidades).
 * Desde aquí la central da de alta autobuses y crea las cuentas de los recolectores.
 */
export function UnidadesPantalla() {
  const unidades = useCarga(listarUnidades);
  const lineas = useCarga(listarLineas);
  const recolectores = useCarga(listarRecolectores);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [exito, setExito] = useState<string | null>(null);

  const lista = [...(unidades.datos ?? [])].sort((a, b) => a.codigo - b.codigo);
  // El formulario necesita las líneas y los recolectores para sus listas.
  const listoParaFormulario = lineas.datos !== null && recolectores.datos !== null;

  const abrir = (unidad: Unidad | null) => {
    setExito(null);
    setFormulario({ unidad });
  };

  const alGuardar = (_: Unidad, mensaje: string) => {
    setFormulario(null);
    setExito(mensaje);
    // Se recargan las dos listas: la unidad nueva y qué recolectores quedaron libres.
    void unidades.recargar();
    void recolectores.recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Unidades"
        subtitulo="Autobuses, su línea y el recolector que cobra en cada uno"
        acciones={
          <button
            className="boton"
            onClick={() => abrir(null)}
            disabled={!listoParaFormulario || formulario?.unidad === null}
          >
            + Nueva unidad
          </button>
        }
      />

      {exito && (
        <div className="aviso exito fila" style={{ marginBottom: 16 }}>
          <span style={{ flex: 1 }}>{exito}</span>
          <button className="boton secundario" onClick={() => setExito(null)}>
            Cerrar
          </button>
        </div>
      )}

      {(lineas.error || recolectores.error) && (
        <div className="aviso error" style={{ marginBottom: 16 }}>
          No se pudieron cargar las líneas o los recolectores: {lineas.error ?? recolectores.error}
        </div>
      )}

      {formulario && listoParaFormulario && (
        <FormularioUnidad
          // key: al cambiar de unidad el formulario empieza de cero.
          key={formulario.unidad?.id ?? 'nueva'}
          unidad={formulario.unidad}
          unidades={lista}
          lineas={lineas.datos!}
          recolectores={recolectores.datos!}
          alGuardar={alGuardar}
          alCancelar={() => setFormulario(null)}
        />
      )}

      <EstadoCarga
        cargando={unidades.cargando}
        error={unidades.error}
        vacio={!lista.length}
        mensajeVacio="No hay unidades registradas. Crea la primera con «Nueva unidad»."
        onReintentar={() => void unidades.recargar()}
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
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((u) => (
                <tr
                  key={u.id}
                  style={
                    formulario?.unidad?.id === u.id
                      ? { background: 'var(--primario-claro)' }
                      : undefined
                  }
                >
                  <td>{u.codigo}</td>
                  <td>
                    <strong>{u.placa}</strong>
                  </td>
                  <td>{u.lineaNombre}</td>
                  <td>{u.recolector?.nombre ?? <span className="etiqueta">Sin asignar</span>}</td>
                  <td className="suave">{u.recolector?.telefono ?? '—'}</td>
                  <td className="numero">
                    <button
                      className="boton secundario"
                      onClick={() => abrir(u)}
                      disabled={!listoParaFormulario}
                    >
                      Editar
                    </button>
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
