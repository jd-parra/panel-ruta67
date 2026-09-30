import { useCallback, useEffect, useState } from 'react';
import { mensajeDeError } from '../nucleo/api/cliente';

/** Carga datos al montar y permite recargarlos; guarda el último error como texto para mostrar. */
export function useCarga<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setDatos(await cargar());
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { datos, setDatos, error, cargando, recargar };
}
