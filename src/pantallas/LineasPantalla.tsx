import { useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarLineas } from '../nucleo/api/central';
import type { Linea } from '../nucleo/tipos';
import { EditorLinea } from './lineas/EditorLinea';
import { FormularioLinea } from './lineas/FormularioLinea';
import estilos from './LineasPantalla.module.css';

/** Líneas y sus rutas (GET/POST/PUT /central/lineas). */
export function LineasPantalla() {
  const { datos: lineas, setDatos, error, cargando, recargar } = useCarga(listarLineas);
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const elegida = lineas?.find((l) => l.id === elegidaId) ?? lineas?.[0] ?? null;

  const reemplazar = (l: Linea) => setDatos((ls) => ls?.map((x) => (x.id === l.id ? l : x)) ?? ls);

  const alCrear = (l: Linea) => {
    setDatos((ls) => [...(ls ?? []), l]);
    setElegidaId(l.id);
    setCreando(false);
    setExito(
      `Línea «${l.nombre}» creada. Ya puedes asignarle unidades en la sección Unidades; sus recolectores la reciben solos.`,
    );
  };

  const elegir = (id: string) => {
    setCreando(false);
    setExito(null);
    setElegidaId(id);
  };

  return (
    <>
      <Encabezado
        titulo="Líneas y rutas"
        subtitulo="Los recorridos, sus rutas (con km) y los precios fijos"
        acciones={
          <button
            className="boton"
            onClick={() => {
              setExito(null);
              setCreando(true);
            }}
            disabled={creando || !lineas}
          >
            + Nueva línea
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

      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!lineas?.length && !creando}
        mensajeVacio="Todavía no hay líneas. Crea la primera con «Nueva línea»."
        onReintentar={() => void recargar()}
      >
        <div className={estilos.distribucion}>
          <nav className={`tarjeta sin-relleno ${estilos.lista}`}>
            {lineas?.map((l) => (
              <button
                key={l.id}
                className={`${estilos.item} ${!creando && l.id === elegida?.id ? estilos.activa : ''}`}
                onClick={() => elegir(l.id)}
              >
                <strong>{l.nombre}</strong>
                <span className="suave">
                  {l.tipo === 'urbana' ? 'Urbana' : 'Suburbana'} · {l.tramos.length}{' '}
                  {l.tramos.length === 1 ? 'ruta' : 'rutas'}
                </span>
              </button>
            ))}
            {creando && (
              <div className={`${estilos.item} ${estilos.activa}`}>
                <strong>Nueva línea</strong>
                <span className="suave">Sin guardar</span>
              </div>
            )}
          </nav>
          {creando ? (
            <FormularioLinea
              lineas={lineas ?? []}
              alCrear={alCrear}
              alCancelar={() => setCreando(false)}
            />
          ) : (
            elegida && <EditorLinea key={elegida.id} linea={elegida} alGuardar={reemplazar} />
          )}
        </div>
      </EstadoCarga>
    </>
  );
}
