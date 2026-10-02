import { useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarLineas } from '../nucleo/api/central';
import type { Linea } from '../nucleo/tipos';
import { EditorLinea } from './lineas/EditorLinea';
import estilos from './LineasPantalla.module.css';

/** Líneas y sus rutas (GET/PUT /central/lineas). */
export function LineasPantalla() {
  const { datos: lineas, setDatos, error, cargando, recargar } = useCarga(listarLineas);
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const elegida = lineas?.find((l) => l.id === elegidaId) ?? lineas?.[0] ?? null;

  const reemplazar = (l: Linea) => setDatos((ls) => ls?.map((x) => (x.id === l.id ? l : x)) ?? ls);

  return (
    <>
      <Encabezado
        titulo="Líneas y rutas"
        subtitulo="Nombre, tipo, rutas y precios fijos de cada línea"
      />
      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!lineas?.length}
        mensajeVacio="Todavía no hay líneas."
        onReintentar={() => void recargar()}
      >
        <div className={estilos.distribucion}>
          <nav className={`tarjeta sin-relleno ${estilos.lista}`}>
            {lineas?.map((l) => (
              <button
                key={l.id}
                className={`${estilos.item} ${l.id === elegida?.id ? estilos.activa : ''}`}
                onClick={() => setElegidaId(l.id)}
              >
                <strong>{l.nombre}</strong>
                <span className="suave">
                  {l.tipo === 'urbana' ? 'Urbana' : 'Suburbana'} · {l.tramos.length}{' '}
                  {l.tramos.length === 1 ? 'ruta' : 'rutas'}
                </span>
              </button>
            ))}
          </nav>
          {elegida && <EditorLinea key={elegida.id} linea={elegida} alGuardar={reemplazar} />}
        </div>
      </EstadoCarga>
    </>
  );
}
