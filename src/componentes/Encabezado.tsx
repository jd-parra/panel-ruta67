import type { ReactNode } from 'react';
import estilos from './Encabezado.module.css';

/** Título de la pantalla, subtítulo opcional y acciones a la derecha. */
export function Encabezado({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
}) {
  return (
    <header className={estilos.encabezado}>
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p className="suave">{subtitulo}</p>}
      </div>
      {acciones && <div className="fila">{acciones}</div>}
    </header>
  );
}
