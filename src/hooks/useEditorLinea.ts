import { useEffect, useState } from 'react';
import { actualizarLinea } from '../nucleo/api/central';
import { mensajeDeError } from '../nucleo/api/cliente';
import type { Linea } from '../nucleo/tipos';
import { bsACentimos, centimosABs } from '../utils/formato';

/** Fila editable: los números van como texto mientras se escriben. */
export interface RutaEditable {
  codigo: number;
  nombre: string;
  km: string;
  /** Precio fijo en Bs; vacío = según el tabulador. */
  precioFijo: string;
  nueva: boolean;
  tarifaCompleta?: number;
}

const aEditable = (l: Linea): RutaEditable[] =>
  l.tramos
    .slice()
    .sort((a, b) => a.codigo - b.codigo)
    .map((t) => ({
      codigo: t.codigo,
      nombre: t.nombre,
      km: String(t.km).replace('.', ','),
      precioFijo: t.tarifaManual != null ? centimosABs(t.tarifaManual) : '',
      nueva: false,
      tarifaCompleta: t.tarifaCompleta,
    }));

const aNumero = (texto: string) => Number(texto.trim().replace(',', '.'));

/** Primer problema de la fila, o null si está bien. */
function problemaDe(r: RutaEditable): string | null {
  if (r.nombre.trim().length < 2) return `Ruta ${r.codigo}: falta el nombre`;
  const km = aNumero(r.km);
  if (!Number.isFinite(km) || km <= 0) return `Ruta ${r.codigo}: los km deben ser mayores que 0`;
  if (r.precioFijo.trim() && bsACentimos(r.precioFijo) === null)
    return `Ruta ${r.codigo}: precio fijo inválido`;
  return null;
}

/**
 * Estado del editor de una línea: nombre, tipo y rutas (tramos del contrato).
 * El backend actualiza y agrega rutas por código, pero no las borra (conserva el historial de cobros).
 */
export function useEditorLinea(linea: Linea, alGuardar: (l: Linea) => void) {
  const [nombre, setNombre] = useState(linea.nombre);
  const [tipo, setTipo] = useState(linea.tipo);
  const [rutas, setRutas] = useState(() => aEditable(linea));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  // Al elegir otra línea (o tras guardar) se vuelve a partir de lo que dice el backend.
  useEffect(() => {
    setNombre(linea.nombre);
    setTipo(linea.tipo);
    setRutas(aEditable(linea));
    setError(null);
  }, [linea]);

  const cambiarRuta = (codigo: number, cambios: Partial<RutaEditable>) => {
    setGuardado(false);
    setRutas((rs) => rs.map((r) => (r.codigo === codigo ? { ...r, ...cambios } : r)));
  };

  const agregarRuta = () => {
    setGuardado(false);
    const codigo = Math.max(0, ...rutas.map((r) => r.codigo)) + 1;
    setRutas((rs) => [...rs, { codigo, nombre: '', km: '', precioFijo: '', nueva: true }]);
  };

  const quitarNueva = (codigo: number) =>
    setRutas((rs) => rs.filter((r) => !(r.nueva && r.codigo === codigo)));

  const descartar = () => {
    setNombre(linea.nombre);
    setTipo(linea.tipo);
    setRutas(aEditable(linea));
    setError(null);
  };

  const guardar = async () => {
    const problema =
      nombre.trim().length < 2
        ? 'Falta el nombre de la línea'
        : rutas.map(problemaDe).find(Boolean);
    if (problema) return setError(problema);
    setGuardando(true);
    setError(null);
    try {
      const actualizada = await actualizarLinea(linea.id, {
        nombre: nombre.trim(),
        tipo,
        tramos: rutas.map((r) => ({
          codigo: r.codigo,
          nombre: r.nombre.trim(),
          km: aNumero(r.km),
          tarifaManual: r.precioFijo.trim() ? bsACentimos(r.precioFijo) : null,
        })),
      });
      setGuardado(true);
      alGuardar(actualizada);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const hayCambios =
    nombre !== linea.nombre ||
    tipo !== linea.tipo ||
    JSON.stringify(rutas) !== JSON.stringify(aEditable(linea));

  return {
    nombre,
    setNombre,
    tipo,
    setTipo,
    rutas,
    cambiarRuta,
    agregarRuta,
    quitarNueva,
    descartar,
    guardar,
    guardando,
    error,
    guardado,
    hayCambios,
  };
}
