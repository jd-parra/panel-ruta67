import { useState } from 'react';
import { actualizarUnidad, crearUnidad } from '../nucleo/api/central';
import { ErrorDeApi, mensajeDeError } from '../nucleo/api/cliente';
import type { Recolector, Unidad } from '../nucleo/tipos';

/**
 * Qué recolector lleva la unidad:
 * - `nuevo`: la central le crea la cuenta (nombre, teléfono y clave) en el mismo paso.
 * - `existente`: uno que ya tiene cuenta y está libre.
 * - `ninguno`: la unidad queda sin recolector (no aparece en ningún teléfono).
 * - `actual`: al editar, no se toca el que ya tiene.
 */
export type ModoRecolector = 'nuevo' | 'existente' | 'ninguno' | 'actual';

// Mismas reglas que el backend (central/esquemas.js y auth/esquemas.js).
const CODIGO_MAX = 65535;
const TELEFONO = /^04\d{9}$/;

/** "ab 123 cd" → "AB123CD": la placa se guarda en mayúsculas y sin espacios. */
export const normalizarPlaca = (texto: string) => texto.toUpperCase().replace(/\s/g, '');

/** Código sugerido para una unidad nueva: el siguiente al mayor que existe (o 101 si no hay). */
export const sugerirCodigo = (unidades: Unidad[]) =>
  unidades.length ? Math.max(...unidades.map((u) => u.codigo)) + 1 : 101;

interface Opciones {
  /** null = crear una unidad nueva. */
  unidad: Unidad | null;
  unidades: Unidad[];
  lineaInicial: number | null;
  alGuardar: (unidad: Unidad, mensaje: string) => void;
}

/**
 * Estado del formulario de crear/editar unidad.
 * El componente se vuelve a montar (con `key`) al cambiar de unidad, así que no hace falta sincronizar.
 */
export function useFormularioUnidad({ unidad, unidades, lineaInicial, alGuardar }: Opciones) {
  const editando = unidad !== null;
  const [codigo, setCodigo] = useState(() => String(unidad?.codigo ?? sugerirCodigo(unidades)));
  const [placa, setPlaca] = useState(unidad?.placa ?? '');
  const [lineaCodigo, setLineaCodigo] = useState<number | null>(
    unidad?.lineaCodigo ?? lineaInicial,
  );
  const [modo, setModo] = useState<ModoRecolector>(editando ? 'actual' : 'nuevo');
  const [recolectorId, setRecolectorId] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Primer problema del formulario, o null si se puede enviar. */
  function problema(): string | null {
    if (!editando) {
      const n = Number(codigo);
      if (!Number.isInteger(n) || n < 1 || n > CODIGO_MAX)
        return `El código debe ser un número entre 1 y ${CODIGO_MAX}`;
      if (unidades.some((u) => u.codigo === n)) return `Ya existe la unidad ${n}`;
      if (placa.length < 5 || placa.length > 10)
        return 'La placa debe tener entre 5 y 10 caracteres';
      if (unidades.some((u) => u.placa === placa)) return `La placa ${placa} ya está registrada`;
    }
    if (lineaCodigo === null) return 'Elige la línea';
    if (modo === 'existente' && !recolectorId) return 'Elige el recolector';
    if (modo === 'nuevo') {
      if (nombre.trim().length < 2) return 'Escribe el nombre del recolector';
      if (!TELEFONO.test(telefono)) return 'El teléfono debe tener 11 dígitos y empezar por 04';
      if (clave.length < 4) return 'La clave debe tener al menos 4 caracteres';
    }
    if (editando && lineaCodigo === unidad.lineaCodigo && modo === 'actual')
      return 'No hay cambios que guardar';
    return null;
  }

  /** Lo que se manda del recolector según el modo elegido. */
  function asignacion() {
    if (modo === 'nuevo') return { recolector: { nombre: nombre.trim(), telefono, clave } };
    if (modo === 'existente') return { recolectorId };
    if (modo === 'ninguno') return { recolectorId: null };
    return {};
  }

  async function guardar(recolectores: Recolector[]) {
    const p = problema();
    if (p) return setError(p);
    setGuardando(true);
    setError(null);
    try {
      const guardada = editando
        ? await actualizarUnidad(unidad.id, {
            ...(lineaCodigo !== unidad.lineaCodigo && { lineaCodigo: lineaCodigo! }),
            ...asignacion(),
          })
        : await crearUnidad({
            codigo: Number(codigo),
            placa,
            lineaCodigo: lineaCodigo!,
            ...asignacion(),
          });
      alGuardar(guardada, mensajeDeExito(guardada, recolectores));
    } catch (e) {
      setError(mensajeDeConflicto(e) ?? mensajeDeError(e));
      setGuardando(false);
    }
  }

  // El backend responde CONFLICTO con un texto genérico; aquí se sabe qué campo lo causó.
  // (El código y la placa repetidos ya se detectan antes de enviar, en `problema`.)
  function mensajeDeConflicto(e: unknown): string | null {
    if (!(e instanceof ErrorDeApi) || e.codigo !== 'CONFLICTO') return null;
    if (modo === 'nuevo')
      return `El teléfono ${telefono} ya tiene una cuenta. Usa otro, o elige «Asignar uno existente» si es un recolector.`;
    if (modo === 'existente') return 'Ese recolector ya tiene otra unidad asignada.';
    return 'El código o la placa ya están en uso.';
  }

  function mensajeDeExito(u: Unidad, recolectores: Recolector[]) {
    const accion = editando ? 'actualizada' : 'creada';
    if (modo === 'nuevo')
      return `Unidad ${u.codigo} ${accion}. ${nombre.trim()} ya puede entrar en la app con el teléfono ${telefono} y la clave que le diste.`;
    if (modo === 'existente') {
      const r = recolectores.find((x) => x.id === recolectorId);
      return `Unidad ${u.codigo} ${accion} con ${r?.nombre ?? 'el recolector elegido'}.`;
    }
    if (modo === 'ninguno') return `Unidad ${u.codigo} ${accion} sin recolector.`;
    return `Unidad ${u.codigo} ${accion}.`;
  }

  return {
    editando,
    codigo,
    setCodigo: (t: string) => setCodigo(t.replace(/\D/g, '')),
    placa,
    setPlaca: (t: string) => setPlaca(normalizarPlaca(t)),
    lineaCodigo,
    setLineaCodigo,
    modo,
    setModo: (m: ModoRecolector) => {
      setModo(m);
      setError(null);
    },
    recolectorId,
    setRecolectorId,
    nombre,
    setNombre,
    telefono,
    setTelefono: (t: string) => setTelefono(t.replace(/\D/g, '').slice(0, 11)),
    clave,
    setClave,
    guardar,
    guardando,
    error,
  };
}
