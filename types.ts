
export enum CurveType {
  IEC_STANDARD_INVERSE = 'IEC_SI',
  IEC_VERY_INVERSE = 'IEC_VI',
  IEC_EXTREMELY_INVERSE = 'IEC_EI',
  IEC_LONG_TIME_INVERSE = 'IEC_LTI',
  ANSI_MODERATELY_INVERSE = 'ANSI_MI',
  ANSI_VERY_INVERSE = 'ANSI_VI',
  ANSI_EXTREMELY_INVERSE = 'ANSI_EI',
  ANSI_SHORT_TIME_INVERSE = 'ANSI_STI',
  DT_DEFINITE_TIME = 'DT',
  FUSE_GENERIC_FAST = 'FUSE_FAST',
  FUSE_GENERIC_SLOW = 'FUSE_SLOW',
  MCCB_THERMAL_MAG = 'MCCB_TM',
  // Manufacturer-Specific Curves
  SEL_U1 = 'SEL_U1',
  SEL_U2 = 'SEL_U2',
  SEL_U3 = 'SEL_U3',
  SEL_U4 = 'SEL_U4',
  SEL_U5 = 'SEL_U5',
  ABB_RXIDG = 'ABB_RXIDG',
  GE_IAC_INVERSE = 'GE_IAC_INV',
  GE_IAC_VERY_INVERSE = 'GE_IAC_VI',
  GE_IAC_EXTREMELY_INVERSE = 'GE_IAC_EI',
}

export interface RelaySettings {
  id: string;
  name: string;
  type: 'Overcurrent' | 'EarthFault' | 'Distance' | 'Fuse' | 'MCCB';
  curveType: CurveType;
  pickupCurrent: number; // Amps
  timeMultiplier: number; // TMS or TDS
  ctRatio: number; 
  instantaneousPickup?: number; // 50 element
  enabled: boolean;
  color: string;
}

export interface FaultResult {
  currentMag: number;
  currentAngle: number;
  voltageMag: number;
  voltageAngle: number;
  faultType: 'L-G' | 'L-L' | 'L-L-L' | 'L-L-G';
}

export interface SLDNode {
  id: string;
  type: 'Bus' | 'Transformer' | 'Generator' | 'Load' | 'Breaker';
  x: number;
  y: number;
  data: {
    voltagekV: number;
    name: string;
    status?: 'Open' | 'Closed'; // For breakers
  };
}

export interface SLDEdge {
  id: string;
  source: string;
  target: string;
  impedance?: { r: number; x: number };
}

export interface LogicNode {
  id: string;
  type: 'AND' | 'OR' | 'NOT' | 'INPUT' | 'OUTPUT' | 'TIMER';
  x: number;
  y: number;
  inputs: string[]; // IDs of connected nodes
  state: boolean;
  label?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  relays: RelaySettings[];
  sld: { nodes: SLDNode[]; edges: SLDEdge[] };
  lastModified: number;
}
