import type { ReactNode } from 'react';
import { Icono, type NombreIcono } from './Icono';
import estilos from './Estados.module.css';

/** Cargando / error con reintento / vacío: lo común de cada pantalla que pide datos. */
export function EstadoCarga({
  cargando,
  error,
  vacio,
  mensajeVacio = 'No hay nada que mostrar.',
  contenidoVacio,
  onReintentar,
  children,
}: {
  cargando: boolean;
  error: string | null;
  vacio?: boolean;
  mensajeVacio?: string;
  /** Reemplaza al `mensajeVacio` (p. ej. un <EstadoVacio> que explica qué aparecerá aquí). */
  contenidoVacio?: ReactNode;
  onReintentar?: () => void;
  children: ReactNode;
}) {
  if (error) {
    return (
      <div className="aviso error fila">
        <span>{error}</span>
        {onReintentar && (
          <button className="boton secundario" onClick={onReintentar}>
            Reintentar
          </button>
        )}
      </div>
    );
  }
  if (cargando && vacio !== false) return <p className="suave">Cargando…</p>;
  if (vacio) return contenidoVacio ?? <p className="suave">{mensajeVacio}</p>;
  return <>{children}</>;
}

/**
 * Pantalla sin datos, explicada para cualquier persona: qué es esta sección,
 * cuándo aparecerá algo aquí y qué hay que hacer entonces.
 */
export function EstadoVacio({
  icono,
  titulo,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className={`tarjeta ${estilos.vacio}`}>
      <div className={estilos.icono}>
        <Icono nombre={icono} tamano={30} />
      </div>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <div className={estilos.texto}>{children}</div>
    </section>
  );
}
