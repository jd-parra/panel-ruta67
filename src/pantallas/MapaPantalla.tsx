import { Encabezado } from '../componentes/Encabezado';
import { MapaLeaflet } from '../componentes/MapaLeaflet';
import { useUnidadesMapa } from '../hooks/useUnidadesMapa';

/** Unidades en ruta en tiempo real (recolectores con «En turno» activo). */
export function MapaPantalla() {
  const { unidades, error, recargar } = useUnidadesMapa();
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
      <MapaLeaflet unidades={unidades ?? []} />
    </>
  );
}
