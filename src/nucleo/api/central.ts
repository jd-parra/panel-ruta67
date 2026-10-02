import type {
  Conflicto,
  Linea,
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
      // Sin `trazo` el backend conserva el que tenía; null lo borra.
      tramos: cambios.tramos?.map(({ codigo, nombre, km, tarifaManual, trazo }) => ({
        codigo,
        nombre,
        km,
        tarifaManual: tarifaManual ?? null,
        ...(trazo !== undefined && { trazo }),
      })),
    },
  });

export const listarTabuladores = () => llamar<Tabulador[]>('/central/tabuladores');

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

export const listarUnidadesMapa = () => llamar<UnidadMapa[]>('/mapa/unidades');
