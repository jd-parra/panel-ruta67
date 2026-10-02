import { useState } from 'react';
import { EstadoCarga } from '../componentes/Estados';
import { Encabezado } from '../componentes/Encabezado';
import { useCarga } from '../hooks/useCarga';
import { listarTabuladores } from '../nucleo/api/central';
import type { Categoria, Tabulador } from '../nucleo/tipos';
import {
  formatearBs,
  formatearFechaHora,
  formatearPorcentaje,
  NOMBRE_CATEGORIA,
} from '../utils/formato';
import { FormularioTabulador } from './tabulador/FormularioTabulador';
import estilos from './TabuladorPantalla.module.css';

const CATEGORIAS = Object.keys(NOMBRE_CATEGORIA) as Categoria[];

/** Misma fórmula que shared/tarifa.js (contrato §7): el único redondeo es al céntimo. */
const precio = (completa: number, descuento: number, recargo = 0) =>
  Math.round(completa * (1 + recargo) * (1 - descuento));

/** "Hasta 10 km" · "De 10 a 20 km" · "Más de 10 km" (9999 = sin tope). */
function nombreRango(t: Tabulador, i: number) {
  const { hastaKm } = t.suburbano[i];
  const anterior = t.suburbano[i - 1]?.hastaKm;
  if (i === 0) return hastaKm >= 9999 ? 'Cualquier distancia' : `Hasta ${hastaKm} km`;
  return hastaKm >= 9999 ? `Más de ${anterior} km` : `De ${anterior} a ${hastaKm} km`;
}

/** Separa el vigente (el último que ya empezó), los próximos y los anteriores. */
function clasificar(lista: Tabulador[]) {
  const ahora = Date.now();
  const ordenados = [...lista].sort(
    (a, b) => Date.parse(b.vigenteDesde) - Date.parse(a.vigenteDesde),
  );
  const proximos = ordenados.filter((t) => Date.parse(t.vigenteDesde) > ahora).reverse();
  const pasados = ordenados.filter((t) => Date.parse(t.vigenteDesde) <= ahora);
  return { vigente: pasados[0] ?? null, proximos, anteriores: pasados.slice(1) };
}

/**
 * Tabuladores de la gaceta (GET /central/tabuladores): lo que cuesta el pasaje.
 * La app del recolector calcula cada cobro con el vigente, sin internet.
 */
export function TabuladorPantalla() {
  const { datos, error, cargando, recargar } = useCarga(listarTabuladores);
  const { vigente, proximos, anteriores } = clasificar(datos ?? []);
  const [creando, setCreando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const alCrear = (t: Tabulador) => {
    setCreando(false);
    setExito(
      `Tabulador «${t.fuente}» publicado. Entra en vigor el ${formatearFechaHora(t.vigenteDesde)}; los pasajeros ya fueron avisados.`,
    );
    void recargar();
  };

  return (
    <>
      <Encabezado
        titulo="Tabulador"
        subtitulo="Los precios oficiales del pasaje según la gaceta. Con ellos se calcula cada cobro."
        acciones={
          <button
            className="boton"
            onClick={() => {
              setExito(null);
              setCreando(true);
            }}
            disabled={creando || cargando}
          >
            + Nuevo tabulador
          </button>
        }
      />

      {exito && (
        <div className="aviso exito fila" style={{ marginBottom: 16 }}>
          <span style={{ flex: 1 }}>{exito}</span>
          <button className="boton secundario" onClick={() => setExito(null)}>
            Cerrar
          </button>
        </div>
      )}

      {creando && (
        <FormularioTabulador
          // Parte del más reciente: si ya hay uno próximo, de ese.
          vigente={proximos[proximos.length - 1] ?? vigente}
          existentes={datos ?? []}
          alCrear={alCrear}
          alCancelar={() => setCreando(false)}
        />
      )}

      <EstadoCarga
        cargando={cargando}
        error={error}
        vacio={!datos?.length}
        mensajeVacio="Todavía no hay tabuladores cargados."
        onReintentar={() => void recargar()}
      >
        <div className="pila">
          {proximos.map((t) => (
            <AvisoProximo key={t.id} tabulador={t} vigente={vigente} />
          ))}
          {vigente && <TabuladorVigente tabulador={vigente} />}
          {anteriores.length > 0 && <Historial tabuladores={anteriores} />}
        </div>
      </EstadoCarga>
    </>
  );
}

function TabuladorVigente({ tabulador: t }: { tabulador: Tabulador }) {
  const columnas = [
    { titulo: 'Urbano', completa: t.urbanoMinimo },
    ...t.suburbano.map((r, i) => ({
      titulo: `Suburbano · ${nombreRango(t, i)}`,
      completa: r.monto,
    })),
  ];

  return (
    <section className={`tarjeta ${estilos.vigente}`}>
      <header className={estilos.cabecera}>
        <div>
          <span className="etiqueta exito">● Vigente</span>
          <h2 className={estilos.fuente}>{t.fuente}</h2>
          <p className="suave">Desde el {formatearFechaHora(t.vigenteDesde)}</p>
        </div>
      </header>

      <div className={estilos.cifras}>
        <Cifra
          titulo="Pasaje urbano"
          valor={formatearBs(t.urbanoMinimo)}
          detalle="Precio completo dentro de la ciudad"
          destacada
        />
        <Cifra
          titulo="Recargo domingo y feriado"
          valor={
            t.recargoDomingoFeriado
              ? `+${formatearPorcentaje(t.recargoDomingoFeriado)}`
              : 'Sin recargo'
          }
          detalle={
            t.recargoDomingoFeriado ? 'Se suma al precio esos días' : 'Mismo precio todos los días'
          }
        />
        <div className={estilos.cifra}>
          <span className={estilos.cifraTitulo}>Escala suburbana</span>
          <ul className={estilos.escala}>
            {t.suburbano.map((r, i) => (
              <li key={i}>
                <span>{nombreRango(t, i)}</span>
                <strong>{formatearBs(r.monto)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={estilos.matriz}>
        <h3 className={estilos.subtitulo}>Cuánto paga cada pasajero</h3>
        <div className={estilos.tabla}>
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Descuento</th>
                {columnas.map((c) => (
                  <th key={c.titulo} className="numero">
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIAS.map((cat) => {
                const d = t.descuentos[cat];
                return (
                  <tr key={cat}>
                    <td>
                      <strong>{NOMBRE_CATEGORIA[cat]}</strong>
                    </td>
                    <td>
                      <span className={`etiqueta ${d > 0 ? 'exito' : ''}`}>
                        {d > 0 ? `−${formatearPorcentaje(d)}` : 'Sin descuento'}
                      </span>
                    </td>
                    {columnas.map((c) => {
                      const monto = precio(c.completa, d);
                      return (
                        <td key={c.titulo} className="numero">
                          {monto === 0 ? <span className="suave">Gratis</span> : formatearBs(monto)}
                          {t.recargoDomingoFeriado > 0 && monto > 0 && (
                            <span className={estilos.domingo}>
                              Dom/feriado{' '}
                              {formatearBs(precio(c.completa, d, t.recargoDomingoFeriado))}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={`suave ${estilos.nota}`}>
          Las rutas con <strong>precio fijo</strong> (en Líneas y rutas) no usan esta tabla, pero sí
          los descuentos.
        </p>
      </div>
    </section>
  );
}

function AvisoProximo({
  tabulador: t,
  vigente,
}: {
  tabulador: Tabulador;
  vigente: Tabulador | null;
}) {
  const diferencia = vigente ? t.urbanoMinimo - vigente.urbanoMinimo : 0;
  return (
    <section className={`tarjeta ${estilos.proximo}`}>
      <span className={`etiqueta ${estilos.etiquetaProximo}`}>Próximo</span>
      <div className={estilos.proximoTexto}>
        <strong>{t.fuente}</strong>
        <span>
          Entra en vigor el {formatearFechaHora(t.vigenteDesde)}: pasaje urbano{' '}
          <strong>{formatearBs(t.urbanoMinimo)}</strong>
          {diferencia !== 0 &&
            ` (${diferencia > 0 ? 'sube' : 'baja'} ${formatearBs(Math.abs(diferencia))})`}
          . Los pasajeros ya fueron avisados.
        </span>
      </div>
    </section>
  );
}

function Historial({ tabuladores }: { tabuladores: Tabulador[] }) {
  return (
    <details className={`tarjeta sin-relleno ${estilos.historial}`}>
      <summary>Tabuladores anteriores ({tabuladores.length})</summary>
      <table>
        <thead>
          <tr>
            <th>Fuente</th>
            <th>Desde</th>
            <th className="numero">Urbano</th>
            <th className="numero">Suburbano</th>
          </tr>
        </thead>
        <tbody>
          {tabuladores.map((t) => (
            <tr key={t.id}>
              <td>{t.fuente}</td>
              <td className="suave">{formatearFechaHora(t.vigenteDesde)}</td>
              <td className="numero">{formatearBs(t.urbanoMinimo)}</td>
              <td className="numero">{t.suburbano.map((r) => formatearBs(r.monto)).join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function Cifra({
  titulo,
  valor,
  detalle,
  destacada,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  destacada?: boolean;
}) {
  return (
    <div className={`${estilos.cifra} ${destacada ? estilos.destacada : ''}`}>
      <span className={estilos.cifraTitulo}>{titulo}</span>
      <strong className={estilos.cifraValor}>{valor}</strong>
      <span className={estilos.cifraDetalle}>{detalle}</span>
    </div>
  );
}
