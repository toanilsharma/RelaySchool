import { CurveType } from './types';

// IEC 60255 Constants
// t = TMS * k / ((I/Is)^alpha - 1)
export const IEC_CURVES: Record<string, { k: number; alpha: number }> = {
  [CurveType.IEC_STANDARD_INVERSE]: { k: 0.14, alpha: 0.02 },
  [CurveType.IEC_VERY_INVERSE]: { k: 13.5, alpha: 1.0 },
  [CurveType.IEC_EXTREMELY_INVERSE]: { k: 80.0, alpha: 2.0 },
};

// ANSI/IEEE C37.112 Constants
// t = TDS * ( A / (M^p - 1) + B )
export const ANSI_CURVES: Record<string, { A: number; B: number; p: number }> = {
  [CurveType.ANSI_MODERATELY_INVERSE]: { A: 0.0515, B: 0.1140, p: 0.02 },
  [CurveType.ANSI_VERY_INVERSE]: { A: 19.61, B: 0.491, p: 2.0 },
  [CurveType.ANSI_EXTREMELY_INVERSE]: { A: 28.2, B: 0.1217, p: 2.0 },
};

// Simplified Fuse/MCCB Constants for simulation
// Using very inverse approximation for demonstration
export const FUSE_CURVES: Record<string, { k: number; alpha: number }> = {
    [CurveType.FUSE_GENERIC_FAST]: { k: 25, alpha: 2.5 },
    [CurveType.FUSE_GENERIC_SLOW]: { k: 40, alpha: 2.0 },
    [CurveType.MCCB_THERMAL_MAG]: { k: 60, alpha: 1.5 }
};

export const ANSI_CODES = [
  { code: '21', name: 'Distance Relay', description: 'Impedance based protection for transmission lines.' },
  { code: '27', name: 'Undervoltage Relay', description: 'Operates when voltage falls below a set value.' },
  { code: '32', name: 'Directional Power', description: 'Anti-motoring protection for generators.' },
  { code: '50', name: 'Instantaneous Overcurrent', description: 'Operates with no intentional time delay.' },
  { code: '51', name: 'AC Time Overcurrent', description: 'Operates with a time delay characteristic.' },
  { code: '67', name: 'Directional Overcurrent', description: 'Operates for current flowing in one direction.' },
  { code: '87', name: 'Differential', description: 'Kirchhoff’s law based protection (Idiff > setting).' },
];

export const MOCK_PROJECTS = [
  { id: 'proj_001', name: 'Substation Alpha Coordination', lastModified: Date.now() },
  { id: 'proj_002', name: 'Industrial Plant Feeders', lastModified: Date.now() - 86400000 },
];