import { useState, type FormEvent } from 'react';
import { mensajeDeError } from '../nucleo/api/cliente';
import { useSesion } from '../nucleo/auth/SesionContext';
import estilos from './LoginPantalla.module.css';

/** Login de la central con teléfono y clave (POST /auth/login). */
export function LoginPantalla() {
  const { entrar } = useSesion();
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await entrar(telefono.trim(), clave);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={estilos.fondo}>
      <form className={`tarjeta ${estilos.caja}`} onSubmit={(e) => void enviar(e)}>
        <span className={estilos.logo}>P</span>
        <h1>Pasaje · Central</h1>
        <p className="suave">Panel de la central de transporte</p>

        <label className={estilos.campo}>
          Teléfono
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="04140000003"
            inputMode="tel"
            autoComplete="username"
            required
          />
        </label>
        <label className={estilos.campo}>
          Clave
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="aviso error">{error}</div>}

        <button className="boton" disabled={enviando || !telefono || !clave}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
