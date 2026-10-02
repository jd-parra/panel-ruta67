import { useState } from 'react';
import { crearTabulador } from '../nucleo/api/central';
import { ErrorDeApi, mensajeDeError } from '../nucleo/api/cliente';
import type { Categoria, Tabulador } from '../nucleo/tipos';
import { bsACentimos, centimosABs } from '../utils/formato';

/** Rango de la escala suburbana mientras se escribe. `sinTope` = "más de X km" (hastaKm 9999). */
export interface RangoEditable {
  id: number;
  hastaKm: string;
  monto: string;
  sinTope: boolean;
}

export const SIN_TOPE = 9999;
// Venezuela no cambia de horario: siempre UTC−4 (America/Caracas).
const DESFASE_CARACAS = '-04:00';

const aPorcentaje = (fraccion: number) =>
  String(Math.round(fraccion * 1000) / 10).replace('.', ',');

/** "50" / "12,5" → 0.5 / 0.125. null si no está entre 0 y 100. */
function aFraccion(texto: string): number | null {
  const n = Number(texto.trim().replace(',', '.'));
  return texto.trim() && Number.isFinite(n) && n >= 0 && n <= 100 ? n / 100 : null;
}

/** Fecha de mañana en Caracas, como "AAAA-MM-DD" (valor por defecto del formulario). */
function mananaEnCaracas() {
  const manana = new Date(Date.now() + 24 * 3600 * 1000);
  return manana.toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
}

function rangosDe(t: Tabulador | null): RangoEditable[] {
  if (!t) return [{ id: 1, hastaKm: '', monto: '', sinTope: true }];
  return t.suburbano.map((r, i) => ({
    id: i + 1,
    hastaKm: r.hastaKm >= SIN_TOPE ? '' : String(r.hastaKm).replace('.', ','),
    monto: centimosABs(r.monto),
    sinTope: r.hastaKm >= SIN_TOPE,
  }));
}

/**
 * Formulario de un tabulador nuevo. Parte de los valores del vigente: lo normal es que una gaceta
 * cambie algunos montos, no todo. Tiene un paso de revisión porque publicarlo no se puede deshacer.
 */
export function useFormularioTabulador(
  vigente: Tabulador | null,
  existentes: Tabulador[],
  alCrear: (t: Tabulador) => void,
) {
  const [fuente, setFuente] = useState('');
  const [fecha, setFecha] = useState(mananaEnCaracas);
  const [hora, setHora] = useState('00:00');
  const [urbano, setUrbano] = useState(vigente ? centimosABs(vigente.urbanoMinimo) : '');
  const [recargo, setRecargo] = useState(
    vigente ? aPorcentaje(vigente.recargoDomingoFeriado) : '0',
  );
  const [descuentos, setDescuentos] = useState<Record<Categoria, string>>({
    general: vigente ? aPorcentaje(vigente.descuentos.general) : '0',
    estudiante: vigente ? aPorcentaje(vigente.descuentos.estudiante) : '50',
    exonerado: vigente ? aPorcentaje(vigente.descuentos.exonerado) : '100',
  });
  const [rangos, setRangos] = useState(() => rangosDe(vigente));
  const [revisando, setRevisando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vigenteDesde = `${fecha}T${hora}:00${DESFASE_CARACAS}`;
  // Momento en que se abrió el formulario: basta para decidir si la fecha ya pasó.
  const [ahora] = useState(Date.now);
  const yaEmpezo = Date.parse(vigenteDesde) <= ahora;

  const editar =
    <T>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setError(null);
    };

  const cambiarRango = (id: number, cambios: Partial<RangoEditable>) => {
    setError(null);
    setRangos((rs) => rs.map((r) => (r.id === id ? { ...r, ...cambios } : r)));
  };

  /** El nuevo rango va antes del "sin tope" (que siempre es el último). */
  const agregarRango = () =>
    setRangos((rs) => {
      const id = Math.max(0, ...rs.map((r) => r.id)) + 1;
      const nuevo = { id, hastaKm: '', monto: '', sinTope: false };
      const ultimo = rs[rs.length - 1];
      return ultimo?.sinTope ? [...rs.slice(0, -1), nuevo, ultimo] : [...rs, nuevo];
    });

  const quitarRango = (id: number) => setRangos((rs) => rs.filter((r) => r.id !== id));

  /** Lo que se manda al backend, o el primer problema encontrado. */
  function armar(): { datos: Omit<Tabulador, 'id'> } | { problema: string } {
    if (fuente.trim().length < 3)
      return { problema: 'Indica la fuente (p. ej. «Gaceta Oficial N° 43.210»)' };
    if (!fecha || Number.isNaN(Date.parse(vigenteDesde)))
      return { problema: 'Elige la fecha en que entra en vigor' };
    if (Date.parse(vigenteDesde) < ahora - 24 * 3600 * 1000)
      return { problema: 'Esa fecha ya pasó. Un tabulador nuevo empieza hoy o más adelante.' };
    if (existentes.some((t) => Date.parse(t.vigenteDesde) === Date.parse(vigenteDesde)))
      return { problema: 'Ya hay un tabulador que empieza en esa misma fecha y hora' };

    const urbanoMinimo = bsACentimos(urbano);
    if (!urbanoMinimo) return { problema: 'Escribe el pasaje urbano (mayor que 0)' };
    const recargoDomingoFeriado = aFraccion(recargo);
    if (recargoDomingoFeriado === null) return { problema: 'El recargo debe ser de 0 a 100 %' };

    const d = {
      general: aFraccion(descuentos.general),
      estudiante: aFraccion(descuentos.estudiante),
      exonerado: aFraccion(descuentos.exonerado),
    };
    if (Object.values(d).some((x) => x === null))
      return { problema: 'Los descuentos deben ser de 0 a 100 %' };

    if (!rangos.length) return { problema: 'La escala suburbana necesita al menos un rango' };
    const suburbano: Tabulador['suburbano'] = [];
    for (const [i, r] of rangos.entries()) {
      const nombre = `Rango ${i + 1}`;
      const hastaKm = r.sinTope ? SIN_TOPE : Number(r.hastaKm.trim().replace(',', '.'));
      if (!(hastaKm > 0)) return { problema: `${nombre}: escribe hasta cuántos km llega` };
      if (i > 0 && hastaKm <= suburbano[i - 1].hastaKm)
        return { problema: `${nombre}: debe llegar a más km que el anterior` };
      const monto = bsACentimos(r.monto);
      if (!monto) return { problema: `${nombre}: escribe el monto (mayor que 0)` };
      suburbano.push({ hastaKm, monto });
    }

    return {
      datos: {
        fuente: fuente.trim(),
        vigenteDesde,
        descuentos: d as Record<Categoria, number>,
        recargoDomingoFeriado,
        urbanoMinimo,
        suburbano,
      },
    };
  }

  const resultado = armar();

  const revisar = () => {
    if ('problema' in resultado) return setError(resultado.problema);
    setError(null);
    setRevisando(true);
  };

  const publicar = async () => {
    if ('problema' in resultado) return;
    setGuardando(true);
    setError(null);
    try {
      alCrear(await crearTabulador(resultado.datos));
    } catch (e) {
      setError(
        e instanceof ErrorDeApi && e.codigo === 'TRAMO_INVALIDO'
          ? `${e.message}. Agrega un rango que llegue a esa distancia (o marca el último como «sin tope»).`
          : e instanceof ErrorDeApi && e.codigo === 'CONFLICTO'
            ? 'Ya hay un tabulador que empieza en esa misma fecha y hora'
            : mensajeDeError(e),
      );
      setRevisando(false);
      setGuardando(false);
    }
  };

  return {
    fuente,
    setFuente: editar(setFuente),
    fecha,
    setFecha: editar(setFecha),
    hora,
    setHora: editar(setHora),
    urbano,
    setUrbano: editar(setUrbano),
    recargo,
    setRecargo: editar(setRecargo),
    descuentos,
    setDescuento: (c: Categoria, v: string) => {
      setError(null);
      setDescuentos((d) => ({ ...d, [c]: v }));
    },
    rangos,
    cambiarRango,
    agregarRango,
    quitarRango,
    datos: 'datos' in resultado ? resultado.datos : null,
    yaEmpezo,
    revisando,
    volverAEditar: () => setRevisando(false),
    revisar,
    publicar,
    guardando,
    error,
  };
}
