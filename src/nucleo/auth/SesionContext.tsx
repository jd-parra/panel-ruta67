import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { login as loginApi, obtenerYo } from '../api/central';
import { cuandoNoAutorizado, ErrorDeApi, guardarToken, leerToken } from '../api/cliente';
import type { Usuario } from '../tipos';

interface Sesion {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  entrar: (telefono: string, clave: string) => Promise<void>;
  salir: () => void;
}

const SesionContext = createContext<Sesion | null>(null);

/** Sesión de la central: el token vive en localStorage y se valida con GET /me al abrir. */
export function SesionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(leerToken);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(() => leerToken() !== null);

  const salir = useCallback(() => {
    guardarToken(null);
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => cuandoNoAutorizado(salir), [salir]);

  useEffect(() => {
    if (!token || usuario) return;
    obtenerYo()
      .then(setUsuario)
      .catch(salir)
      .finally(() => setCargando(false));
  }, [token, usuario, salir]);

  const entrar = useCallback(async (telefono: string, clave: string) => {
    const r = await loginApi(telefono, clave);
    // El panel es solo para la central (§14): pasajeros y recolectores usan la app.
    if (r.usuario.rol !== 'central') {
      throw new ErrorDeApi(403, 'PROHIBIDO', 'Esta cuenta no es de la central. Usa la app.');
    }
    guardarToken(r.token);
    setToken(r.token);
    setUsuario(r.usuario);
  }, []);

  return (
    <SesionContext.Provider value={{ usuario, token, cargando, entrar, salir }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) throw new Error('useSesion va dentro de <SesionProvider>');
  return sesion;
}
