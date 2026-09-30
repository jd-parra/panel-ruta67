// Forma de los datos del backend (bk-ruta67/CONTRATO.md §5 y §6.5). Montos en céntimos.

export type Categoria = 'general' | 'estudiante' | 'exonerado';
export type Rol = 'pasajero' | 'recolector' | 'central';

export interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  rol: Rol;
  categoria?: Categoria;
  categoriaVerificada?: boolean;
  bloqueado?: boolean;
  creadoEn?: string;
}

export interface ErrorApi {
  error: { codigo: string; mensaje: string; detalle?: unknown };
}

export interface Resumen {
  desde: string;
  cobros: number;
  recaudado: number;
  pasajeros: number;
  recargado: number;
  porLinea: { lineaCodigo: number; lineaNombre: string; cobros: number; recaudado: number }[];
  porCategoria: Record<Categoria, { cobros: number; recaudado: number }>;
}

export interface Tramo {
  id?: string;
  codigo: number;
  nombre: string;
  km: number;
  /** Lo que paga un pasajero general en esta ruta con el tabulador vigente. */
  tarifaCompleta?: number;
  /** Precio fijo que reemplaza al del tabulador. */
  tarifaManual?: number | null;
  frecuencia?: number;
}

export interface Linea {
  id: string;
  codigo: number;
  nombre: string;
  tipo: 'urbana' | 'suburbana';
  tramos: Tramo[];
}

export interface Tabulador {
  id: string;
  fuente: string;
  vigenteDesde: string;
  descuentos: Record<Categoria, number>;
  recargoDomingoFeriado: number;
  urbanoMinimo: number;
  suburbano: { hastaKm: number; monto: number }[];
}

export interface Unidad {
  id: string;
  codigo: number;
  placa: string;
  lineaCodigo: number;
  lineaNombre: string;
  recolector: { id: string; nombre: string; telefono: string } | null;
}

export interface Conflicto {
  id: string;
  bid: string;
  pasajero: { id: string; nombre: string; telefono: string; bloqueado: boolean };
  cobroOriginal: {
    unidadCodigo: number;
    recolectorNombre: string;
    monto: number;
    ocurridoEn: string;
  };
  segundoUso: { unidadCodigo: number; recolectorNombre: string; monto: number; ocurridoEn: string };
  creadoEn: string;
  resuelto: boolean;
}

export interface UnidadMapa {
  unidadCodigo: number;
  placa: string;
  lineaNombre: string;
  lat: number;
  lng: number;
  actualizadoEn: string;
}
