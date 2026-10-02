// Iconos de línea (estilo Lucide, 24×24) dibujados en SVG: sin librerías extra.
// Toman el color del texto (currentColor).

const TRAZOS = {
  abajo: <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  calendario: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  carnet: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.6-1.5 1.8-2 3-2s2.4.5 3 2M14 10h4M14 13h3" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3" width="16" height="16" rx="3" />
      <path d="M4 11h16M8 19v2M16 19v2" />
      <circle cx="8" cy="15" r="1" />
      <circle cx="16" cy="15" r="1" />
    </>
  ),
  ruta: (
    <>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5" />
    </>
  ),
  cerrar: <path d="M18 6 6 18M6 6l12 12" />,
  derecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  escudo: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  tamano = 20,
  className,
}: {
  nombre: NombreIcono;
  tamano?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
