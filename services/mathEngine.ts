import { IEC_CURVES, ANSI_CURVES, FUSE_CURVES, MANUFACTURER_CURVES } from '../constants';
import { CurveType } from '../types';

/**
 * Calculates the trip time for a given current based on IEC/ANSI/Manufacturer curves.
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

  // Check Manufacturer Curves (SEL, ABB, GE — use ANSI formula structure)
  if (MANUFACTURER_CURVES[type]) {
      const { A, B, p } = MANUFACTURER_CURVES[type];
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
 * Generates an Electromagnetic Transient (EMT) waveform with decaying DC offset.
 * Models the first few cycles of a fault where DC offset distorts the sinusoidal waveform.
 * 
 * @param cycles - Number of cycles to simulate
 * @param frequency - System frequency (50 or 60 Hz)
 * @param faultMagnitude - Peak fault current magnitude (Amps)
 * @param pointOnWave - Inception angle in degrees (0 = voltage zero crossing, 90 = voltage max)
 * @param xrRatio - X/R ratio of the fault path (higher = slower DC decay)
 * @returns Array of {x, y} points
 */
export const generateEMTWaveform = (
  cycles: number,
  frequency: number,
  faultMagnitude: number,
  pointOnWave: number,
  xrRatio: number
) => {
  const points: { x: number; y: number }[] = [];
  const samplesPerCycle = 64; // Higher resolution for EMT
  const totalSamples = cycles * samplesPerCycle;
  const omega = 2 * Math.PI * frequency;
  const tau = xrRatio / omega; // DC time constant L/R = X/(2πfR) = (X/R)/(2πf)
  const inceptionRad = (pointOnWave * Math.PI) / 180;

  for (let i = 0; i < totalSamples; i++) {
    const t = (i / samplesPerCycle) / frequency; // Time in seconds
    const angle = omega * t + inceptionRad;

    // AC Component
    const iac = faultMagnitude * Math.sin(angle);
    // DC Offset Component (decaying exponential)
    const idc = -faultMagnitude * Math.sin(inceptionRad) * Math.exp(-t / tau);
    // Total instantaneous current
    const iTotal = iac + idc;

    points.push({ x: i, y: iTotal });
  }
  return points;
};

/**
 * CT Saturation Model (Jiles-Atherton inspired simplified model)
 * Simulates the non-linear B-H curve of a CT core.
 *
 * @param primaryCurrent - Primary fault current (A rms)
 * @param ctRatio - CT turns ratio (e.g., 400 for 400:5)
 * @param burden - Total burden in Ohms (relay + leads)
 * @param kneePointVoltage - Knee-point voltage Vk (Volts rms)
 * @param coreSaturationFactor - 0 to 1, how aggressively the core saturates beyond Vk
 * @returns Array of {x, y} points representing secondary current waveform
 */
export const simulateCTSaturation = (
  primaryCurrent: number,
  ctRatio: number,
  burden: number,
  kneePointVoltage: number,
  coreSaturationFactor: number = 0.85
) => {
  const points: { x: number; y: number }[] = [];
  const cycles = 6;
  const samplesPerCycle = 64;
  const totalSamples = cycles * samplesPerCycle;
  const frequency = 50;
  const omega = 2 * Math.PI * frequency;

  const idealSecondary = primaryCurrent / ctRatio;
  const peakSecondary = idealSecondary * Math.SQRT2;

  // Vk peak corresponds to the voltage where core begins to saturate
  const vkPeak = kneePointVoltage * Math.SQRT2;
  // Saturation onset in terms of secondary current
  const satOnsetCurrent = vkPeak / (burden * omega * (1 / (2 * Math.PI * frequency)));
  // Simplified: onset when V_secondary > Vk
  const vSecPeak = peakSecondary * burden;

  let fluxIntegral = 0; // Simulated flux linkage (integral of voltage)

  for (let i = 0; i < totalSamples; i++) {
    const t = (i / samplesPerCycle) / frequency;
    const angle = omega * t;

    // Ideal secondary current (sinusoidal)
    const iIdeal = peakSecondary * Math.sin(angle);

    // Induced voltage proportional to di/dt
    const vInduced = peakSecondary * burden * Math.cos(angle);

    // Accumulate flux
    fluxIntegral += vInduced / (samplesPerCycle * frequency);

    // Saturation effect: if flux exceeds knee-point level, clip the output
    const fluxLimit = vkPeak / (omega);
    let saturationRatio = 1.0;

    if (Math.abs(fluxIntegral) > fluxLimit * coreSaturationFactor) {
      const excess = (Math.abs(fluxIntegral) - fluxLimit * coreSaturationFactor) / (fluxLimit * 0.3);
      saturationRatio = 1.0 / (1.0 + excess * excess); // Smooth saturation curve
    }

    const iActual = iIdeal * saturationRatio;
    points.push({ x: i, y: iActual });
  }
  return points;
};

/**
 * Discrete Fourier Transform for harmonic analysis.
 * Extracts the magnitude of fundamental and specified harmonic from a waveform.
 * Used for transformer differential protection harmonic restraint.
 *
 * @param samples - Array of waveform sample values
 * @param samplesPerCycle - Number of samples per power cycle
 * @param harmonicOrder - Which harmonic to extract (2 for 2nd, 5 for 5th, etc.)
 * @returns Object with fundamental magnitude and harmonic magnitude, plus their ratio
 */
export const extractHarmonic = (
  samples: number[],
  samplesPerCycle: number,
  harmonicOrder: number
): { fundamental: number; harmonic: number; ratio: number } => {
  // Use the last full cycle for DFT
  const startIdx = Math.max(0, samples.length - samplesPerCycle);
  const cycleSamples = samples.slice(startIdx, startIdx + samplesPerCycle);
  const N = cycleSamples.length;

  if (N === 0) return { fundamental: 0, harmonic: 0, ratio: 0 };

  // DFT at fundamental frequency (k=1)
  let realF = 0, imagF = 0;
  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * 1 * n) / N;
    realF += cycleSamples[n] * Math.cos(angle);
    imagF -= cycleSamples[n] * Math.sin(angle);
  }
  const fundamental = (2 / N) * Math.sqrt(realF * realF + imagF * imagF);

  // DFT at specified harmonic order
  let realH = 0, imagH = 0;
  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * harmonicOrder * n) / N;
    realH += cycleSamples[n] * Math.cos(angle);
    imagH -= cycleSamples[n] * Math.sin(angle);
  }
  const harmonic = (2 / N) * Math.sqrt(realH * realH + imagH * imagH);

  return {
    fundamental,
    harmonic,
    ratio: fundamental > 0 ? harmonic / fundamental : 0
  };
};

/**
 * Generate a transformer inrush current waveform with high 2nd harmonic content.
 * Used for testing harmonic restraint logic in differential protection.
 *
 * @param magnitude - Peak inrush current magnitude
 * @param cycles - Number of cycles
 * @param decayRate - How fast the inrush decays (0.1 = slow, 0.5 = fast)
 * @returns Array of {x, y} points
 */
export const generateInrushWaveform = (
  magnitude: number,
  cycles: number = 10,
  decayRate: number = 0.15
) => {
  const points: { x: number; y: number }[] = [];
  const samplesPerCycle = 64;
  const totalSamples = cycles * samplesPerCycle;
  const frequency = 50;

  for (let i = 0; i < totalSamples; i++) {
    const t = (i / samplesPerCycle) / frequency;
    const angle = 2 * Math.PI * frequency * t;
    const envelope = magnitude * Math.exp(-decayRate * t * frequency);

    // Inrush: asymmetric waveform with strong 2nd harmonic
    // Fundamental + 63% 2nd harmonic + 26% 3rd harmonic (typical transformer inrush)
    const fundamental = Math.sin(angle);
    const second = 0.63 * Math.sin(2 * angle + Math.PI / 4);
    const third = 0.26 * Math.sin(3 * angle);

    // Clip negative half-cycle (characteristic of inrush)
    let val = envelope * (fundamental + second + third);
    if (val < -0.1 * envelope) val = -0.1 * envelope * (1 - Math.exp(-t * 10));

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
 * Arc Resistance Calculator (Warrington formula)
 * R_arc = 28710 * gap / I^1.4
 *
 * @param gapLength - Arc gap in meters (typical: 1-3m for transmission lines)
 * @param faultCurrent - Fault current in Amps
 * @returns Arc resistance in Ohms
 */
export const calculateArcResistance = (gapLength: number, faultCurrent: number): number => {
  if (faultCurrent <= 0) return 0;
  return (28710 * gapLength) / Math.pow(faultCurrent, 1.4);
};

/**
 * Apparent impedance seen by relay with arc resistance and infeed.
 *
 * @param lineZ_R - Line resistance (Ohms)
 * @param lineZ_X - Line reactance (Ohms)
 * @param faultLocation - Per-unit location of fault on line (0 to 1)
 * @param arcResistance - Arc resistance in Ohms
 * @param infeedRatio - Ratio of total fault current to relay current (>=1, 1 = no infeed)
 * @returns Apparent impedance {r, x}
 */
export const calculateApparentImpedance = (
  lineZ_R: number,
  lineZ_X: number,
  faultLocation: number,
  arcResistance: number,
  infeedRatio: number = 1.0
): { r: number; x: number } => {
  // Z_apparent = m * Z_line + R_arc * (I_fault / I_relay)
  // where m = fault location (0 to 1)
  const r = faultLocation * lineZ_R + arcResistance * infeedRatio;
  const x = faultLocation * lineZ_X;
  return { r, x };
};

/**
 * Zero-Sequence Mutual Coupling impedance for parallel lines.
 * Z0m typically 50-70% of Z0 self.
 *
 * @param z0_self_R - Zero-sequence self resistance
 * @param z0_self_X - Zero-sequence self reactance
 * @param couplingFactor - Mutual coupling factor (0.5-0.7 typical)
 * @returns Mutual impedance {r, x}
 */
export const calculateMutualCoupling = (
  z0_self_R: number,
  z0_self_X: number,
  couplingFactor: number = 0.6
): { r: number; x: number } => {
  return {
    r: z0_self_R * couplingFactor,
    x: z0_self_X * couplingFactor
  };
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

/**
 * COMTRADE CFG parser — parses IEEE C37.111 configuration text.
 * Returns metadata and channel definitions.
 */
export const parseCOMTRADEConfig = (cfgText: string) => {
  const lines = cfgText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  // Line 1: Station name, rec dev id, rev year
  const [stationName, recDevId, revYear] = lines[0].split(',').map(s => s.trim());

  // Line 2: TT, ##A, ##D  (total channels, analog count, digital count)
  const line2Parts = lines[1].split(',').map(s => s.trim());
  const totalChannels = parseInt(line2Parts[0]) || 0;
  const analogCount = parseInt(line2Parts[1]) || 0;
  const digitalCount = parseInt(line2Parts[2]) || 0;

  // Parse analog channel definitions (lines 3 to 2+analogCount)
  const analogChannels: { id: number; name: string; phase: string; unit: string; multiplier: number; offset: number }[] = [];
  for (let i = 0; i < analogCount && (2 + i) < lines.length; i++) {
    const parts = lines[2 + i].split(',').map(s => s.trim());
    analogChannels.push({
      id: parseInt(parts[0]) || i + 1,
      name: parts[1] || `CH${i + 1}`,
      phase: parts[2] || '',
      unit: parts[4] || 'A',
      multiplier: parseFloat(parts[5]) || 1,
      offset: parseFloat(parts[6]) || 0,
    });
  }

  return {
    stationName,
    recDevId,
    revYear: revYear || '1999',
    totalChannels,
    analogCount,
    digitalCount,
    analogChannels,
  };
};

/**
 * COMTRADE DAT parser — parses ASCII data file.
 * Returns array of timestamped sample arrays.
 */
export const parseCOMTRADEData = (datText: string, analogCount: number) => {
  const lines = datText.split(/\r?\n/).filter(l => l.trim());
  const records: { sampleNum: number; timestamp: number; channels: number[] }[] = [];

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2 + analogCount) continue;
    const sampleNum = parseInt(parts[0]);
    const timestamp = parseInt(parts[1]); // microseconds
    const channels: number[] = [];
    for (let i = 0; i < analogCount; i++) {
      channels.push(parseFloat(parts[2 + i]) || 0);
    }
    records.push({ sampleNum, timestamp, channels });
  }

  return records;
};