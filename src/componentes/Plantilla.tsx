import { NavLink, Outlet } from 'react-router-dom';
import { useSesion } from '../nucleo/auth/SesionContext';
import { SECCIONES } from '../rutas';
import estilos from './Plantilla.module.css';

/** Menú lateral con las secciones del panel (contrato §14) y el contenido a la derecha. */
export function Plantilla() {
  const { usuario, salir } = useSesion();
  return (
    <div className={estilos.raiz}>
      <aside className={estilos.menu}>
        <div className={estilos.marca}>
          <img src="/logo.png" alt="" className={estilos.logo} />
          <div>
            <strong>Ruta67</strong>
            <span>Central</span>
          </div>
        </div>
        <nav className={estilos.enlaces}>
          {SECCIONES.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === '/'}
              className={({ isActive }) =>
                isActive ? `${estilos.enlace} ${estilos.activo}` : estilos.enlace
              }
            >
              {s.titulo}
            </NavLink>
          ))}
        </nav>
        <div className={estilos.pie}>
          <span className="suave">{usuario?.nombre}</span>
          <button className="boton secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className={estilos.contenido}>
        <Outlet />
      </main>
    </div>
  );
}
