import L from 'leaflet';

/** Color de los recorridos de las rutas en los mapas (morado de la marca). */
export const COLOR_TRAZO = '#7C3AED';

/** Marcador de parada: círculo blanco con borde morado y su número de orden. */
export const iconoParada = (orden: number) =>
  L.divIcon({
    className: '',
    html: `<div class="mapa-parada">${orden}</div>`,
    iconSize: undefined,
  });

// Un color fijo por línea (por nombre, que es lo que trae /mapa/unidades). Mismos colores que la app.
const COLORES_LINEA = ['#6D28D9', '#0E7490', '#C2410C', '#15803D', '#BE185D', '#1D4ED8', '#A16207'];

export function colorDeLinea(nombre: string) {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return COLORES_LINEA[h % COLORES_LINEA.length];
}

export function haceCuanto(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  return s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`;
}
