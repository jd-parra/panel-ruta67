import { useEffect, useLayoutEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTRO_MERIDA } from '../nucleo/config';
import { COLOR_TRAZO } from '../utils/mapa';
import './MapaLeaflet.css';

type Punto = [number, number];

interface Props {
  trazo: Punto[];
  onChange: (trazo: Punto[]) => void;
  /** Otras rutas de la línea, en gris, como referencia. */
  otros?: { nombre: string; trazo: Punto[] }[];
}

const verticeIcono = (n: number) =>
  L.divIcon({ className: '', html: `<div class="trazo-vertice">${n}</div>`, iconSize: undefined });

/**
 * Mapa para marcar el recorrido de una ruta: clic agrega un punto al final, arrastrar lo mueve
 * y clic derecho sobre un punto lo quita. La línea se dibuja en morado.
 */
export function EditorTrazo({ trazo, onChange, otros = [] }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const capaOtros = useRef<L.LayerGroup | null>(null);
  // Los manejadores de Leaflet se registran una vez: leen siempre lo último.
  const actual = useRef({ trazo, onChange });
  useLayoutEffect(() => {
    actual.current = { trazo, onChange };
  });

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current).setView(CENTRO_MERIDA, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    capaOtros.current = L.layerGroup().addTo(m);
    capa.current = L.layerGroup().addTo(m);
    m.on('click', (ev: L.LeafletMouseEvent) => {
      const { trazo: t, onChange: cambiar } = actual.current;
      cambiar([...t, [redondear(ev.latlng.lat), redondear(ev.latlng.lng)]]);
    });
    mapa.current = m;
    // Encuadra lo que ya existe al abrir.
    const conocidos = [...actual.current.trazo];
    if (conocidos.length > 1) m.fitBounds(conocidos, { padding: [40, 40], maxZoom: 16 });
    return () => {
      m.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const g = capaOtros.current;
    if (!g) return;
    g.clearLayers();
    for (const o of otros) {
      if (o.trazo.length < 2) continue;
      L.polyline(o.trazo, { color: '#9CA3AF', weight: 4, opacity: 0.7, dashArray: '6 6' })
        .bindTooltip(o.nombre, { sticky: true })
        .addTo(g);
    }
  }, [otros]);

  useEffect(() => {
    const g = capa.current;
    if (!g) return;
    g.clearLayers();
    if (trazo.length > 1)
      L.polyline(trazo, { color: COLOR_TRAZO, weight: 6, opacity: 0.9 }).addTo(g);
    trazo.forEach((p, i) => {
      const vertice = L.marker(p, { icon: verticeIcono(i + 1), draggable: true }).addTo(g);
      vertice.on('dragend', () => {
        const { lat, lng } = vertice.getLatLng();
        const nuevo = [...actual.current.trazo];
        nuevo[i] = [redondear(lat), redondear(lng)];
        actual.current.onChange(nuevo);
      });
      vertice.on('contextmenu', () => {
        actual.current.onChange(actual.current.trazo.filter((_, j) => j !== i));
      });
    });
  }, [trazo]);

  return <div ref={contenedor} className="mapa-contenedor editor-trazo" />;
}

/** 6 decimales ≈ 10 cm: suficiente y el JSON queda corto. */
const redondear = (n: number) => Math.round(n * 1e6) / 1e6;
