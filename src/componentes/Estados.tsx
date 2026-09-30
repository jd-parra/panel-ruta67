import type { ReactNode } from 'react';

/** Cargando / error con reintento / vacío: lo común de cada pantalla que pide datos. */
export function EstadoCarga({
  cargando,
  error,
  vacio,
  mensajeVacio = 'No hay nada que mostrar.',
  onReintentar,
  children,
}: {
  cargando: boolean;
  error: string | null;
  vacio?: boolean;
  mensajeVacio?: string;
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
  if (vacio) return <p className="suave">{mensajeVacio}</p>;
  return <>{children}</>;
}
