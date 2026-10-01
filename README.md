# Ruta67 — panel de la central

Panel web de la central (Mérida) de Ruta67 (MVP Pasaje): React + Vite + TypeScript. Habla con el backend
[`bk-ruta67`](https://github.com/jd-parra/bk-ruta67); qué expone la API está en su `CONTRATO.md` (§6.5 central, §11 tiempo real).

## Arrancar

```bash
cp .env.example .env    # VITE_API_URL = URL del backend (sin /api/v1)
pnpm install
pnpm dev                # http://localhost:5173
pnpm build              # tsc + vite build
pnpm lint
pnpm formato
```

Entra con una cuenta de rol **central** (en la BD de pruebas, `04140000003` / `1234`; en producción, la que crea `scripts/iniciarProduccion.js` del backend). Pasajeros y recolectores usan la app.

En producción el backend debe listar el origen del panel en `CORS_ORIGENES`.

## Secciones (contrato §14)

| Sección               | Qué hace                                                                            | Endpoints                                                                   |
| --------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Resumen               | Recaudado, cobros, pasajeros y recargas de hoy / 7 / 30 días, por línea y categoría | `GET /central/resumen`                                                      |
| Mapa                  | Unidades en ruta en tiempo real                                                     | `GET /mapa/unidades` + `unidad:ubicacion`                                   |
| Líneas y rutas        | Editar nombre, tipo, rutas (km) y precio fijo; agregar rutas                        | `GET/PUT /central/lineas`                                                   |
| Tabulador             | Tabuladores vigente, próximo y anteriores                                           | `GET /central/tabuladores`                                                  |
| Categorías pendientes | Aprobar o rechazar estudiantes y exonerados                                         | `GET /central/categorias/pendientes`, `PUT /central/usuarios/:id/categoria` |
| Conflictos            | Boletos cobrados dos veces; desbloquear la cuenta                                   | `GET /central/conflictos`, `PUT /central/usuarios/:id/bloqueo`              |
| Unidades              | Unidades, línea y recolector                                                        | `GET /central/unidades`                                                     |

Pendiente: crear tabulador, crear líneas y crear unidades/recolectores (los endpoints ya existen).

## Convenciones

Todo en español (identificadores sin tildes ni ñ). En pantalla se dice **ruta** a lo que el contrato llama **tramo**.

```
src/
  nucleo/       config, cliente de la API, tipos, sesión, socket
  hooks/        lógica reutilizable (useCarga, useEditorLinea, useUnidadesMapa)
  componentes/  piezas compartidas (Plantilla, Encabezado, Estados, MapaLeaflet)
  pantallas/    una por sección del menú
  utils/        formatos y colores
  rutas.tsx     secciones del menú
```
