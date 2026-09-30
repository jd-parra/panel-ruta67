import type { ComponentType } from 'react';
import { CategoriasPantalla } from './pantallas/CategoriasPantalla';
import { ConflictosPantalla } from './pantallas/ConflictosPantalla';
import { LineasPantalla } from './pantallas/LineasPantalla';
import { MapaPantalla } from './pantallas/MapaPantalla';
import { ResumenPantalla } from './pantallas/ResumenPantalla';
import { TabuladorPantalla } from './pantallas/TabuladorPantalla';
import { UnidadesPantalla } from './pantallas/UnidadesPantalla';

/** Secciones del panel (contrato §14), en el orden del menú. */
export const SECCIONES: { ruta: string; titulo: string; Pantalla: ComponentType }[] = [
  { ruta: '/', titulo: 'Resumen', Pantalla: ResumenPantalla },
  { ruta: '/mapa', titulo: 'Mapa', Pantalla: MapaPantalla },
  { ruta: '/lineas', titulo: 'Líneas y rutas', Pantalla: LineasPantalla },
  { ruta: '/tabulador', titulo: 'Tabulador', Pantalla: TabuladorPantalla },
  { ruta: '/categorias', titulo: 'Categorías pendientes', Pantalla: CategoriasPantalla },
  { ruta: '/conflictos', titulo: 'Conflictos', Pantalla: ConflictosPantalla },
  { ruta: '/unidades', titulo: 'Unidades', Pantalla: UnidadesPantalla },
];
