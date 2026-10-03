import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icono, type NombreIcono } from './Icono';
import estilos from './Selector.module.css';

export interface OpcionSelector<T> {
  valor: T;
  texto: string;
  /** Segunda línea, más suave (p. ej. el teléfono de un recolector). */
  detalle?: string;
}

interface Props<T> {
  opciones: OpcionSelector<T>[];
  /** null = nada elegido todavía (muestra el `placeholder`). */
  valor: T | null;
  alCambiar: (valor: T) => void;
  placeholder?: string;
  icono?: NombreIcono;
  deshabilitado?: boolean;
  /** Para lectores de pantalla cuando no hay una etiqueta visible. */
  etiqueta?: string;
}

/**
 * Lista desplegable con el estilo del panel (reemplaza al `<select>` nativo).
 * Teclado: ↑/↓ para moverse, Enter o Espacio para elegir, Esc para cerrar.
 */
export function Selector<T extends string | number>({
  opciones,
  valor,
  alCambiar,
  placeholder = 'Elige una opción',
  icono,
  deshabilitado,
  etiqueta,
}: Props<T>) {
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [resaltada, setResaltada] = useState(0);
  const elegida = opciones.find((o) => o.valor === valor) ?? null;

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const alClic = (ev: MouseEvent) => {
      if (!raiz.current?.contains(ev.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClic);
    return () => document.removeEventListener('mousedown', alClic);
  }, [abierto]);

  const abrir = () => {
    if (deshabilitado || !opciones.length) return;
    setResaltada(
      Math.max(
        0,
        opciones.findIndex((o) => o.valor === valor),
      ),
    );
    setAbierto(true);
  };

  const elegir = (i: number) => {
    const opcion = opciones[i];
    if (opcion) alCambiar(opcion.valor);
    setAbierto(false);
    boton.current?.focus();
  };

  const alTeclear = (ev: KeyboardEvent) => {
    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(ev.key)) {
        ev.preventDefault();
        abrir();
      }
      return;
    }
    const mover = (i: number) => setResaltada(Math.min(opciones.length - 1, Math.max(0, i)));
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        mover(resaltada + 1);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        mover(resaltada - 1);
        break;
      case 'Home':
        ev.preventDefault();
        mover(0);
        break;
      case 'End':
        ev.preventDefault();
        mover(opciones.length - 1);
        break;
      case 'Enter':
      case ' ':
        ev.preventDefault();
        elegir(resaltada);
        break;
      case 'Escape':
        ev.preventDefault();
        setAbierto(false);
        break;
      case 'Tab':
        setAbierto(false);
        break;
    }
  };

  return (
    <div ref={raiz} className={estilos.raiz}>
      <button
        ref={boton}
        type="button"
        className={`${estilos.disparador} ${abierto ? estilos.abierto : ''}`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alTeclear}
        disabled={deshabilitado}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={abierto ? `${id}-${resaltada}` : undefined}
        aria-label={etiqueta}
      >
        {icono && <Icono nombre={icono} tamano={18} className={estilos.iconoInicio} />}
        <span className={elegida ? estilos.texto : `${estilos.texto} ${estilos.vacio}`}>
          {elegida?.texto ?? placeholder}
        </span>
        <Icono nombre="abajo" tamano={18} className={estilos.flecha} />
      </button>

      {abierto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className={estilos.lista}
          tabIndex={-1}
          // Si el selector está dentro de un <label>, el clic no debe volver a abrirlo.
          onClick={(ev) => ev.preventDefault()}
        >
          {opciones.map((o, i) => {
            const activa = o.valor === valor;
            return (
              <li
                key={String(o.valor)}
                id={`${id}-${i}`}
                role="option"
                aria-selected={activa}
                className={`${estilos.opcion} ${i === resaltada ? estilos.resaltada : ''} ${
                  activa ? estilos.elegida : ''
                }`}
                onMouseEnter={() => setResaltada(i)}
                // mousedown evita que el botón pierda el foco antes de elegir.
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  elegir(i);
                }}
              >
                <span className={estilos.opcionTextos}>
                  <span>{o.texto}</span>
                  {o.detalle && <span className={estilos.detalle}>{o.detalle}</span>}
                </span>
                {activa && <Icono nombre="check" tamano={16} className={estilos.check} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
