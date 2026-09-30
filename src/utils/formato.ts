import type { Categoria } from '../nucleo/tipos';

export const formatearBs = (centimos: number) =>
  `${(centimos / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;

export const formatearFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-VE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatearPorcentaje = (fraccion: number) => `${Math.round(fraccion * 100)} %`;

/** "1.500,50" / "1500.5" / "2000" → céntimos. null si no es un número válido. */
export function bsACentimos(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, '');
  if (!limpio) return null;
  const normal = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  const valor = Number(normal);
  return Number.isFinite(valor) && valor >= 0 ? Math.round(valor * 100) : null;
}

export const centimosABs = (centimos: number) => (centimos / 100).toString().replace('.', ',');

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  general: 'General',
  estudiante: 'Estudiante',
  exonerado: 'Exonerado',
};
