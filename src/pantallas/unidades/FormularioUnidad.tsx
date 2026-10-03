import { useFormularioUnidad, type ModoRecolector } from '../../hooks/useFormularioUnidad';
import type { Linea, Recolector, Unidad } from '../../nucleo/tipos';
import estilos from '../../componentes/Formulario.module.css';
import { Selector } from '../../componentes/Selector';

interface Props {
  /** null = crear una unidad nueva. */
  unidad: Unidad | null;
  unidades: Unidad[];
  lineas: Linea[];
  recolectores: Recolector[];
  alGuardar: (unidad: Unidad, mensaje: string) => void;
  alCancelar: () => void;
}

const OPCIONES: { modo: ModoRecolector; texto: string; ayuda: string; soloEditar?: boolean }[] = [
  {
    modo: 'actual',
    texto: 'Mantener el actual',
    ayuda: 'No se cambia el recolector.',
    soloEditar: true,
  },
  {
    modo: 'nuevo',
    texto: 'Crear recolector',
    ayuda: 'Se le crea la cuenta para entrar en la app. Los recolectores no se registran solos.',
  },
  {
    modo: 'existente',
    texto: 'Asignar uno existente',
    ayuda: 'Solo aparecen los recolectores que no tienen unidad.',
  },
  {
    modo: 'ninguno',
    texto: 'Sin recolector',
    ayuda: 'La unidad queda registrada, pero nadie puede cobrar en ella hasta asignarle uno.',
  },
];

/** Alta de una unidad (POST /central/unidades) o cambio de línea/recolector (PUT /central/unidades/:id). */
export function FormularioUnidad({
  unidad,
  unidades,
  lineas,
  recolectores,
  alGuardar,
  alCancelar,
}: Props) {
  const f = useFormularioUnidad({
    unidad,
    unidades,
    lineaInicial: lineas[0]?.codigo ?? null,
    alGuardar,
  });
  const libres = recolectores.filter((r) => r.unidadCodigo === null);

  return (
    <form
      className={`tarjeta pila ${estilos.formulario}`}
      onSubmit={(ev) => {
        ev.preventDefault();
        void f.guardar(recolectores);
      }}
    >
      <div>
        <h2 className={estilos.titulo}>
          {f.editando ? `Editar unidad ${unidad?.codigo}` : 'Nueva unidad'}
        </h2>
        <p className="suave">
          {f.editando
            ? 'Puedes cambiarla de línea o asignarle otro recolector. El código y la placa no cambian.'
            : 'Registra el autobús y, si quieres, crea en el mismo paso la cuenta de su recolector.'}
        </p>
      </div>

      <fieldset className={estilos.grupo}>
        <legend>Autobús</legend>
        <div className={estilos.campos}>
          <label className={estilos.campo}>
            Código
            <input
              value={f.codigo}
              onChange={(ev) => f.setCodigo(ev.target.value)}
              disabled={f.editando}
              inputMode="numeric"
              placeholder="103"
            />
            <span className={estilos.ayuda}>Número corto que viaja por NFC</span>
          </label>
          <label className={estilos.campo}>
            Placa
            <input
              value={f.placa}
              onChange={(ev) => f.setPlaca(ev.target.value)}
              disabled={f.editando}
              placeholder="AB123CD"
              maxLength={10}
              autoFocus={!f.editando}
            />
            <span className={estilos.ayuda}>Entre 5 y 10 caracteres</span>
          </label>
          <label className={estilos.campo}>
            Línea
            <Selector
              etiqueta="Línea"
              opciones={lineas.map((l) => ({
                valor: l.codigo,
                texto: l.nombre,
                detalle: `${l.tipo === 'urbana' ? 'Urbana' : 'Suburbana'} · ${l.tramos.length} ${
                  l.tramos.length === 1 ? 'ruta' : 'rutas'
                }`,
              }))}
              valor={f.lineaCodigo}
              alCambiar={f.setLineaCodigo}
              placeholder="Elige la línea"
            />
            <span className={estilos.ayuda}>Las rutas y precios que cobrará</span>
          </label>
        </div>
      </fieldset>

      <fieldset className={estilos.grupo}>
        <legend>Recolector</legend>
        {f.editando && (
          <p className="suave">
            Actual:{' '}
            <strong>
              {unidad?.recolector
                ? `${unidad.recolector.nombre} (${unidad.recolector.telefono})`
                : 'sin recolector'}
            </strong>
          </p>
        )}

        <div className={estilos.opciones} role="radiogroup">
          {OPCIONES.filter((o) => !o.soloEditar || f.editando).map((o) => (
            <label
              key={o.modo}
              className={`${estilos.opcion} ${f.modo === o.modo ? estilos.elegida : ''}`}
            >
              <input
                type="radio"
                name="modo-recolector"
                checked={f.modo === o.modo}
                onChange={() => f.setModo(o.modo)}
              />
              <span>
                <strong>{o.texto}</strong>
                <span className={estilos.ayuda}>{o.ayuda}</span>
              </span>
            </label>
          ))}
        </div>

        {f.modo === 'nuevo' && (
          <div className={estilos.campos}>
            <label className={estilos.campo}>
              Nombre y apellido
              <input
                value={f.nombre}
                onChange={(ev) => f.setNombre(ev.target.value)}
                placeholder="Luis Pérez"
                autoComplete="off"
              />
            </label>
            <label className={estilos.campo}>
              Teléfono
              <input
                value={f.telefono}
                onChange={(ev) => f.setTelefono(ev.target.value)}
                placeholder="04141234567"
                inputMode="tel"
                autoComplete="off"
              />
              <span className={estilos.ayuda}>Con él entra en la app</span>
            </label>
            <label className={estilos.campo}>
              Clave
              <input
                value={f.clave}
                onChange={(ev) => f.setClave(ev.target.value)}
                placeholder="Mínimo 4 caracteres"
                autoComplete="new-password"
              />
              <span className={estilos.ayuda}>Dásela al recolector; luego no se puede ver</span>
            </label>
          </div>
        )}

        {f.modo === 'existente' &&
          (libres.length ? (
            <label className={estilos.campo}>
              Recolector
              <Selector
                etiqueta="Recolector"
                opciones={libres.map((r) => ({
                  valor: r.id,
                  texto: r.nombre,
                  detalle: r.telefono,
                }))}
                valor={f.recolectorId || null}
                alCambiar={f.setRecolectorId}
                placeholder="Elige un recolector…"
              />
            </label>
          ) : (
            <div className="aviso">
              Todos los recolectores ya tienen unidad. Crea uno nuevo o deja la unidad sin
              recolector.
            </div>
          ))}
      </fieldset>

      {f.error && <div className="aviso error">{f.error}</div>}

      <div className="fila">
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="boton secundario"
          onClick={alCancelar}
          disabled={f.guardando}
        >
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={f.guardando}>
          {f.guardando ? 'Guardando…' : f.editando ? 'Guardar cambios' : 'Crear unidad'}
        </button>
      </div>
    </form>
  );
}
