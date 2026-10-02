import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTRO_MERIDA } from '../nucleo/config';
import type { UnidadMapa } from '../nucleo/tipos';
import { COLOR_TRAZO, colorDeLinea, haceCuanto } from '../utils/mapa';
import './MapaLeaflet.css';

const BUS =
  '<svg viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-6H6V6h12v5z"/></svg>';

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const icono = (u: UnidadMapa) =>
  L.divIcon({
    className: '',
    iconSize: undefined,
    html:
      `<div class="mapa-unidad"><div class="mapa-bus" style="background:${colorDeLinea(u.lineaNombre)}">${BUS}</div>` +
      `<div class="mapa-etiqueta"><b>${esc(u.placa)}</b>${esc(u.lineaNombre)}</div></div>`,
  });

const detalle = (u: UnidadMapa) =>
  `<b>${esc(u.placa)}</b><br>${esc(u.lineaNombre)}<br><span class="suave">Unidad ${u.unidadCodigo} · ${haceCuanto(u.actualizadoEn)}</span>`;

/** Desliza el marcador en 1 s en vez de saltar. */
function mover(m: L.Marker, destino: L.LatLngExpression) {
  const origen = m.getLatLng();
  const fin = L.latLng(destino);
  if (origen.equals(fin)) return;
  const inicio = performance.now();
  const paso = (t: number) => {
    let k = Math.min(1, (t - inicio) / 1000);
    k = k * (2 - k);
    m.setLatLng([origen.lat + (fin.lat - origen.lat) * k, origen.lng + (fin.lng - origen.lng) * k]);
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Recorrido de una ruta para dibujar en morado. */
export interface TrazoRuta {
  clave: string;
  lineaNombre: string;
  tramoNombre: string;
  trazo: [number, number][];
}

/** Mapa de OpenStreetMap con un autobús por unidad en ruta y el recorrido de cada ruta en morado. */
export function MapaLeaflet({
  unidades,
  trazos = [],
}: {
  unidades: UnidadMapa[];
  trazos?: TrazoRuta[];
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaTrazos = useRef<L.LayerGroup | null>(null);
  const marcadores = useRef(new Map<number, { marcador: L.Marker; unidad: UnidadMapa }>());
  const ajustado = useRef(false);

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current, { zoomControl: true }).setView(CENTRO_MERIDA, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    // Los recorridos van debajo de los autobuses.
    capaTrazos.current = L.layerGroup().addTo(m);
    mapa.current = m;
    const registrados = marcadores.current;
    return () => {
      m.remove();
      mapa.current = null;
      registrados.clear();
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const vivas = new Set(unidades.map((u) => u.unidadCodigo));
    for (const u of unidades) {
      const actual = marcadores.current.get(u.unidadCodigo);
      if (actual) {
        mover(actual.marcador, [u.lat, u.lng]);
        if (actual.unidad.placa !== u.placa || actual.unidad.lineaNombre !== u.lineaNombre)
          actual.marcador.setIcon(icono(u));
        actual.unidad = u;
      } else {
        const registro = {
          marcador: L.marker([u.lat, u.lng], { icon: icono(u) }).addTo(m),
          unidad: u,
        };
        // El "hace cuánto" se calcula al abrir, no cuando llegó el dato.
        registro.marcador.bindPopup(() => detalle(registro.unidad));
        marcadores.current.set(u.unidadCodigo, registro);
      }
    }
    for (const [codigo, { marcador }] of marcadores.current) {
      if (!vivas.has(codigo)) {
        marcador.remove();
        marcadores.current.delete(codigo);
      }
    }
    // La primera vez que hay unidades, el mapa se acerca a todas.
    if (!ajustado.current && unidades.length) {
      ajustado.current = true;
      m.fitBounds(
        unidades.map((u) => [u.lat, u.lng] as L.LatLngTuple),
        { padding: [60, 60], maxZoom: 15 },
      );
    }
  }, [unidades]);

  useEffect(() => {
    const g = capaTrazos.current;
    if (!g) return;
    g.clearLayers();
    for (const t of trazos) {
      const linea = L.polyline(t.trazo, { color: COLOR_TRAZO, weight: 5, opacity: 0.75 })
        .bindTooltip(`<b>${esc(t.lineaNombre)}</b><br>${esc(t.tramoNombre)}`, { sticky: true })
        .addTo(g);
      linea.on('mouseover', () => linea.setStyle({ weight: 8, opacity: 1 }));
      linea.on('mouseout', () => linea.setStyle({ weight: 5, opacity: 0.75 }));
    }
  }, [trazos]);

  return <div ref={contenedor} className="mapa-contenedor" />;
}
