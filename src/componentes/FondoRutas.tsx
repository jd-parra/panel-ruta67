import estilos from './FondoRutas.module.css';

// Recorridos inventados que cruzan la pantalla (viewBox 1440×900), como líneas de autobús en un mapa.
// Dos suben hacia la derecha (↗) y dos bajan (↘): se cruzan alrededor de la tarjeta.
const RUTAS = [
  'M-60 640 C 200 540, 340 320, 600 250 S 1060 60, 1320 -60',
  'M120 960 C 380 860, 560 720, 860 670 S 1280 450, 1500 340',
  'M-60 110 C 170 170, 270 330, 430 420 S 650 700, 780 960',
  'M840 -60 C 980 80, 1080 250, 1250 350 S 1430 560, 1500 640',
];

// Paradas: puntos exactos de cada ruta (al 16 % y al 84 % de su largo), lejos de la tarjeta.
const PARADAS: [number, number][] = [
  [157, 519],
  [1096, 48],
  [343, 860],
  [1294, 470],
  [121, 189],
  [694, 781],
  [944, 55],
  [1417, 509],
];

/**
 * Fondo decorativo: un mapa muy suave con rutas, paradas y busetas que avanzan.
 * Es puramente visual (aria-hidden) y se queda quieto con «reducir movimiento».
 */
export function FondoRutas() {
  return (
    <div className={estilos.fondo} aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className={estilos.svg}>
        <defs>
          <pattern id="calles" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 0H120M0 0V120" className={estilos.calle} />
            <path d="M0 60H120M60 0V120" className={estilos.callejon} />
          </pattern>
          {RUTAS.map((d, i) => (
            <path key={i} id={`ruta-fondo-${i}`} d={d} />
          ))}
        </defs>

        <rect width="1440" height="900" fill="url(#calles)" />

        {RUTAS.map((d, i) => (
          <g key={i}>
            <path d={d} className={estilos.ruta} />
            <path d={d} className={estilos.flujo} style={{ animationDelay: `${-i * 1.7}s` }} />
          </g>
        ))}

        {PARADAS.map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r="14"
              className={estilos.ondaParada}
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            <circle cx={x} cy={y} r="5" className={estilos.parada} />
          </g>
        ))}

        {/* Una buseta por ruta, cada una a su ritmo. */}
        {RUTAS.map((_, i) => (
          <g key={i} className={estilos.buseta}>
            <circle r="7" className={estilos.busetaCuerpo} />
            <circle r="2.5" className={estilos.busetaLuz} />
            <animateMotion
              dur={`${26 + i * 7}s`}
              begin={`${-i * 5}s`}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#ruta-fondo-${i}`} />
            </animateMotion>
          </g>
        ))}
      </svg>
      {/* Aclara el centro para que la tarjeta se lea sin distracciones. */}
      <div className={estilos.velo} />
    </div>
  );
}
