import { useCallback, useEffect, useRef, useState } from 'react';
import { listarUnidadesMapa } from '../nucleo/api/central';
import { mensajeDeError } from '../nucleo/api/cliente';
import { useSesion } from '../nucleo/auth/SesionContext';
import { conectarSocket } from '../nucleo/socket';
import type { UnidadMapa } from '../nucleo/tipos';

// Igual que el backend: una unidad sin reportar en 5 min deja de estar en ruta.
const VIGENCIA_MS = 5 * 60_000;

/** Unidades en ruta: GET /mapa/unidades al abrir + «unidad:ubicacion» en tiempo real (§11). */
export function useUnidadesMapa() {
  const { token } = useSesion();
  const [unidades, setUnidades] = useState<UnidadMapa[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unidadesRef = useRef(unidades);
  useEffect(() => {
    unidadesRef.current = unidades;
  }, [unidades]);

  const cargar = useCallback(async () => {
    try {
      setUnidades(await listarUnidadesMapa());
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!token) return;
    const socket = conectarSocket(token);
    const alMoverse = ({
      unidadCodigo,
      lat,
      lng,
    }: {
      unidadCodigo: number;
      lat: number;
      lng: number;
    }) => {
      // El evento no trae placa ni línea: una unidad nueva obliga a pedir la lista otra vez.
      if (!unidadesRef.current?.some((u) => u.unidadCodigo === unidadCodigo)) return void cargar();
      const actualizadoEn = new Date().toISOString();
      setUnidades(
        (prev) =>
          prev?.map((u) =>
            u.unidadCodigo === unidadCodigo ? { ...u, lat, lng, actualizadoEn } : u,
          ) ?? prev,
      );
    };
    socket.on('unidad:ubicacion', alMoverse);
    return () => void socket.off('unidad:ubicacion', alMoverse);
  }, [token, cargar]);

  useEffect(() => {
    const id = setInterval(() => {
      setUnidades(
        (prev) =>
          prev?.filter((u) => Date.now() - Date.parse(u.actualizadoEn) < VIGENCIA_MS) ?? prev,
      );
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return { unidades, error, recargar: cargar };
}
