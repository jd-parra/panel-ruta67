import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Icono } from '../componentes/Icono';
import { MapaLeaflet, type TrazoRuta } from '../componentes/MapaLeaflet';
import { useCarga } from '../hooks/useCarga';
import { useUnidadesMapa } from '../hooks/useUnidadesMapa';
import { listarLineas } from '../nucleo/api/central';
import estilos from './MapaPantalla.module.css';

/** Unidades en ruta en tiempo real (recolectores con «En turno» activo) y el recorrido de cada ruta. */
export function MapaPantalla() {
  const { unidades, error, recargar } = useUnidadesMapa();
  const { datos: lineas } = useCarga(listarLineas);
  const trazos = useMemo<TrazoRuta[]>(
    () =>
      (lineas ?? []).flatMap((l) =>
        l.tramos
          .filter((t) => (t.trazo?.length ?? 0) > 1 || (t.paradas?.length ?? 0) > 0)
          .map((t) => ({
            clave: `${l.id}-${t.codigo}`,
            lineaNombre: l.nombre,
            tramoNombre: t.nombre,
            trazo: t.trazo ?? [],
            paradas: t.paradas ?? [],
          })),
      ),
    [lineas],
  );
  const cantidad = unidades
    ? `${unidades.length} ${unidades.length === 1 ? 'unidad en ruta' : 'unidades en ruta'}`
    : 'Buscando unidades…';

  return (
    <>
      <Encabezado
        titulo="Mapa"
        subtitulo={cantidad}
        acciones={
          <button className="boton secundario" onClick={() => void recargar()}>
            Actualizar
          </button>
        }
      />
      {error && (
        <div className="aviso error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className={estilos.marco}>
        <MapaLeaflet unidades={unidades ?? []} trazos={trazos} />
        <EstadoMapa
          sinUnidades={unidades?.length === 0}
          sinRecorridos={!!lineas && !trazos.length}
        />
      </div>
    </>
  );
}

/**
 * Tarjeta flotante sobre el mapa que explica por qué está vacío.
 * Se puede cerrar; un botón pequeño la vuelve a mostrar.
 */
function EstadoMapa({
  sinUnidades,
  sinRecorridos,
}: {
  sinUnidades: boolean;
  sinRecorridos: boolean;
}) {
  const [visible, setVisible] = useState(true);
  if (!sinUnidades && !sinRecorridos) return null;

  if (!visible) {
    return (
      <button className={estilos.mostrar} onClick={() => setVisible(true)}>
        <Icono nombre="bus" tamano={16} />
        Ver avisos
      </button>
    );
  }

  return (
    <aside className={estilos.estado} aria-label="Avisos del mapa">
      <button
        className={estilos.cerrar}
        onClick={() => setVisible(false)}
        aria-label="Ocultar avisos"
        title="Ocultar"
      >
        <Icono nombre="cerrar" tamano={16} />
      </button>

      {sinUnidades && (
        <div className={estilos.fila}>
          <span className={estilos.icono}>
            <Icono nombre="bus" />
          </span>
          <span className={estilos.textos}>
            <strong>Ningún autobús en ruta</strong>
            Aparecen aquí cuando un recolector activa «En turno» en la app.
          </span>
        </div>
      )}

      {sinRecorridos && (
        <div className={estilos.fila}>
          <span className={estilos.icono}>
            <Icono nombre="ruta" />
          </span>
          <span className={estilos.textos}>
            <strong>Sin recorridos marcados</strong>
            Dibuja por dónde pasa cada ruta para verla en el mapa.
            <Link to="/lineas" className={estilos.enlace}>
              Marcar recorridos <Icono nombre="derecha" tamano={14} />
            </Link>
          </span>
        </div>
      )}
    </aside>
  );
}
