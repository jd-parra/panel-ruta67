import { useMemo } from 'react';
import { Encabezado } from '../componentes/Encabezado';
import { MapaLeaflet, type TrazoRuta } from '../componentes/MapaLeaflet';
import { useCarga } from '../hooks/useCarga';
import { useUnidadesMapa } from '../hooks/useUnidadesMapa';
import { listarLineas } from '../nucleo/api/central';

/** Unidades en ruta en tiempo real (recolectores con «En turno» activo) y el recorrido de cada ruta. */
export function MapaPantalla() {
  const { unidades, error, recargar } = useUnidadesMapa();
  const { datos: lineas } = useCarga(listarLineas);
  const trazos = useMemo<TrazoRuta[]>(
    () =>
      (lineas ?? []).flatMap((l) =>
        l.tramos
          .filter((t) => (t.trazo?.length ?? 0) > 1)
          .map((t) => ({
            clave: `${l.id}-${t.codigo}`,
            lineaNombre: l.nombre,
            tramoNombre: t.nombre,
            trazo: t.trazo!,
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
      {unidades?.length === 0 && (
        <div className="aviso" style={{ marginBottom: 16 }}>
          No hay unidades en ruta. Aparecerán cuando un recolector active «En turno» en la app.
        </div>
      )}
      {lineas && !trazos.length && (
        <div className="aviso" style={{ marginBottom: 16 }}>
          Ninguna ruta tiene recorrido todavía. Márcalo en Líneas y rutas → «Trazar en el mapa».
        </div>
      )}
      <MapaLeaflet unidades={unidades ?? []} trazos={trazos} />
    </>
  );
}
