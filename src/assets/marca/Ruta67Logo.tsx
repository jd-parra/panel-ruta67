// Ruta67Logo.tsx — logo de Ruta67 con el "67" animado (el 67 se mece en contrafase y la señal se enciende y se apaga).
// Requiere: react-native-svg (en Expo: `npx expo install react-native-svg`).
// Uso:
//   <Ruta67Logo variante="icono" alto={96} />                 // pantalla de carga
//   <Ruta67Logo variante="horizontal" alto={40} />            // encabezado
//   <Ruta67Logo variante="horizontal" alto={40} negativo />   // sobre fondo morado/oscuro
//   <Ruta67Logo variante="icono" alto={64} animado={false} /> // quieto
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const C = {
  violeta: '#5B21B6',
  oscuro: '#3B0F7A',
  amarillo: '#F5B014',
  tinta: '#1E1830',
  blanco: '#FFFFFF',
};

const SEIS = 'M45 12L17.2 54A24 24 0 0 0 58.8 78A24 24 0 0 0 17.2 54';
const SIETE = 'M6 12H66L30 90';
const LETRAS: [string, number][] = [
  ['M10 90V10H40A24 24 0 0 1 40 58H10M38 58L64 90', 0], // R
  ['M10 38V62A26 26 0 0 0 62 62M62 38V90', 86], // u
  ['M24 14V74A16 16 0 0 0 40 90H48M6 38H48', 174], // t
  ['M62 64A26 26 0 1 1 10 64A26 26 0 1 1 62 64M62 38V90', 244], // a
];
const TRAZO = { fill: 'none', strokeWidth: 20, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

type Props = {
  variante?: 'icono' | 'horizontal';
  alto?: number;
  animado?: boolean;
  negativo?: boolean; // palabra blanca y 67 amarillo, para fondos oscuros
  duracion?: number; // ms de cada subida o bajada
};

/** Vaivén continuo entre +amplitud y -amplitud, con aceleración y frenado suaves.
 *  `invertido` arranca en el extremo opuesto: así el 7 baja mientras el 6 sube. */
function useVaiven(amplitud: number, tramo: number, invertido: boolean, activo: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!activo) {
      v.setValue(0);
      return;
    }
    const abajo = invertido ? -amplitud : amplitud;
    const curva = Easing.bezier(0.65, 0, 0.35, 1);
    v.setValue(abajo);
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: -abajo, duration: tramo, easing: curva, useNativeDriver: true }),
        Animated.timing(v, { toValue: abajo, duration: tramo, easing: curva, useNativeDriver: true }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [v, amplitud, tramo, invertido, activo]);
  return v;
}

/** La señal: cada onda se enciende, se queda y se apaga, en bucle de 2,6 s.
 *  La onda de afuera arranca 0,35 s después, así la señal "sale" del autobús. */
function useSenal(retraso: number, activo: boolean) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!activo) {
      o.setValue(1);
      return;
    }
    const suave = Easing.inOut(Easing.ease);
    o.setValue(0.3);
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 390, easing: suave, useNativeDriver: false }),
        Animated.delay(1300),
        Animated.timing(o, { toValue: 0.3, duration: 520, easing: suave, useNativeDriver: false }),
        Animated.delay(390),
      ]),
    );
    const inicio = Animated.sequence([Animated.delay(retraso), ciclo]);
    inicio.start();
    return () => inicio.stop();
  }, [o, retraso, activo]);
  return o;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function useMovimientoPermitido(animado: boolean) {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducir);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => sub.remove();
  }, []);
  return animado && !reducir;
}

/** La buseta (sin los dígitos), en coordenadas de 0 a 100. */
function Buseta({ conCuadro = true, senal = true }: { conCuadro?: boolean; senal?: boolean }) {
  const o1 = useSenal(0, senal);
  const o2 = useSenal(350, senal);
  return (
    <>
      {conCuadro && <Rect width={100} height={100} rx={24} fill={C.violeta} />}
      <Rect x={26} y={30} width={46} height={46} rx={9} fill={C.blanco} />
      <Rect x={31} y={36} width={36} height={21} rx={4} fill={C.oscuro} />
      <Circle cx={36} cy={66} r={3.6} fill={C.amarillo} />
      <Circle cx={62} cy={66} r={3.6} fill={C.amarillo} />
      <Rect x={31} y={75} width={8} height={7} rx={2} fill={C.blanco} />
      <Rect x={59} y={75} width={8} height={7} rx={2} fill={C.blanco} />
      <AnimatedPath d="M72 22A8 8 0 0 1 80 30" opacity={o1} fill="none" stroke={C.amarillo} strokeWidth={4.5} strokeLinecap="round" />
      <AnimatedPath d="M72 14A16 16 0 0 1 88 30" opacity={o2} fill="none" stroke={C.amarillo} strokeWidth={4.5} strokeLinecap="round" />
    </>
  );
}

/** El 67 dentro del parabrisas: cada dígito en su capa, recortado por el vidrio. */
function DigitosParabrisas({ k, activo, duracion }: { k: number; activo: boolean; duracion: number }) {
  const amp = 2 * k;
  const y6 = useVaiven(amp, duracion, false, activo);
  const y7 = useVaiven(amp, duracion, true, activo);
  const capa = (d: string, dx: number, y: Animated.Value) => (
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, transform: [{ translateY: y }] }}>
      <Svg width={36 * k} height={21 * k} viewBox="31 36 36 21">
        <G transform="translate(38.6 39.74) scale(0.13)">
          <Path d={d} transform={`translate(${dx} 0)`} stroke={C.blanco} {...TRAZO} />
        </G>
      </Svg>
    </Animated.View>
  );
  return (
    <View style={{ position: 'absolute', left: 31 * k, top: 36 * k, width: 36 * k, height: 21 * k, borderRadius: 4 * k, overflow: 'hidden' }}>
      {capa(SEIS, -6, y6)}
      {capa(SIETE, 84, y7)}
    </View>
  );
}

export default function Ruta67Logo({ variante = 'horizontal', alto = 40, animado = true, negativo = false, duracion = 1300 }: Props) {
  const activo = useMovimientoPermitido(animado);
  const k = alto / 100; // 1 unidad del dibujo = k px
  const colorPalabra = negativo ? C.blanco : C.tinta;
  const color67 = negativo ? C.amarillo : C.violeta;

  // el 67 de la palabra: escala 0,5 → amplitud 4,5 unidades
  const ampP = 4.5 * k;
  const y6 = useVaiven(ampP, duracion, false, activo && variante === 'horizontal');
  const y7 = useVaiven(ampP, duracion, true, activo && variante === 'horizontal');

  if (variante === 'icono') {
    return (
      <View style={{ width: alto, height: alto }} accessible accessibilityRole="image" accessibilityLabel="Ruta67">
        <Svg width={alto} height={alto} viewBox="0 0 100 100">
          <Buseta senal={activo} />
        </Svg>
        <DigitosParabrisas k={k} activo={activo} duracion={duracion} />
      </View>
    );
  }

  const ancho = 374 * k;
  const digito = (d: string, origenX: number, minX: number, y: Animated.Value) => (
    <Animated.View
      style={{
        position: 'absolute',
        left: (124 + 0.5 * (origenX + minX)) * k,
        top: (25 + 0.5 * -20) * k,
        transform: [{ translateY: y }],
      }}>
      <Svg width={45 * k} height={70 * k} viewBox={`${minX} -20 90 140`}>
        <Path d={d} stroke={color67} {...TRAZO} />
      </Svg>
    </Animated.View>
  );

  return (
    <View style={{ width: ancho, height: alto }} accessible accessibilityRole="image" accessibilityLabel="Ruta67">
      <Svg width={ancho} height={alto} viewBox="0 0 374 100">
        <Buseta senal={activo} />
        <G transform="translate(124 25) scale(0.5)">
          {LETRAS.map(([d, x]) => (
            <Path key={x} d={d} transform={`translate(${x} 0)`} stroke={colorPalabra} {...TRAZO} />
          ))}
        </G>
      </Svg>
      <DigitosParabrisas k={k} activo={false} duracion={duracion} />
      {digito(SEIS, 322, 0, y6)}
      {digito(SIETE, 412, -10, y7)}
    </View>
  );
}
