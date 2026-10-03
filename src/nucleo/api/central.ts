import type {
  Conflicto,
  Linea,
  Recolector,
  RecolectorNuevo,
  Resumen,
  Tabulador,
  Tramo,
  Unidad,
  UnidadMapa,
  Usuario,
} from '../tipos';
import { llamar } from './cliente';

// Endpoints de la central (contrato §6.5) y los compartidos que usa el panel (§6.6).

export const login = (telefono: string, clave: string) =>
  llamar<{ token: string; usuario: Usuario }>('/auth/login', {
    metodo: 'POST',
    cuerpo: { telefono, clave },
  });

export const obtenerYo = () => llamar<Usuario>('/me');

export const obtenerResumen = (desde?: string) =>
  llamar<Resumen>(`/central/resumen${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`);

export const listarLineas = () => llamar<Linea[]>('/central/lineas');

/** Solo se mandan los campos que acepta el backend para cada ruta. */
export const actualizarLinea = (
  id: string,
  cambios: { nombre?: string; tipo?: Linea['tipo']; tramos?: Tramo[] },
) =>
  llamar<Linea>(`/central/lineas/${id}`, {
    metodo: 'PUT',
    cuerpo: {
      ...cambios,
      // Sin `trazo` o `paradas` el backend conserva lo que tenía; null lo borra.
      tramos: cambios.tramos?.map(({ codigo, nombre, km, tarifaManual, trazo, paradas }) => ({
        codigo,
        nombre,
        km,
        tarifaManual: tarifaManual ?? null,
        ...(trazo !== undefined && { trazo }),
        ...(paradas !== undefined && { paradas }),
      })),
    },
  });

/** Crea una línea con sus rutas. Falla con TRAMO_INVALIDO si una ruta queda sin tarifa. */
export const crearLinea = (datos: {
  codigo: number;
  nombre: string;
  tipo: Linea['tipo'];
  tramos: Pick<Tramo, 'codigo' | 'nombre' | 'km' | 'tarifaManual'>[];
}) => llamar<Linea>('/central/lineas', { metodo: 'POST', cuerpo: datos });

export const listarTabuladores = () => llamar<Tabulador[]>('/central/tabuladores');

/**
 * Publica un tabulador (gaceta). No se puede borrar ni editar después, y avisa a todos los
 * pasajeros (CAMBIO_TARIFA). Falla con TRAMO_INVALIDO si alguna ruta queda fuera de la escala.
 */
export const crearTabulador = (datos: Omit<Tabulador, 'id'>) =>
  llamar<Tabulador>('/central/tabuladores', { metodo: 'POST', cuerpo: datos });

export const listarCategoriasPendientes = () => llamar<Usuario[]>('/central/categorias/pendientes');

export const resolverCategoria = (usuarioId: string, verificada: boolean) =>
  llamar<Usuario>(`/central/usuarios/${usuarioId}/categoria`, {
    metodo: 'PUT',
    cuerpo: { verificada },
  });

export const listarConflictos = (todos = false) =>
  llamar<Conflicto[]>(`/central/conflictos${todos ? '?todos=true' : ''}`);

export const cambiarBloqueo = (usuarioId: string, bloqueado: boolean) =>
  llamar<unknown>(`/central/usuarios/${usuarioId}/bloqueo`, {
    metodo: 'PUT',
    cuerpo: { bloqueado },
  });

export const listarUnidades = () => llamar<Unidad[]>('/central/unidades');

/**
 * El recolector puede ser uno nuevo (`recolector`: se le crea la cuenta), uno existente
 * (`recolectorId`) o ninguno (`recolectorId: null`).
 */
type AsignacionRecolector = { recolector: RecolectorNuevo } | { recolectorId: string | null };

export const crearUnidad = (
  datos: { codigo: number; placa: string; lineaCodigo: number } & Partial<AsignacionRecolector>,
) => llamar<Unidad>('/central/unidades', { metodo: 'POST', cuerpo: datos });

/** Solo se pueden cambiar la línea y el recolector; el código y la placa quedan fijos. */
export const actualizarUnidad = (
  id: string,
  cambios: { lineaCodigo?: number } & Partial<AsignacionRecolector>,
) => llamar<Unidad>(`/central/unidades/${id}`, { metodo: 'PUT', cuerpo: cambios });

export const listarRecolectores = () => llamar<Recolector[]>('/central/recolectores');

export const listarUnidadesMapa = () => llamar<UnidadMapa[]>('/mapa/unidades');
