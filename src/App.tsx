import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Plantilla } from './componentes/Plantilla';
import { SesionProvider, useSesion } from './nucleo/auth/SesionContext';
import { LoginPantalla } from './pantallas/LoginPantalla';
import { SECCIONES } from './rutas';

function Rutas() {
  const { usuario, cargando } = useSesion();
  if (cargando)
    return (
      <p className="suave" style={{ padding: 32 }}>
        Cargando…
      </p>
    );
  if (!usuario) return <LoginPantalla />;
  return (
    <Routes>
      <Route element={<Plantilla />}>
        {SECCIONES.map(({ ruta, Pantalla }) => (
          <Route key={ruta} path={ruta} element={<Pantalla />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <SesionProvider>
      <BrowserRouter>
        <Rutas />
      </BrowserRouter>
    </SesionProvider>
  );
}
