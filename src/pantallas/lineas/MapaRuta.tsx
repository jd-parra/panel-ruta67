import { useState } from 'react';
import { EditorTrazo, type ModoEditor } from '../../componentes/EditorTrazo';
import type { RutaEditable } from '../../hooks/useEditorLinea';
import type { Parada } from '../../nucleo/tipos';
import estilos from './EditorLinea.module.css';

interface Props {
  ruta: RutaEditable;
  otros: { nombre: string; trazo: [number, number][] }[];
  onCambiar: (cambios: Partial<RutaEditable>) => void;
  onCerrar: () => void;
}

const AYUDA: Record<ModoEditor, string> = {
  recorrido:
    'Marca el camino con clics, en orden desde el inicio. Para seguir una curva, arrastra el punto claro que hay entre dos puntos. Estos puntos solo dan la forma: no son paradas. Clic derecho quita un punto.',
  paradas:
    'Haz clic donde para la unidad, en orden de recorrido, y ponle nombre abajo. Arrastra una parada para moverla; clic derecho la quita.',
};

/** Recorrido (forma del camino) y paradas de una ruta, sobre el mapa. Se guardan con la línea. */
export function MapaRuta({ ruta, otros, onCambiar, onCerrar }: Props) {
  const [modo, setModo] = useState<ModoEditor>('recorrido');
  const cambiarParada = (i: number, cambios: Partial<Parada>) =>
    onCambiar({ paradas: ruta.paradas.map((p, j) => (j === i ? { ...p, ...cambios } : p)) });

  return (
    <div className="pila">
      <div className="fila">
        <h3 className={estilos.subtitulo}>{ruta.nombre || `Ruta ${ruta.codigo}`} en el mapa</h3>
        <span style={{ flex: 1 }} />
        <div className={estilos.modos} role="tablist">
          {(['recorrido', 'paradas'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              className={`boton ${modo === m ? '' : 'secundario'}`}
              onClick={() => setModo(m)}
            >
              {m === 'recorrido'
                ? `Recorrido (${ruta.trazo.length} puntos)`
                : `Paradas (${ruta.paradas.length})`}
            </button>
          ))}
        </div>
        <button className="boton secundario" onClick={onCerrar}>
          Cerrar mapa
        </button>
      </div>

      <p className="suave">{AYUDA[modo]} Las otras rutas de la línea se ven en gris.</p>

      {modo === 'recorrido' && (
        <div className="fila">
          <button
            className="boton secundario"
            onClick={() => onCambiar({ trazo: ruta.trazo.slice(0, -1) })}
            disabled={!ruta.trazo.length}
          >
            Deshacer último punto
          </button>
          <button
            className="boton peligro"
            onClick={() => onCambiar({ trazo: [] })}
            disabled={!ruta.trazo.length}
          >
            Borrar recorrido
          </button>
        </div>
      )}

      <EditorTrazo
        modo={modo}
        trazo={ruta.trazo}
        paradas={ruta.paradas}
        otros={otros}
        onTrazo={(trazo) => onCambiar({ trazo })}
        onParadas={(paradas) => onCambiar({ paradas })}
      />

      {modo === 'paradas' && (
        <ol className={estilos.paradas}>
          {ruta.paradas.map((p, i) => (
            <li key={i}>
              <span className={estilos.numeroParada}>{i + 1}</span>
              <input
                value={p.nombre}
                onChange={(ev) => cambiarParada(i, { nombre: ev.target.value })}
                placeholder="Nombre de la parada"
                maxLength={60}
              />
              <button
                className="boton peligro"
                onClick={() => onCambiar({ paradas: ruta.paradas.filter((_, j) => j !== i) })}
              >
                Quitar
              </button>
            </li>
          ))}
          {!ruta.paradas.length && <li className="suave">Aún no hay paradas.</li>}
        </ol>
      )}
    </div>
  );
}
