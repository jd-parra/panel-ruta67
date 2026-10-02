import { useEffect, useLayoutEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CENTRO_MERIDA } from '../nucleo/config';
import type { Parada } from '../nucleo/tipos';
import { COLOR_TRAZO, iconoParada } from '../utils/mapa';
import './MapaLeaflet.css';

type Punto = [number, number];
export type ModoEditor = 'recorrido' | 'paradas';

interface Props {
  modo: ModoEditor;
  trazo: Punto[];
  paradas: Parada[];
  onTrazo: (trazo: Punto[]) => void;
  onParadas: (paradas: Parada[]) => void;
  /** Otras rutas de la línea, en gris, como referencia. */
  otros?: { nombre: string; trazo: Punto[] }[];
}

const icono = (clase: string) =>
  L.divIcon({ className: '', html: `<div class="${clase}"></div>`, iconSize: undefined });

/**
 * Mapa para marcar una ruta, en dos modos:
 * - Recorrido: la forma del camino. Clic agrega un punto al final; arrastrar un punto lo mueve;
 *   arrastrar el punto claro entre dos puntos agrega uno nuevo ahí (para seguir curvas);
 *   clic derecho quita un punto. Los puntos NO son paradas.
 * - Paradas: clic agrega una parada; arrastrar la mueve; clic derecho la quita.
 */
export function EditorTrazo({ modo, trazo, paradas, onTrazo, onParadas, otros = [] }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const capaOtros = useRef<L.LayerGroup | null>(null);
  // Los manejadores de Leaflet se registran una vez: leen siempre lo último.
  const actual = useRef({ modo, trazo, paradas, onTrazo, onParadas });
  useLayoutEffect(() => {
    actual.current = { modo, trazo, paradas, onTrazo, onParadas };
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
      const a = actual.current;
      const p: Punto = [redondear(ev.latlng.lat), redondear(ev.latlng.lng)];
      if (a.modo === 'recorrido') a.onTrazo([...a.trazo, p]);
      else
        a.onParadas([
          ...a.paradas,
          { nombre: `Parada ${a.paradas.length + 1}`, lat: p[0], lng: p[1] },
        ]);
    });
    mapa.current = m;
    // Encuadra lo que ya existe al abrir.
    const conocidos: Punto[] = [
      ...actual.current.trazo,
      ...actual.current.paradas.map((p): Punto => [p.lat, p.lng]),
    ];
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
    if (trazo.length > 1) {
      L.polyline(trazo, { color: COLOR_TRAZO, weight: 6, opacity: 0.9, interactive: false }).addTo(
        g,
      );
    }

    if (modo === 'recorrido') {
      trazo.forEach((p, i) => {
        const extremo = i === 0 || i === trazo.length - 1;
        const v = L.marker(p, {
          icon: icono(extremo ? 'trazo-vertice extremo' : 'trazo-vertice'),
          draggable: true,
          title: i === 0 ? 'Inicio' : i === trazo.length - 1 ? 'Fin' : undefined,
        }).addTo(g);
        v.on('dragend', () => {
          const { lat, lng } = v.getLatLng();
          const nuevo = [...actual.current.trazo];
          nuevo[i] = [redondear(lat), redondear(lng)];
          actual.current.onTrazo(nuevo);
        });
        v.on('contextmenu', () =>
          actual.current.onTrazo(actual.current.trazo.filter((_, j) => j !== i)),
        );
      });
      // Un punto claro a mitad de cada tramo: al arrastrarlo nace un punto nuevo ahí.
      for (let i = 0; i < trazo.length - 1; i++) {
        const medio: Punto = [
          (trazo[i][0] + trazo[i + 1][0]) / 2,
          (trazo[i][1] + trazo[i + 1][1]) / 2,
        ];
        const h = L.marker(medio, {
          icon: icono('trazo-medio'),
          draggable: true,
          title: 'Arrastra para curvar',
        }).addTo(g);
        h.on('dragend', () => {
          const { lat, lng } = h.getLatLng();
          const nuevo = [...actual.current.trazo];
          nuevo.splice(i + 1, 0, [redondear(lat), redondear(lng)]);
          actual.current.onTrazo(nuevo);
        });
      }
    }

    paradas.forEach((p, i) => {
      const editable = modo === 'paradas';
      const marcador = L.marker([p.lat, p.lng], {
        icon: iconoParada(i + 1),
        draggable: editable,
        interactive: true,
      })
        .bindTooltip(p.nombre, { direction: 'top', offset: [0, -14] })
        .addTo(g);
      if (!editable) return;
      marcador.on('dragend', () => {
        const { lat, lng } = marcador.getLatLng();
        actual.current.onParadas(
          actual.current.paradas.map((x, j) =>
            j === i ? { ...x, lat: redondear(lat), lng: redondear(lng) } : x,
          ),
        );
      });
      marcador.on('contextmenu', () =>
        actual.current.onParadas(actual.current.paradas.filter((_, j) => j !== i)),
      );
    });
  }, [modo, trazo, paradas]);

  return <div ref={contenedor} className="mapa-contenedor editor-trazo" />;
}

/** 6 decimales ≈ 10 cm: suficiente y el JSON queda corto. */
const redondear = (n: number) => Math.round(n * 1e6) / 1e6;
