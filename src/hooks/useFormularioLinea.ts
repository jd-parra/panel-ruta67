import { useState } from 'react';
import { crearLinea } from '../nucleo/api/central';
import { ErrorDeApi, mensajeDeError } from '../nucleo/api/cliente';
import type { Linea } from '../nucleo/tipos';
import { bsACentimos } from '../utils/formato';
import { aNumero, problemaDe, type RutaEditable } from './useEditorLinea';

const CODIGO_MAX = 65535;

const rutaVacia = (codigo: number): RutaEditable => ({
  codigo,
  nombre: '',
  km: '',
  precioFijo: '',
  nueva: true,
  trazo: [],
  paradas: [],
});

/** Código sugerido: el siguiente al mayor que existe (o 1 si no hay líneas). */
export const sugerirCodigoLinea = (lineas: Linea[]) =>
  lineas.length ? Math.max(...lineas.map((l) => l.codigo)) + 1 : 1;

/** Estado del formulario de una línea nueva (POST /central/lineas). Empieza con una ruta vacía. */
export function useFormularioLinea(lineas: Linea[], alCrear: (l: Linea) => void) {
  const [codigo, setCodigo] = useState(() => String(sugerirCodigoLinea(lineas)));
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<Linea['tipo']>('urbana');
  const [rutas, setRutas] = useState<RutaEditable[]>([rutaVacia(1)]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiarRuta = (c: number, cambios: Partial<RutaEditable>) =>
    setRutas((rs) => rs.map((r) => (r.codigo === c ? { ...r, ...cambios } : r)));

  const agregarRuta = () =>
    setRutas((rs) => [...rs, rutaVacia(Math.max(0, ...rs.map((r) => r.codigo)) + 1)]);

  const quitarRuta = (c: number) => setRutas((rs) => rs.filter((r) => r.codigo !== c));

  function problema(): string | null {
    const n = Number(codigo);
    if (!Number.isInteger(n) || n < 1 || n > CODIGO_MAX)
      return `El código debe ser un número entre 1 y ${CODIGO_MAX}`;
    if (lineas.some((l) => l.codigo === n)) return `Ya existe la línea ${n}`;
    if (nombre.trim().length < 2) return 'Escribe el nombre de la línea';
    if (lineas.some((l) => l.nombre.trim().toLowerCase() === nombre.trim().toLowerCase()))
      return `Ya existe una línea llamada «${nombre.trim()}»`;
    if (!rutas.length) return 'La línea necesita al menos una ruta';
    return rutas.map(problemaDe).find(Boolean) ?? null;
  }

  const crear = async () => {
    const p = problema();
    if (p) return setError(p);
    setGuardando(true);
    setError(null);
    try {
      alCrear(
        await crearLinea({
          codigo: Number(codigo),
          nombre: nombre.trim(),
          tipo,
          tramos: rutas.map((r) => ({
            codigo: r.codigo,
            nombre: r.nombre.trim(),
            km: aNumero(r.km),
            tarifaManual: r.precioFijo.trim() ? bsACentimos(r.precioFijo) : null,
          })),
        }),
      );
    } catch (e) {
      // TRAMO_INVALIDO: una ruta suburbana tiene más km de los que cubre la escala del tabulador.
      setError(
        e instanceof ErrorDeApi && e.codigo === 'CONFLICTO'
          ? `Ya existe la línea ${codigo}`
          : e instanceof ErrorDeApi && e.codigo === 'TRAMO_INVALIDO'
            ? `${e.message}. Ponle un precio fijo o pide un tabulador que cubra esa distancia.`
            : mensajeDeError(e),
      );
      setGuardando(false);
    }
  };

  return {
    codigo,
    setCodigo: (t: string) => setCodigo(t.replace(/\D/g, '')),
    nombre,
    setNombre,
    tipo,
    setTipo,
    rutas,
    cambiarRuta,
    agregarRuta,
    quitarRuta,
    crear,
    guardando,
    error,
  };
}
