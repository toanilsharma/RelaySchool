import { IEC_CURVES, ANSI_CURVES, FUSE_CURVES } from '../constants';
import { CurveType } from '../types';

/**
 * Calculates the trip time for a given current based on IEC/ANSI curves.
 */
export const calculateTripTime = (
  current: number,
  pickup: number,
  tms: number,
  type: CurveType,
  instantaneous?: number
): number | null => {
  // Input validation
  if (current <= 0 || pickup <= 0 || tms < 0) return null;

  // If current is below pickup, no trip
  if (current < pickup) return null;

  // Check Instantaneous (50)
  if (instantaneous && current >= instantaneous) {
    return 0.02; // 20ms fixed mechanical delay
  }

  // Definite Time
  if (type === CurveType.DT_DEFINITE_TIME) {
    return tms; // In DT, TMS usually acts as the fixed time delay
  }

  const M = current / pickup; // Multiple of pickup
  // Avoid division by zero or negative logs if M=1 (asymptotic)
  if (M <= 1.001) return null;

  // Check IEC
  if (IEC_CURVES[type]) {
      const { k, alpha } = IEC_CURVES[type];
      // IEC Formula: t = TMS * (k / (M^alpha - 1))
      const time = tms * (k / (Math.pow(M, alpha) - 1));
      return Number.isFinite(time) ? time : null;
  }

  // Check ANSI
  if (ANSI_CURVES[type]) {
      const { A, B, p } = ANSI_CURVES[type];
      // ANSI Formula: t = TDS * ( A / (M^p - 1) + B )
      const time = tms * ( (A / (Math.pow(M, p) - 1)) + B );
      return Number.isFinite(time) ? time : null;
  }

  // Check FUSE/MCCB (Approximated as steep inverse curves for static sim)
  if (FUSE_CURVES[type]) {
      const { k, alpha } = FUSE_CURVES[type];
      const time = tms * (k / (Math.pow(M, alpha))); // Simplified fuse model without -1 asymptote for smoother plotting
      return Number.isFinite(time) ? time : null;
  }

  return null; 
};

/**
 * Simulates a sinusoidal waveform with optional harmonics/saturation.
 */
export const generateWaveform = (
  cycles: number,
  frequency: number,
  magnitude: number,
  phaseShift: number, // degrees
  saturationFactor: number = 0
) => {
  const points: { x: number; y: number }[] = [];
  const samplesPerCycle = 36;
  const totalSamples = cycles * samplesPerCycle;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / samplesPerCycle; // Time in cycles
    const angle = (t * 2 * Math.PI) + (phaseShift * Math.PI / 180);
    
    let val = magnitude * Math.sin(angle);

    // Simple clipping to simulate CT saturation
    if (saturationFactor > 0) {
      const limit = magnitude * (1 - saturationFactor);
      if (val > limit) val = limit + (val - limit) * 0.1;
      if (val < -limit) val = -limit + (val + limit) * 0.1;
    }

    points.push({ x: i, y: val });
  }
  return points;
};

/**
 * Basic Impedance Calculation Z = R + jX
 */
export const calculateFaultCurrent = (voltage: number, r: number, x: number) => {
  const z = Math.sqrt(r * r + x * x);
  return z === 0 ? 0 : voltage / z;
};

/**
 * Generates points for a Mho Circle characteristic (Distance Protection)
 * Center is typically at (0, reach/2) for a self-polarized mho passing through origin.
 */
export const generateMhoCircle = (reach: number, centerX: number = 0, centerY: number = 0) => {
    const points: { x: number; y: number }[] = [];
    const radius = reach / 2;
    // Default Mho: Center at (0, R/2), passing through 0,0
    const cx = centerX;
    const cy = centerY || radius; 

    for (let i = 0; i <= 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        const x = cx + radius * Math.cos(rad);
        const y = cy + radius * Math.sin(rad);
        points.push({ x, y });
    }
    return points;
};