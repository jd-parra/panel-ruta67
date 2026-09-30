import { API_URL } from '../config';
import type { ErrorApi } from '../tipos';

const CLAVE_TOKEN = 'pasaje.panel.token';

/** Error de la API con el `mensaje` del contrato (§4), listo para mostrar tal cual. */
export class ErrorDeApi extends Error {
  readonly codigo: string;
  readonly estado: number;

  constructor(estado: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
}

export const leerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarToken = (token: string | null) =>
  token ? localStorage.setItem(CLAVE_TOKEN, token) : localStorage.removeItem(CLAVE_TOKEN);

// Lo avisa la sesión: un 401 significa que el token venció y hay que volver al login.
let alNoAutorizado: (() => void) | null = null;
export const cuandoNoAutorizado = (fn: () => void) => {
  alNoAutorizado = fn;
};

/**
 * Llama al backend con el token de la central.
 * @throws {ErrorDeApi} con el mensaje del backend, o "Sin conexión con el servidor"
 */
export async function llamar<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown } = {},
): Promise<T> {
  const token = leerToken();
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers: {
        ...(opciones.cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
  } catch {
    throw new ErrorDeApi(0, 'SIN_CONEXION', 'Sin conexión con el servidor');
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401) alNoAutorizado?.();
    const error = (datos as ErrorApi | null)?.error;
    throw new ErrorDeApi(
      respuesta.status,
      error?.codigo ?? 'ERROR',
      error?.mensaje ?? 'Algo salió mal. Inténtalo de nuevo',
    );
  }
  return datos as T;
}

export const mensajeDeError = (e: unknown) =>
  e instanceof Error ? e.message : 'Algo salió mal. Inténtalo de nuevo';
