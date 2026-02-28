import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Activity, Plus, Trash2, AlertTriangle, CheckCircle, Search,
    ZoomIn, ZoomOut, Maximize, RotateCcw, Save, Settings,
    MousePointer2, ChevronDown, ChevronUp, Layers, Eye, EyeOff,
    Download, PlayCircle, Lock, Unlock, Move, BookOpen, Lightbulb,
    GraduationCap, X, Zap, Clock, Shield, Info, FileText, CheckCircle2,
    AlertOctagon, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2, BrainCircuit, School, Calculator, ArrowRight,
    Trophy, XCircle, RefreshCw, Flame, Factory, Gauge, GitCompare,
    ArrowUpFromLine, ArrowDownToLine, Ruler, Menu, Book, MousePointerClick, Share2,
    Sliders, Smartphone, Sparkles, Filter
} from 'lucide-react';
import Slider from '../components/Slider';
import { useThemeObserver } from '../hooks/useThemeObserver';
import { downloadTextFile } from '../utils/exportUtils';
import TheoryLibrary from '../components/TheoryLibrary';
import { TCC_THEORY_CONTENT } from '../data/learning-modules/tcc';
import SEO from "../components/SEO";

// --- 1. CONSTANTS & DATA BANKS ---

const CurveType = {
    IEC_STANDARD_INVERSE: 'IEC_SI',
    IEC_VERY_INVERSE: 'IEC_VI',
    IEC_EXTREMELY_INVERSE: 'IEC_EI',
    IEC_LONG_TIME_INVERSE: 'IEC_LTI',
    ANSI_MODERATELY_INVERSE: 'ANSI_MI',
    ANSI_VERY_INVERSE: 'ANSI_VI',
    ANSI_EXTREMELY_INVERSE: 'ANSI_EI',
    ANSI_SHORT_TIME_INVERSE: 'ANSI_STI',
    ANSI_LONG_TIME_INVERSE: 'ANSI_LTI',
    DT_DEFINITE_TIME: 'DT',
    // Fuse Types (real data)
    FUSE_K_FAST: 'FUSE_K',
    FUSE_T_SLOW: 'FUSE_T',
    FUSE_NH_GG: 'FUSE_NH',
    // Equipment Limits
    EQUIP_TRANSFORMER_DAMAGE: 'EQ_TX_DMG',
    EQUIP_MOTOR_START: 'EQ_MOT_START',
    EQUIP_CABLE_DAMAGE: 'EQ_CABLE',
};

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6'];

// Real fuse I-t data: [current_multiple, mmt_seconds, tct_seconds]
const FUSE_DATA = {
    [CurveType.FUSE_K_FAST]: { name: 'K-Link (Fast)', data: [
        [1.3, 1000, 1200], [1.5, 300, 400], [2, 40, 60], [3, 4.5, 7],
        [4, 1.2, 2.0], [5, 0.5, 0.9], [6, 0.25, 0.5], [8, 0.08, 0.18],
        [10, 0.035, 0.08], [15, 0.012, 0.03], [20, 0.006, 0.015],
    ]},
    [CurveType.FUSE_T_SLOW]: { name: 'T-Link (Slow)', data: [
        [1.3, 1500, 1800], [1.5, 600, 800], [2, 100, 140], [3, 12, 18],
        [4, 3.5, 5.5], [5, 1.5, 2.5], [6, 0.7, 1.3], [8, 0.2, 0.45],
        [10, 0.08, 0.2], [15, 0.025, 0.06], [20, 0.01, 0.025],
    ]},
    [CurveType.FUSE_NH_GG]: { name: 'NH gG (IEC)', data: [
        [1.25, 3600, 4000], [1.5, 500, 700], [2, 50, 80], [3, 6, 10],
        [4, 1.5, 3.0], [5, 0.6, 1.2], [6, 0.3, 0.6], [8, 0.1, 0.25],
        [10, 0.04, 0.12], [15, 0.015, 0.04], [20, 0.007, 0.02],
    ]},
};

// Cable K-factors per IEC 60364-5-54 Table 54C
const CABLE_K_FACTORS = {
    'Cu_PVC': { k: 115, label: 'Copper / PVC' },
    'Cu_XLPE': { k: 143, label: 'Copper / XLPE' },
    'Cu_EPR': { k: 143, label: 'Copper / EPR' },
    'Al_PVC': { k: 76, label: 'Aluminum / PVC' },
    'Al_XLPE': { k: 94, label: 'Aluminum / XLPE' },
};

// IEEE C57.109 Transformer damage curve data: Category -> [current_mult, time_s] (mechanical + thermal)
const TX_DAMAGE_CURVES = {
    'I': { label: 'Cat I (5-500kVA 1Ø)', points: [[2,1800],[3,300],[4,60],[5,15],[6,5],[8,2],[10,1.2],[12,0.7],[16,0.4],[20,0.25],[25,0.17]] },
    'II': { label: 'Cat II (501-1667kVA 1Ø)', points: [[2,600],[3,100],[4,30],[5,10],[6,4],[8,1.5],[10,0.8],[12,0.5],[16,0.25],[20,0.15],[25,0.1]] },
    'III': { label: 'Cat III (1668-10000kVA)', points: [[2,300],[3,60],[4,15],[5,5],[6,2],[8,0.8],[10,0.5],[12,0.3],[16,0.15],[20,0.08],[25,0.05]] },
    'IV': { label: 'Cat IV (>10000kVA)', points: [[2,120],[3,30],[4,8],[5,3],[6,1.2],[8,0.5],[10,0.25],[12,0.15],[16,0.07],[20,0.04],[25,0.03]] },
};

// Manufacturer formula variations
const MANUFACTURERS = {
    'generic': { label: 'Generic (IEEE)', multiplyB: true },
    'sel': { label: 'SEL (Schweitzer)', multiplyB: false },
    'abb': { label: 'ABB', multiplyB: true },
    'ge': { label: 'GE Multilin', multiplyB: true },
};

const CURVE_LIB = [
    { label: "IEC Standard Inverse (SI)", value: CurveType.IEC_STANDARD_INVERSE, group: 'Relay' },
    { label: "IEC Very Inverse (VI)", value: CurveType.IEC_VERY_INVERSE, group: 'Relay' },
    { label: "IEC Extremely Inverse (EI)", value: CurveType.IEC_EXTREMELY_INVERSE, group: 'Relay' },
    { label: "IEC Long Time Inverse", value: CurveType.IEC_LONG_TIME_INVERSE, group: 'Relay' },
    { label: "ANSI Moderately Inverse", value: CurveType.ANSI_MODERATELY_INVERSE, group: 'Relay' },
    { label: "ANSI Very Inverse", value: CurveType.ANSI_VERY_INVERSE, group: 'Relay' },
    { label: "ANSI Extremely Inverse", value: CurveType.ANSI_EXTREMELY_INVERSE, group: 'Relay' },
    { label: "ANSI Short-Time Inverse", value: CurveType.ANSI_SHORT_TIME_INVERSE, group: 'Relay' },
    { label: "ANSI Long-Time Inverse", value: CurveType.ANSI_LONG_TIME_INVERSE, group: 'Relay' },
    { label: "Definite Time (50)", value: CurveType.DT_DEFINITE_TIME, group: 'Relay' },
    { label: "K-Link Fuse (Fast)", value: CurveType.FUSE_K_FAST, group: 'Fuse' },
    { label: "T-Link Fuse (Slow)", value: CurveType.FUSE_T_SLOW, group: 'Fuse' },
    { label: "NH gG Fuse (IEC)", value: CurveType.FUSE_NH_GG, group: 'Fuse' },
];

const SCENARIOS = [
    {
        id: 'dist_feeder', name: 'Distribution Feeder Grading',
        description: 'Classic source-to-load coordination (Blue feeder below Red incomer).',
        devices: [
            { id: 'dev_up', name: 'Substation Incomer', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 600, tds: 0.40, instantaneous: 12000, ctRatio: 1200, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'dev_down', name: 'Feeder Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 200, tds: 0.15, instantaneous: 3000, ctRatio: 400, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'tx_protection', name: 'Transformer Damage (C57.109)',
        description: 'Coordinate relay to trip BEFORE the Transformer Damage Curve.',
        devices: [
            { id: 'tx_limit', name: 'TX Damage Cat II', type: 'Limit', curve: CurveType.EQUIP_TRANSFORMER_DAMAGE, pickup: 1000, tds: 1, instantaneous: null, ctRatio: null, color: '#dc2626', visible: true, locked: true, showBand: false, manufacturer: 'generic', txCategory: 'II' },
            { id: 'tx_relay', name: 'HV Side Relay', type: 'Relay', curve: CurveType.ANSI_EXTREMELY_INVERSE, pickup: 100, tds: 2.0, instantaneous: 2000, ctRatio: 200, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'motor_start', name: 'Motor Protection & Starting',
        description: 'Allow Motor Starting (Inrush) while protecting against stall.',
        devices: [
            { id: 'mot_start', name: 'Motor Starting Curve', type: 'Limit', curve: CurveType.EQUIP_MOTOR_START, pickup: 100, tds: 1, instantaneous: null, ctRatio: null, color: '#f59e0b', visible: true, locked: true, showBand: false, manufacturer: 'generic' },
            { id: 'dev_mot', name: 'Motor Protection Relay', type: 'Relay', curve: CurveType.IEC_EXTREMELY_INVERSE, pickup: 110, tds: 0.8, instantaneous: 1200, ctRatio: 150, color: '#10b981', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'fuse_relay', name: 'Fuse-Relay Coordination',
        description: 'K-Link fuse downstream coordinated with upstream ANSI relay (IEEE C37.48).',
        devices: [
            { id: 'fr_relay', name: 'Upstream OC Relay', type: 'Relay', curve: CurveType.ANSI_VERY_INVERSE, pickup: 400, tds: 0.5, instantaneous: 8000, ctRatio: 800, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'fr_fuse', name: '100A K-Fuse', type: 'Fuse', curve: CurveType.FUSE_K_FAST, pickup: 100, tds: 1, instantaneous: null, ctRatio: null, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'three_level', name: '3-Level Cascade Grading',
        description: 'Load relay → Feeder relay → Main incomer. Verify CTI at all levels.',
        devices: [
            { id: 'tl_main', name: 'Main Incomer', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 800, tds: 0.50, instantaneous: 16000, ctRatio: 1600, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'tl_feeder', name: 'Feeder Relay', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 400, tds: 0.30, instantaneous: 8000, ctRatio: 800, color: '#8b5cf6', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'tl_load', name: 'Load Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 100, tds: 0.10, instantaneous: 2000, ctRatio: 200, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'cable_prot', name: 'Cable Protection Check',
        description: 'Verify fuse clears BEFORE cable damage limit per IEC 60364.',
        devices: [
            { id: 'cp_cable', name: 'Cable 95mm² Cu/XLPE', type: 'Limit', curve: CurveType.EQUIP_CABLE_DAMAGE, pickup: 50, tds: 1, instantaneous: null, ctRatio: null, color: '#dc2626', visible: true, locked: true, showBand: false, manufacturer: 'generic', cableType: 'Cu_XLPE', cableSize: 95 },
            { id: 'cp_fuse', name: '200A K-Fuse', type: 'Fuse', curve: CurveType.FUSE_K_FAST, pickup: 200, tds: 1, instantaneous: null, ctRatio: null, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'fuse_fuse', name: 'Fuse-Fuse Coordination',
        description: 'Two fuse stages: downstream K-Link must clear before upstream T-Link melts.',
        devices: [
            { id: 'ff_up', name: '200A T-Fuse (Upstream)', type: 'Fuse', curve: CurveType.FUSE_T_SLOW, pickup: 200, tds: 1, instantaneous: null, ctRatio: null, color: '#ef4444', visible: true, locked: false, showBand: true, manufacturer: 'generic' },
            { id: 'ff_down', name: '100A K-Fuse (Downstream)', type: 'Fuse', curve: CurveType.FUSE_K_FAST, pickup: 100, tds: 1, instantaneous: null, ctRatio: null, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'gen_backup', name: 'Generator Backup (C37.102)',
        description: 'Generator backup protection with voltage-restrained overcurrent.',
        devices: [
            { id: 'gb_gen', name: 'Generator Damage', type: 'Limit', curve: CurveType.EQUIP_TRANSFORMER_DAMAGE, pickup: 500, tds: 1, instantaneous: null, ctRatio: null, color: '#dc2626', visible: true, locked: true, showBand: false, manufacturer: 'generic', txCategory: 'III' },
            { id: 'gb_relay', name: '51V Backup Relay', type: 'Relay', curve: CurveType.ANSI_VERY_INVERSE, pickup: 80, tds: 1.5, instantaneous: 3000, ctRatio: 200, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'solar_pv', name: 'Solar PV Inverter (IEEE 1547)',
        description: 'PV inverter trip coordination with AC breaker and utility relay.',
        devices: [
            { id: 'pv_util', name: 'Utility Feeder Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 600, tds: 0.3, instantaneous: 10000, ctRatio: 1200, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'pv_pcc', name: 'PCC Breaker Relay', type: 'Relay', curve: CurveType.ANSI_EXTREMELY_INVERSE, pickup: 200, tds: 0.5, instantaneous: 3000, ctRatio: 400, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'mcc_industrial', name: 'Industrial MCC Grading',
        description: 'Motor Control Center: Main → MCC Bus → Motor Feeder with fuse.',
        devices: [
            { id: 'mcc_main', name: 'Main Incomer 51', type: 'Relay', curve: CurveType.ANSI_MODERATELY_INVERSE, pickup: 1000, tds: 0.6, instantaneous: 20000, ctRatio: 2000, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'mcc_bus', name: 'MCC Bus Relay', type: 'Relay', curve: CurveType.ANSI_VERY_INVERSE, pickup: 400, tds: 0.3, instantaneous: 8000, ctRatio: 800, color: '#8b5cf6', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'mcc_fuse', name: '60A Motor Fuse', type: 'Fuse', curve: CurveType.FUSE_K_FAST, pickup: 60, tds: 1, instantaneous: null, ctRatio: null, color: '#10b981', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'ring_main', name: 'Ring Main Unit Grading',
        description: 'Three relays in loop configuration per IEC 60255.',
        devices: [
            { id: 'rm_source', name: 'Source Relay', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 500, tds: 0.45, instantaneous: 10000, ctRatio: 1000, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'rm_mid', name: 'Mid-Ring Relay', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 300, tds: 0.25, instantaneous: 6000, ctRatio: 600, color: '#8b5cf6', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'rm_load', name: 'Load RMU Relay', type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE, pickup: 100, tds: 0.10, instantaneous: 2000, ctRatio: 200, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
    {
        id: 'manufacturer_compare', name: 'SEL vs GE Comparison',
        description: 'Same ANSI EI curve with different manufacturer formula interpretations.',
        devices: [
            { id: 'mc_sel', name: 'SEL-751 (B not × TDS)', type: 'Relay', curve: CurveType.ANSI_EXTREMELY_INVERSE, pickup: 200, tds: 1.0, instantaneous: 5000, ctRatio: 400, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'sel' },
            { id: 'mc_ge', name: 'GE 750 (B × TDS)', type: 'Relay', curve: CurveType.ANSI_EXTREMELY_INVERSE, pickup: 200, tds: 1.0, instantaneous: 5000, ctRatio: 400, color: '#3b82f6', visible: true, locked: false, showBand: false, manufacturer: 'ge' }
        ]
    },
    {
        id: 'nh_fuse_eu', name: 'European NH Fuse System',
        description: 'NH gG fuse coordination with IEC relay per IEC 60269.',
        devices: [
            { id: 'nh_relay', name: 'IEC Incomer Relay', type: 'Relay', curve: CurveType.IEC_VERY_INVERSE, pickup: 400, tds: 0.35, instantaneous: 8000, ctRatio: 800, color: '#ef4444', visible: true, locked: false, showBand: false, manufacturer: 'generic' },
            { id: 'nh_fuse', name: '160A NH gG Fuse', type: 'Fuse', curve: CurveType.FUSE_NH_GG, pickup: 160, tds: 1, instantaneous: null, ctRatio: null, color: '#3b82f6', visible: true, locked: false, showBand: true, manufacturer: 'generic' }
        ]
    },
];

const THEORY_TOPICS = [
    {
        id: 'fundamentals',
        title: "Coordination Fundamentals",
        icon: <BookOpen className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">The Golden Rule of Selectivity</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                        "Isolate the faulted component as quickly as possible, while leaving the maximum amount of the remaining system operational."
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Key Engineering Metrics</h4>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex gap-3"><span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">CTI</span> <span><strong>Coordination Time Interval:</strong> Typically 0.2s - 0.4s. Includes breaker operating time (5 cycles), relay overshoot, and safety margin.</span></li>
                        <li className="flex gap-3"><span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">PSM</span> <span><strong>Plug Setting Multiplier:</strong> Ratio of Fault Current to Pickup Current (I_fault / I_pickup).</span></li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'transformer',
        title: "Transformer Protection (C57.109)",
        icon: <Zap className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">Protecting transformers requires balancing <strong>Inrush Current</strong> (which should NOT trip) and the <strong>Through-Fault Damage Curve</strong> (which MUST trip).</p>

                <div className="grid grid-cols-1 gap-4">
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h5 className="font-bold text-red-600 mb-1 flex items-center gap-2"><Flame className="w-4 h-4" /> Damage Curves (ANSI C57.109)</h5>
                        <p className="text-xs text-slate-500 mb-2">Transformers have thermal and mechanical limits defined by categories (I, II, III, IV) based on kVA.</p>
                        <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <li><strong>Thermal Limit:</strong> I²t characteristic (heating).</li>
                            <li><strong>Mechanical Limit:</strong> Withstand against magnetic forces during external faults.</li>
                        </ul>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                        <h5 className="font-bold text-amber-600 mb-1 flex items-center gap-2"><Activity className="w-4 h-4" /> Magnetizing Inrush</h5>
                        <p className="text-xs text-slate-500 mb-2">Transient current when energizing. Relays must ignore this.</p>
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs font-mono">
                            Typical Point: 8x - 12x FLA @ 0.1s
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'motors',
        title: "Motor Thermal Models",
        icon: <Factory className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">Motor protection relays typically use thermal models to estimate rotor/stator heating.</p>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Starting Curve</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            The relay must sit <strong>above</strong> the starting curve to allow the motor to accelerate without nuisance tripping.
                            <br />
                            <em>Typical LRA (Locked Rotor Amps): 600% of FLA.</em>
                        </p>
                    </div>
                    <div className="flex-1">
                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">Stall Limit</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            The relay must sit <strong>below</strong> the Safe Stall Time (Hot/Cold) to prevent insulation damage during a jam.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'ct_saturation',
        title: "CT Saturation & Burden",
        icon: <Gauge className="w-5 h-5" />,
        content: (
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    If a Current Transformer (CT) saturates, the secondary current is distorted and reduced, leading to slow operation or failure to trip.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-2">ANSI C-Class Ratings (e.g., C100, C200)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Indicates the secondary voltage the CT can deliver to a standard burden without exceeding 10% ratio error.
                    </p>
                    <div className="text-xs font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        Vs = Ifault_sec × (R_ct + R_leads + R_relay)
                    </div>
                    <p className="text-xs text-slate-500 mt-2">If Vs &gt; Knee Point Voltage, saturation occurs.</p>
                </div>
            </div>
        )
    }
];

const QUIZ_BANK = [
    // Industry Level Questions
    { q: "According to IEEE C57.109, the Transformer Damage Curve is divided into which categories?", options: ["Thermal & Magnetic", "Category I, II, III, IV", "Phase & Ground", "Zones 1, 2, 3"], a: 1, level: 'easy' },
    { q: "What is the primary method to inhibit relay tripping during Transformer Inrush?", options: ["Time Delay", "2nd Harmonic Restraint", "Voltage Blocking", "Differential Bias"], a: 1, level: 'medium' },
    { q: "A CT with class 'C200' can deliver 200V at terminal assuming:", options: ["20A secondary", "100A secondary", "20x nominal current with <10% error", "Infinite burden"], a: 2, level: 'hard' },
    { q: "In a selective coordination study, the CTI usually accounts for:", options: ["Cable length", "Breaker opening + Relay overshoot + Safety", "Voltage drop", "Transformer impedance"], a: 1, level: 'easy' },
    { q: "Sympathetic Tripping occurs when:", options: ["Relays trip out of pity", "A relay trips for a fault on an adjacent feeder due to inrush/offset", "Ground fault current is too low", "CTs are open circuited"], a: 1, level: 'hard' },
    { q: "Locked Rotor Current (LRA) is typically how many times the Full Load Amps (FLA)?", options: ["1.5x", "6x", "12x", "20x"], a: 1, level: 'medium' },
    { q: "The 'Knee Point' voltage of a CT is defined where a 10% increase in voltage causes:", options: ["10% increase in excitation current", "50% increase in excitation current", "Saturation", "Explosion"], a: 1, level: 'hard' },
    { q: "Ground fault relays often require lower settings because:", options: ["Ground faults always have high current", "Ground return paths often have high impedance", "They are cheaper", "Phase relays don't work"], a: 1, level: 'medium' },
    { q: "Which curve is best suited for protecting fuses?", options: ["Definite Time", "Extremely Inverse", "Standard Inverse", "Linear"], a: 1, level: 'medium' },
    { q: "What is the typical clearing time of a 5-cycle breaker?", options: ["0.083s", "0.05s", "0.1s", "0.016s"], a: 0, level: 'hard' },
];


// --- 2. MATH ENGINE ---

// Log-log interpolation for fuse data
const interpolateFuseTime = (fuseData, currentMultiple, useTCT = false) => {
    const data = fuseData.data;
    const idx = useTCT ? 2 : 1; // 1=MMT, 2=TCT
    if (currentMultiple < data[0][0]) return null;
    if (currentMultiple >= data[data.length - 1][0]) {
        return data[data.length - 1][idx] * 0.8; // extrapolate slightly
    }
    for (let i = 0; i < data.length - 1; i++) {
        if (currentMultiple >= data[i][0] && currentMultiple < data[i + 1][0]) {
            const logI1 = Math.log10(data[i][0]), logI2 = Math.log10(data[i + 1][0]);
            const logT1 = Math.log10(data[i][idx]), logT2 = Math.log10(data[i + 1][idx]);
            const logI = Math.log10(currentMultiple);
            const logT = logT1 + (logT2 - logT1) * (logI - logI1) / (logI2 - logI1);
            return Math.pow(10, logT);
        }
    }
    return null;
};

// IEEE C57.109 transformer damage lookup with log-log interpolation
const interpolateTxDamage = (txData, currentMultiple) => {
    const pts = txData.points;
    if (currentMultiple < pts[0][0]) return null;
    if (currentMultiple >= pts[pts.length - 1][0]) {
        return pts[pts.length - 1][1] * Math.pow(pts[pts.length - 1][0] / currentMultiple, 2);
    }
    for (let i = 0; i < pts.length - 1; i++) {
        if (currentMultiple >= pts[i][0] && currentMultiple < pts[i + 1][0]) {
            const logI1 = Math.log10(pts[i][0]), logI2 = Math.log10(pts[i + 1][0]);
            const logT1 = Math.log10(pts[i][1]), logT2 = Math.log10(pts[i + 1][1]);
            const logI = Math.log10(currentMultiple);
            return Math.pow(10, logT1 + (logT2 - logT1) * (logI - logI1) / (logI2 - logI1));
        }
    }
    return null;
};

const calculateTripTime = (current, pickup, tds, curveType, instantaneous, manufacturer = 'generic', extraParams: any = {}) => {
    // --- Equipment Limits ---

    // IEEE C57.109 Transformer Damage (by category)
    if (curveType === CurveType.EQUIP_TRANSFORMER_DAMAGE) {
        if (current < pickup) return null;
        const M = current / pickup;
        const cat = extraParams?.txCategory || 'II';
        const txData = TX_DAMAGE_CURVES[cat];
        if (!txData) return null;
        return interpolateTxDamage(txData, M);
    }

    // Motor Starting Curve
    if (curveType === CurveType.EQUIP_MOTOR_START) {
        if (current < pickup) return 20;
        if (current > pickup * 6) return null;
        return Math.max(0.1, 1000 / current);
    }

    // Cable Damage: t = (K × S / I)² per IEC 60364
    if (curveType === CurveType.EQUIP_CABLE_DAMAGE) {
        if (current < pickup) return null;
        const cableType = extraParams?.cableType || 'Cu_PVC';
        const cableSize = extraParams?.cableSize || 95; // mm²
        const kFactor = CABLE_K_FACTORS[cableType]?.k || 115;
        return Math.pow((kFactor * cableSize) / current, 2);
    }

    // --- Real Fuse Models (log-log interpolation) ---
    if (curveType === CurveType.FUSE_K_FAST || curveType === CurveType.FUSE_T_SLOW || curveType === CurveType.FUSE_NH_GG) {
        if (current < pickup) return null;
        const M = current / pickup;
        if (M <= 1) return null;
        const fuseData = FUSE_DATA[curveType];
        if (!fuseData) return null;
        // Return TCT (worst case) for trip time. MMT used for band rendering.
        return interpolateFuseTime(fuseData, M, true);
    }

    // --- Standard Relay Logic ---
    if (instantaneous && current >= instantaneous) return 0.01;
    if (current < pickup) return null;
    const M = current / pickup;
    if (M <= 1.0) return null;

    // ANSI formula constants: t = TDS × [A / (M^p - 1) + B]
    // Manufacturer variation: SEL does NOT multiply B by TDS
    const mfr = MANUFACTURERS[manufacturer] || MANUFACTURERS['generic'];

    let A = 0, B = 0, p = 0;
    let isIEC = false;

    switch (curveType) {
        // IEC 60255-151 curves (no additive constant)
        case CurveType.IEC_STANDARD_INVERSE: A = 0.14; p = 0.02; isIEC = true; break;
        case CurveType.IEC_VERY_INVERSE: A = 13.5; p = 1.0; isIEC = true; break;
        case CurveType.IEC_EXTREMELY_INVERSE: A = 80; p = 2.0; isIEC = true; break;
        case CurveType.IEC_LONG_TIME_INVERSE: A = 120; p = 1.0; isIEC = true; break;
        // IEEE C37.112 curves (with additive constant B)
        case CurveType.ANSI_MODERATELY_INVERSE: A = 0.0515; B = 0.1140; p = 0.02; break;
        case CurveType.ANSI_VERY_INVERSE: A = 19.61; B = 0.491; p = 2.0; break;
        case CurveType.ANSI_EXTREMELY_INVERSE: A = 28.2; B = 0.1217; p = 2.0; break;
        case CurveType.ANSI_SHORT_TIME_INVERSE: A = 0.00342; B = 0.00262; p = 0.02; break;
        case CurveType.ANSI_LONG_TIME_INVERSE: A = 120; B = 10.0; p = 2.0; break;
        case CurveType.DT_DEFINITE_TIME: return tds;
        default: return null;
    }

    let time;
    if (isIEC) {
        time = tds * (A / (Math.pow(M, p) - 1));
    } else {
        // Manufacturer-specific: SEL treats B as additive OUTSIDE the TDS multiplier
        if (mfr.multiplyB) {
            time = tds * (A / (Math.pow(M, p) - 1) + B);
        } else {
            time = tds * (A / (Math.pow(M, p) - 1)) + B;
        }
    }
    return Math.max(0.01, time);
};

// Fuse MMT time (for rendering the band lower bound)
const calculateFuseMMT = (current, pickup, curveType) => {
    if (current < pickup) return null;
    const M = current / pickup;
    if (M <= 1) return null;
    const fuseData = FUSE_DATA[curveType];
    if (!fuseData) return null;
    return interpolateFuseTime(fuseData, M, false);
};

// Arc Flash Energy (IEEE 1584-2018 simplified Lee method)
const calculateArcFlash = (faultAmps, tripTime, workingDistance = 457) => {
    // Lee method: E = 5.12 × 10^5 × V × I_bf × t / D²
    // Simplified for 480V - per IEEE 1584-2018
    const V = 0.48; // kV
    const Ibf = faultAmps / 1000; // kA
    const t = tripTime; // seconds
    const D = workingDistance / 10; // mm to cm
    const E = (5.12e5 * V * Ibf * t) / (D * D);
    return E; // cal/cm²
};

const getArcFlashCategory = (energy) => {
    if (energy <= 1.2) return { level: 0, label: 'Cat 0', color: '#22c55e', bgColor: '#dcfce7' };
    if (energy <= 4) return { level: 1, label: 'Cat 1', color: '#84cc16', bgColor: '#ecfccb' };
    if (energy <= 8) return { level: 2, label: 'Cat 2', color: '#eab308', bgColor: '#fef9c3' };
    if (energy <= 25) return { level: 3, label: 'Cat 3', color: '#f97316', bgColor: '#ffedd5' };
    if (energy <= 40) return { level: 4, label: 'Cat 4', color: '#ef4444', bgColor: '#fee2e2' };
    return { level: 5, label: 'DANGER', color: '#7f1d1d', bgColor: '#fecaca' };
};

// Full-range coordination sweep
const sweepCoordination = (upDev, downDev, manufacturer = 'generic') => {
    const startI = Math.max(upDev.pickup, downDev.pickup) * 1.05;
    const endI = Math.min(
        upDev.instantaneous || 100000,
        downDev.instantaneous || 100000,
        100000
    );
    if (startI >= endI) return { minMargin: null, worstCurrent: 0, points: [], crossings: [] };

    let minMargin = Infinity;
    let worstCurrent = startI;
    const points: any[] = [];
    const crossings: any[] = [];

    for (let i = startI; i <= endI; i *= 1.08) {
        const tUp = calculateTripTime(i, upDev.pickup, upDev.tds, upDev.curve, upDev.instantaneous, manufacturer);
        const tDown = calculateTripTime(i, downDev.pickup, downDev.tds, downDev.curve, downDev.instantaneous, manufacturer);
        if (tUp !== null && tDown !== null) {
            const margin = tUp - tDown;
            points.push({ current: i, margin, tUp, tDown });
            if (margin < minMargin) { minMargin = margin; worstCurrent = i; }
            if (points.length > 1) {
                const prev = points[points.length - 2];
                if ((prev.margin > 0 && margin < 0) || (prev.margin < 0 && margin > 0)) {
                    crossings.push({ current: i, margin });
                }
            }
        }
    }
    return { minMargin: minMargin === Infinity ? null : minMargin, worstCurrent, points, crossings };
};

// --- 3. SUB-COMPONENTS ---

const TheoryModule = () => {
    return (
        <TheoryLibrary 
            title="Time-Current Coordination" 
            description="Master the art of protection grading. Learn how to achieve selectivity, protect transformers from damage, and ensure grid stability using IEC/IEEE standard curves."
            sections={TCC_THEORY_CONTENT}
        />
    );
};

const QuizModule = () => {
    const [level, setLevel] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const startQuiz = (lvl) => {
        const pool = QUIZ_BANK; // Use full bank for pro version
        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
        setQuestions(shuffled);
        setLevel(lvl);
        setAnswers({});
        setSubmitted(false);
    };

    const reset = () => {
        setLevel(null);
        setQuestions([]);
        setAnswers({});
        setSubmitted(false);
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.a) score++;
        });
        return score;
    };

    if (!level) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in-up bg-slate-50 dark:bg-slate-950">
                <div className="text-center max-w-lg mb-12">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Competency Assessment</h2>
                    <p className="text-slate-500">Test your knowledge against industry-standard protection scenarios. Questions derived from IEEE and IEC standards.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    {[
                        { id: 'easy', label: 'Apprentice', color: 'bg-emerald-500', icon: <School className="w-8 h-8 text-white" />, desc: "Basic concepts & definitions" },
                        { id: 'medium', label: 'Engineer', color: 'bg-blue-600', icon: <Calculator className="w-8 h-8 text-white" />, desc: "Application & Calculations" },
                        { id: 'hard', label: 'Senior PE', color: 'bg-indigo-600', icon: <BrainCircuit className="w-8 h-8 text-white" />, desc: "Complex scenarios & Standards" },
                    ].map(l => (
                        <button key={l.id} onClick={() => startQuiz(l.id)}
                            className={`${l.color} hover:brightness-110 transition-all p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 text-white group relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                                {l.icon}
                            </div>
                            <div className="text-center">
                                <span className="text-xl font-bold uppercase tracking-widest block">{l.label}</span>
                                <span className="text-xs opacity-75 mt-1 block">{l.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const score = calculateScore();
    const passed = score >= 4; // Higher standard for pro tool

    return (
        <div className="max-w-3xl mx-auto p-6 pb-20 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
                <button onClick={reset} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Exit Assessment
                </button>
                <div className="flex gap-2">
                    {questions.map((_, i) => (
                        <div key={i} className={`h-2 w-8 rounded-full ${answers[i] !== undefined ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    ))}
                </div>
            </div>

            {submitted ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
                    {passed ? <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-bounce" /> : <RefreshCw className="w-24 h-24 text-slate-300 mx-auto mb-6" />}
                    <h2 className="text-5xl font-black text-slate-800 dark:text-white mb-2">{score} <span className="text-2xl text-slate-400 font-medium">/ 5</span></h2>
                    <p className={`text-lg font-medium mb-10 ${passed ? 'text-green-500' : 'text-slate-500'}`}>
                        {passed ? "Certification Ready Standard." : "Review IEEE standards and try again."}
                    </p>
                    <button onClick={reset} className="px-10 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                        New Assessment
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                            <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-6 flex gap-4">
                                <span className="text-blue-500 opacity-50">0{idx + 1}</span> {q.q}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                                {q.options.map((opt, oid) => (
                                    <label key={oid} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[idx] === oid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'}`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[idx] === oid ? 'border-blue-500' : 'border-slate-300'}`}>
                                            {answers[idx] === oid && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                        </div>
                                        <input type="radio" name={`q-${idx}`} className="hidden" onChange={() => setAnswers({ ...answers, [idx]: oid })} checked={answers[idx] === oid} />
                                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={() => setSubmitted(true)}
                            disabled={Object.keys(answers).length < 5}
                            className="px-12 py-4 bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl transition-all active:scale-95"
                        >
                            Finalize & Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Help Modal - Commercial Grade
const HelpModal = ({ onClose }) => {
    const [tab, setTab] = useState('quick');
    const HelpTab = ({ id, label, icon }) => (
        <button onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === id ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            {icon} {label}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-wider"><BookOpen className="w-6 h-6 text-blue-600" /> TCC Studio Operations Manual</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <HelpTab id="quick" label="Quick Start" icon={<MousePointerClick className="w-4 h-4" />} />
                    <HelpTab id="params" label="Device Parameters" icon={<Settings className="w-4 h-4" />} />
                    <HelpTab id="coord" label="Coordination Guide" icon={<GitCompare className="w-4 h-4" />} />
                    <HelpTab id="equip" label="Equipment Protection" icon={<Shield className="w-4 h-4" />} />
                </div>
                <div className="p-8 overflow-y-auto space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-white dark:bg-slate-900 flex-1">
                    {tab === 'quick' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Graph Controls</h3>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3"><span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">1</span><span><strong>Select Curve:</strong> Click directly on any curve to select it. The settings panel on the right will activate.</span></li>
                                        <li className="flex gap-3"><span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">2</span><span><strong>Drag Handles:</strong> Selected curves show a <span className="font-bold text-blue-500">Square</span> handle for Pickup (Current) and a <span className="font-bold text-purple-500">Circle</span> handle for Time Dial (Vertical Shift).</span></li>
                                        <li className="flex gap-3"><span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">3</span><span><strong>Fault Slider:</strong> Drag the vertical <span className="font-bold text-red-500">Red Dashed Line</span> to simulate different fault levels. The analysis panel updates in real-time.</span></li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Toolbar Functions</h3>
                                    <ul className="space-y-3">
                                        <li className="flex gap-3"><Layers className="w-5 h-5 text-blue-500 shrink-0" /> <span><strong>Scenarios:</strong> Load pre-configured industry examples (e.g., Transformer Damage, Motor Start).</span></li>
                                        <li className="flex gap-3"><Plus className="w-5 h-5 text-blue-500 shrink-0" /> <span><strong>Add Device:</strong> Adds a new generic relay to the graph. Default is IEC Standard Inverse.</span></li>
                                        <li className="flex gap-3"><Zap className="w-5 h-5 text-amber-500 shrink-0" /> <span><strong>Sim Fault:</strong> Numeric input for precise fault current simulation.</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    {tab === 'params' && (
                        <div className="space-y-6 animate-fade-in">
                            <p>Understanding the core parameters of Overcurrent Protection relays (50/51).</p>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Pickup / Plug Setting (Is)</h4>
                                    <p>The minimum current required to initiate the timing mechanism. Below this value, the relay never trips. Usually set based on Full Load Amps (FLA).</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-2">Time Dial / TMS (Time Multiplier Setting)</h4>
                                    <p>Shifts the curve vertically. A higher TMS means a longer trip time for the same fault current. Used to achieve selectivity between upstream and downstream devices.</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">Instantaneous (50)</h4>
                                    <p>Defines a current threshold above which the relay trips immediately (typically &lt;0.05s) with no intentional delay. Used for high-current close-in faults.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {tab === 'coord' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 mb-4">
                                <h3 className="font-bold text-green-800 dark:text-green-300 text-lg mb-2">Coordination Margin (CTI)</h3>
                                <p>The <strong>Coordination Time Interval (CTI)</strong> is the minimum time difference required between the primary (downstream) and backup (upstream) protective devices to ensure only the nearest breaker trips.</p>
                                <ul className="list-disc pl-5 mt-3 space-y-1">
                                    <li><strong>IEEE 242 (Buff Book) Recommendation:</strong> 0.2s - 0.4s</li>
                                    <li><strong>Components:</strong> Breaker operating time (0.08s) + Relay Overshoot (0.05s) + Safety Margin.</li>
                                </ul>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white">How to use the Coordinator Tool:</h4>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Open the <strong>Coordinator</strong> tab in the right panel.</li>
                                <li>Select an <strong>Upstream Device</strong> (e.g., Main Incomer).</li>
                                <li>Select a <strong>Downstream Device</strong> (e.g., Feeder).</li>
                                <li>Move the <strong>Fault Line</strong> to the maximum fault current.</li>
                                <li>Observe the calculated margin. If it is red (&lt;0.2s), increase the TMS of the upstream device using the quick-edit controls provided in the panel.</li>
                            </ol>
                        </div>
                    )}
                    {tab === 'equip' && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Equipment Limits</h3>
                            <p>Protective devices must operate <em>before</em> equipment damage occurs but <em>after</em> normal transient events.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                                    <h4 className="font-bold flex items-center gap-2 mb-2"><Flame className="w-5 h-5 text-red-500" /> Transformer Damage</h4>
                                    <p className="mb-2"><strong>ANSI C57.109:</strong> Defines thermal and mechanical withstand limits.</p>
                                    <p>The relay curve must remain <strong>below</strong> and to the <strong>left</strong> of the damage curve for all fault currents.</p>
                                </div>
                                <div className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                                    <h4 className="font-bold flex items-center gap-2 mb-2"><Factory className="w-5 h-5 text-amber-500" /> Motor Starting</h4>
                                    <p className="mb-2"><strong>Inrush Current:</strong> Motors draw 6-10x FLA during start.</p>
                                    <p>The relay curve must remain <strong>above</strong> and to the <strong>right</strong> of the motor starting curve to avoid nuisance tripping during startup.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                        Close Manual
                    </button>
                </div>
            </div>
        </div>
    );
};

const SimulatorView = ({ isActive }) => {
    // Simulator State
    const [devices, setDevices] = useState(JSON.parse(JSON.stringify(SCENARIOS[0].devices)));
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState(SCENARIOS[0].devices[0].id);
    const [faultAmps, setFaultAmps] = useState(2000);
    const [showHelp, setShowHelp] = useState(false);

    // Layout State
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [footerOpen, setFooterOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('params'); // 'params' | 'analysis'

    // Coordination Analysis State
    const [analysisPair, setAnalysisPair] = useState({ up: null, down: null });
    const [ctiParams, setCtiParams] = useState({ breakerTime: 0.08, relayOvershoot: 0.05, safetyMargin: 0.07 });

    // Viewport
    const [view, setView] = useState({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 });
    const [dims, setDims] = useState({ w: 800, h: 600 });
    const [cursor, setCursor] = useState(null);

    const reqMargin = Number((ctiParams.breakerTime + ctiParams.relayOvershoot + ctiParams.safetyMargin).toFixed(3));

    const graphRef = useRef(null);
    const [draggingId, setDraggingId] = useState(null);
    const [dragType, setDragType] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const stateParam = params.get('s');
        if (stateParam) {
            try {
                const state = JSON.parse(atob(stateParam));
                if (state.devices) setDevices(state.devices);
                if (state.faultAmps) setFaultAmps(state.faultAmps);
            } catch (e) {
                console.error("Failed to parse share link", e);
            }
        }
    }, []);

    const copyShareLink = () => {
        const state = { devices, faultAmps };
        const str = btoa(JSON.stringify(state));
        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?s=${str}`);
        alert("Simulation link copied! You can share this URL to load the exact state.");
    };

    // Resize Observer
    useEffect(() => {
        if (!graphRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
        });
        ro.observe(graphRef.current);
        return () => ro.disconnect();
    }, [leftPanelOpen, rightPanelOpen, footerOpen, isActive]);

    const saveSnapshot = () => {
        setSnapshots(prev => [...prev, {
            id: Date.now(),
            color: '#94a3b8', // slate-400
            devices: JSON.parse(JSON.stringify(devices))
        }]);
    };
    const clearSnapshots = () => setSnapshots([]);

    const addDevice = () => {
        const id = `dev_${Date.now()}`;
        const newDev = {
            id, name: `New Device ${devices.length + 1}`, type: 'Relay', curve: CurveType.IEC_STANDARD_INVERSE,
            pickup: 100, tds: 0.1, ctRatio: 100, color: COLORS[devices.length % COLORS.length],
            visible: true, locked: false, showBand: false, manufacturer: 'generic'
        };
        setDevices([...devices, newDev]);
        setSelectedId(id);
        setRightPanelOpen(true);
        setSettingsTab('params');
    };

    const updateDevice = (id, patch) => setDevices(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    const removeDevice = (id) => { setDevices(prev => prev.filter(d => d.id !== id)); if (selectedId === id) setSelectedId(null); };
    const loadScenario = (idx) => {
        const s = SCENARIOS[idx];
        setDevices(JSON.parse(JSON.stringify(s.devices)));
        setSelectedId(s.devices[0].id);
        setFaultAmps(2000);
        setLeftPanelOpen(true);
        setRightPanelOpen(true);
    };

    // Math Helpers
    const logMinX = Math.log10(view.minX); const logMaxX = Math.log10(view.maxX);
    const logMinY = Math.log10(view.minY); const logMaxY = Math.log10(view.maxY);
    const toPxX = (val) => ((Math.log10(val) - logMinX) / (logMaxX - logMinX)) * dims.w;
    const toPxY = (val) => dims.h - ((Math.log10(val) - logMinY) / (logMaxY - logMinY)) * dims.h;
    const fromPxX = (px) => Math.pow(10, logMinX + (px / dims.w) * (logMaxX - logMinX));
    const fromPxY = (py) => Math.pow(10, logMinY + ((dims.h - py) / dims.h) * (logMaxY - logMinY));

    // Renderers
    const GridLines = useMemo(() => {
        const lines = [];
        for (let i = Math.ceil(logMinX); i <= Math.floor(logMaxX); i++) {
            const x = toPxX(Math.pow(10, i));
            lines.push(<line key={`maj-x-${i}`} x1={x} y1={0} x2={x} y2={dims.h} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-x-${i}`} x={x + 4} y={dims.h - 5} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i) >= 1000 ? `${Math.pow(10, i) / 1000}k` : Math.pow(10, i)}</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minX && val < view.maxX) {
                    const xm = toPxX(val);
                    lines.push(<line key={`min-x-${val}`} x1={xm} y1={0} x2={xm} y2={dims.h} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        for (let i = Math.ceil(logMinY); i <= Math.floor(logMaxY); i++) {
            const y = toPxY(Math.pow(10, i));
            lines.push(<line key={`maj-y-${i}`} x1={0} y1={y} x2={dims.w} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />);
            lines.push(<text key={`lbl-y-${i}`} x={5} y={y - 4} className="text-[10px] fill-slate-400 font-bold select-none">{Math.pow(10, i)}s</text>);
            for (let j = 2; j < 10; j++) {
                const val = j * Math.pow(10, i);
                if (val > view.minY && val < view.maxY) {
                    const ym = toPxY(val);
                    lines.push(<line key={`min-y-${val}`} x1={0} y1={ym} x2={dims.w} y2={ym} stroke="currentColor" strokeOpacity={0.03} strokeWidth={1} />);
                }
            }
        }
        return <g className="text-slate-500 pointer-events-none">{lines}</g>;
    }, [view, dims]);

    const CurvePath = ({ dev, isSnapshot = false }: { dev: any, isSnapshot?: boolean }) => {
        if (!dev.visible) return null;
        let d = "";
        let dFuseBand = "";
        let dMin = "", dMax = "";
        const isEquipment = dev.type === 'Limit';
        const isFuse = [CurveType.FUSE_K_FAST, CurveType.FUSE_T_SLOW, CurveType.FUSE_NH_GG].includes(dev.curve);
        const startI = Math.max(dev.pickup, view.minX);
        const endI = dev.instantaneous ? Math.min(dev.instantaneous, view.maxX) : view.maxX;
        const mfr = dev.manufacturer || 'generic';
        const extraParams = { txCategory: dev.txCategory, cableType: dev.cableType, cableSize: dev.cableSize };

        const strokeDash = isEquipment ? "4,4" : (dev.locked ? "5,5" : (isSnapshot ? "8,4" : ""));
        const strokeWidth = isEquipment ? 3 : (selectedId === dev.id && !isSnapshot ? 3 : 2);

        if (dev.curve === CurveType.EQUIP_TRANSFORMER_DAMAGE) {
            const points = [];
            for (let i = dev.pickup * 2; i <= view.maxX; i *= 1.08) {
                const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, null, mfr, extraParams);
                if (t && t >= view.minY && t <= view.maxY) points.push({ x: toPxX(i), y: toPxY(t) });
            }
            points.forEach((p, i) => d += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `);
        }
        else if (dev.curve === CurveType.EQUIP_CABLE_DAMAGE) {
            const points = [];
            for (let i = Math.max(dev.pickup, view.minX); i <= view.maxX; i *= 1.08) {
                const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, null, mfr, extraParams);
                if (t && t >= view.minY && t <= view.maxY) points.push({ x: toPxX(i), y: toPxY(t) });
            }
            points.forEach((p, i) => d += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `);
        }
        else if (dev.curve === CurveType.EQUIP_MOTOR_START) {
            const x = toPxX(dev.pickup);
            const y = toPxY(20);
            const xEnd = toPxX(dev.pickup * 6);
            d = `M ${x} ${dims.h} L ${x} ${y} L ${xEnd} ${y} L ${xEnd} ${dims.h}`;
        }
        else if (isFuse) {
            // Fuse: render TCT curve as main line, and MMT-TCT as a shaded band
            const tctPoints = [];
            const mmtPoints = [];
            for (let i = startI * 1.01; i <= endI; i *= 1.05) {
                const tTCT = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, dev.instantaneous, mfr, extraParams);
                const tMMT = calculateFuseMMT(i, dev.pickup, dev.curve);
                if (tTCT && tTCT >= view.minY && tTCT <= view.maxY) tctPoints.push({ x: toPxX(i), y: toPxY(tTCT), t: tTCT });
                if (tMMT && tMMT >= view.minY && tMMT <= view.maxY) mmtPoints.push({ x: toPxX(i), y: toPxY(tMMT) });
            }
            tctPoints.forEach((p, i) => d += `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `);
            // Build fuse band (TCT path forward, MMT path backward)
            if (tctPoints.length > 0 && mmtPoints.length > 0) {
                const fwd = tctPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const bwd = [...mmtPoints].reverse().map((p) => `L ${p.x} ${p.y}`).join(' ');
                dFuseBand = `${fwd} ${bwd} Z`;
            }
        }
        else {
            if (dev.pickup >= view.minX && dev.pickup <= view.maxX) {
                const x = toPxX(dev.pickup);
                const topT = calculateTripTime(dev.pickup * 1.01, dev.pickup, dev.tds, dev.curve, dev.instantaneous, mfr, extraParams);
                const yTop = topT ? Math.max(0, toPxY(topT)) : 0;
                d += `M ${x} ${dims.h} L ${x} ${yTop} `;
            }
            const points = [];
            for (let i = startI * 1.01; i <= endI; i *= 1.05) {
                const t = calculateTripTime(i, dev.pickup, dev.tds, dev.curve, dev.instantaneous, mfr, extraParams);
                if (t && t >= view.minY && t <= view.maxY) points.push({ x: toPxX(i), y: toPxY(t), t });
            }
            points.forEach((p, i) => d += `${i === 0 && d === "" ? 'M' : 'L'} ${p.x} ${p.y} `);
            if (dev.instantaneous && dev.instantaneous <= view.maxX) {
                const instX = toPxX(dev.instantaneous);
                const lastY = points.length > 0 ? points[points.length - 1].y : toPxY(100);
                d += `L ${instX} ${lastY} L ${instX} ${toPxY(0.01)}`;
            }
            if (dev.showBand && points.length > 0) {
                const minPts = points.map(p => ({ x: p.x, y: toPxY(p.t * 0.9) }));
                const maxPts = points.map(p => ({ x: p.x, y: toPxY(p.t * 1.1) }));
                dMin = maxPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                dMax = [...minPts].reverse().map((p) => `L ${p.x} ${p.y}`).join(' ');
            }
        }

        const isSelected = selectedId === dev.id && !isSnapshot;
        const handlePickX = toPxX(dev.pickup);
        const handleTDSX = toPxX(dev.pickup * 5);
        const handleTDSY = toPxY(calculateTripTime(dev.pickup * 5, dev.pickup, dev.tds, dev.curve, dev.instantaneous, mfr, extraParams) || 10);
        const fuseLabel = isFuse ? ` (${FUSE_DATA[dev.curve]?.name || 'Fuse'})` : '';

        return (
            <g className={`group ${isSnapshot ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* Fuse MMT/TCT band */}
                {isFuse && dFuseBand && !isSnapshot && <path d={dFuseBand} fill={dev.color} fillOpacity="0.15" stroke="none" />}
                {/* Relay tolerance band */}
                {dev.showBand && !isEquipment && !isFuse && !isSnapshot && dMin && <path d={`${dMin} ${dMax} Z`} fill={dev.color} fillOpacity="0.1" stroke="none" />}
                <path d={d} fill="none" stroke={dev.color} strokeWidth={strokeWidth} strokeDasharray={strokeDash}
                    className={`transition-all duration-200 ${isSnapshot ? '' : 'cursor-pointer hover:stroke-[4px] hover:opacity-100 shadow-xl'} ${isSelected ? 'opacity-100' : 'opacity-80'}`}
                    onClick={(e) => { if(!isSnapshot) { e.stopPropagation(); setSelectedId(dev.id); if (!rightPanelOpen) setRightPanelOpen(true); } }}
                />
                {!isEquipment && !isSnapshot && (
                    <text x={handlePickX + 5} y={dims.h - 20} fill={dev.color} fontSize="10" fontWeight="bold" className="pointer-events-none select-none shadow-sm">{dev.name}{fuseLabel}</text>
                )}
                {isSelected && !dev.locked && !isEquipment && !isFuse && (
                    <g>
                        <rect x={handlePickX - 5} y={dims.h - 12} width={10} height={12} fill={dev.color} stroke="white" strokeWidth="1" className="cursor-ew-resize hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('PICKUP'); }} />
                        <circle cx={handleTDSX} cy={handleTDSY} r={5} fill={dev.color} stroke="white" strokeWidth="2" className="cursor-ns-resize hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); setDraggingId(dev.id); setDragType('TDS'); }} />
                    </g>
                )}
            </g>
        );
    };

    const FaultLine = () => {
        const x = toPxX(faultAmps);
        if (x < 0 || x > dims.w) return null;

        // Calculate arc flash energy for fastest-tripping device
        let arcFlashInfo = null;
        const activeRelays = devices.filter(d => d.visible && (d.type === 'Relay' || d.type === 'Fuse'));
        const tripTimes = activeRelays.map(d => calculateTripTime(faultAmps, d.pickup, d.tds, d.curve, d.instantaneous, d.manufacturer || 'generic')).filter(t => t !== null);
        if (tripTimes.length > 0) {
            const fastestTrip = Math.min(...tripTimes);
            const energy = calculateArcFlash(faultAmps, fastestTrip);
            const cat = getArcFlashCategory(energy);
            arcFlashInfo = { energy, cat, tripTime: fastestTrip };
        }

        // Coordination Arrow Visual logic
        let coordArrow = null;
        if (settingsTab === 'analysis' && analysisPair.up && analysisPair.down) {
            const upDev = devices.find(d => d.id === analysisPair.up);
            const downDev = devices.find(d => d.id === analysisPair.down);

            if (upDev && downDev) {
                const tUp = calculateTripTime(faultAmps, upDev.pickup, upDev.tds, upDev.curve, upDev.instantaneous, upDev.manufacturer || 'generic');
                const tDown = calculateTripTime(faultAmps, downDev.pickup, downDev.tds, downDev.curve, downDev.instantaneous, downDev.manufacturer || 'generic');

                if (tUp && tDown) {
                    const yUp = toPxY(tUp);
                    const yDown = toPxY(tDown);
                    const margin = tUp - tDown;
                    const isOk = margin >= reqMargin;
                    const midX = x + 20;

                    coordArrow = (
                        <g className="animate-fade-in">
                            <line x1={midX} y1={yDown} x2={midX} y2={yUp} stroke={isOk ? '#10b981' : '#ef4444'} strokeWidth="2" markerEnd="url(#arrowhead)" markerStart="url(#arrowtail)" />
                            <rect x={midX + 5} y={(yUp + yDown) / 2 - 10} width="60" height="20" rx="4" fill={isOk ? '#ecfdf5' : '#fef2f2'} stroke={isOk ? '#10b981' : '#ef4444'} />
                            <text x={midX + 35} y={(yUp + yDown) / 2 + 3} textAnchor="middle" fill={isOk ? '#059669' : '#b91c1c'} fontSize="10" fontWeight="bold">
                                Δ {margin.toFixed(2)}s
                            </text>
                            <defs>
                                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill={isOk ? '#10b981' : '#ef4444'} />
                                </marker>
                                <marker id="arrowtail" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                                    <polygon points="6 0, 0 2, 6 4" fill={isOk ? '#10b981' : '#ef4444'} />
                                </marker>
                            </defs>
                        </g>
                    );
                }
            }
        }

        return (
            <g className="group cursor-ew-resize" onMouseDown={(e) => { e.stopPropagation(); setDraggingId('FAULT'); setDragType('FAULT'); }}>
                <line x1={x} y1={0} x2={x} y2={dims.h} stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                <polygon points={`${x},0 ${x - 6},10 ${x + 6},10`} fill="#ef4444" className="drop-shadow-md group-hover:scale-125 transition-transform origin-top" />
                <text x={x + 8} y={20} fill="#ef4444" fontSize="11" fontWeight="bold" className="pointer-events-none select-none">Fault: {faultAmps.toFixed(0)}A</text>
                {/* Arc Flash HRC indicator */}
                {arcFlashInfo && (
                    <g className="pointer-events-none">
                        <rect x={x - 40} y={dims.h - 52} width={80} height={48} rx="6" fill={arcFlashInfo.cat.bgColor} stroke={arcFlashInfo.cat.color} strokeWidth="1.5" opacity="0.95" />
                        <text x={x} y={dims.h - 36} textAnchor="middle" fill={arcFlashInfo.cat.color} fontSize="9" fontWeight="bold">⚡ ARC FLASH</text>
                        <text x={x} y={dims.h - 24} textAnchor="middle" fill={arcFlashInfo.cat.color} fontSize="12" fontWeight="900">{arcFlashInfo.cat.label}</text>
                        <text x={x} y={dims.h - 12} textAnchor="middle" fill={arcFlashInfo.cat.color} fontSize="8">{arcFlashInfo.energy.toFixed(1)} cal/cm²</text>
                    </g>
                )}
                {coordArrow}
            </g>
        );
    };

    const handleMouseMove = (e) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const curAmps = fromPxX(mx);
        const curTime = fromPxY(my);
        setCursor({ x: curAmps, y: curTime });
        if (!draggingId) return;
        if (dragType === 'FAULT') { setFaultAmps(Math.max(view.minX, Math.min(curAmps, view.maxX))); }
        else if (dragType === 'PICKUP') { updateDevice(draggingId, { pickup: Math.round(Math.max(10, curAmps)) }); }
        else if (dragType === 'TDS') {
            const dev = devices.find(d => d.id === draggingId);
            if (dev) {
                const k = calculateTripTime(curAmps, dev.pickup, 1.0, dev.curve, dev.instantaneous);
                if (k) updateDevice(draggingId, { tds: Number(Math.max(0.01, curTime / k).toFixed(2)) });
            }
        }
    };

    const coordinationReport = useMemo(() => {
        const active = devices.filter(d => d.visible);
        const relays = active.filter(d => d.type === 'Relay' || d.type === 'Fuse'); // Treat Fuse as Relay for report
        const limits = active.filter(d => d.type === 'Limit');

        const trips = relays.map(d => ({
            id: d.id, name: d.name, color: d.color,
            time: calculateTripTime(faultAmps, d.pickup, d.tds, d.curve, d.instantaneous, d.manufacturer || 'generic')
        })).filter(t => t.time !== null).sort((a, b) => a.time - b.time);

        const report = [];

        limits.forEach(limit => {
            const limitTime = calculateTripTime(faultAmps, limit.pickup, limit.tds, limit.curve, null, limit.manufacturer || 'generic', { txCategory: limit.txCategory, cableType: limit.cableType, cableSize: limit.cableSize });
            if (limitTime) {
                const slowerRelays = trips.filter(t => t.time > limitTime);
                if (slowerRelays.length > 0) {
                    report.push({
                        type: 'VIOLATION',
                        msg: `Equipment Damage! ${limit.name} exceeded by ${slowerRelays[0].name}`,
                        violation: true, val: 0, color: '#ef4444'
                    });
                }
            }
        });

        for (let i = 0; i < trips.length; i++) {
            const trip = trips[i];
            report.push({ type: 'TRIP', ...trip });
            if (i < trips.length - 1) {
                const nextTrip = trips[i + 1];
                const margin = nextTrip.time - trip.time;
                const isViolation = margin < reqMargin;
                report.push({ type: 'MARGIN', val: margin, violation: isViolation, msg: isViolation ? `Critical: Increase Time Dial on ${nextTrip.name}` : 'Coordinated' });
            }
        }
        return report;
    }, [devices, faultAmps]);

    const selectedDevice = devices.find(d => d.id === selectedId);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden select-none font-sans"
            style={{ display: isActive ? 'flex' : 'none' }}
            onMouseMove={handleMouseMove} onMouseUp={() => setDraggingId(null)} onMouseLeave={() => { setDraggingId(null); setCursor(null); }}>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            {/* HEADER TOOLBAR */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!leftPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {leftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors">
                            <Layers className="w-3 h-3 text-blue-500" /> Scenarios <ChevronDown className="w-3 h-3" />
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-50 p-2">
                            {SCENARIOS.map((s, i) => (
                                <button key={s.id} onClick={() => loadScenario(i)} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{s.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-xs font-bold transition-colors">
                        <Info className="w-3 h-3" /> Help
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Zap className="w-3 h-3 text-amber-500 fill-current animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Sim Fault:</span>
                        <input type="number" min="0" value={faultAmps} onChange={(e) => setFaultAmps(Number(e.target.value))} className="w-16 bg-transparent text-xs font-mono font-bold outline-none text-right border-b border-slate-300 dark:border-slate-600 focus:border-blue-500" />
                        <span className="text-[10px] text-slate-500 font-bold">A</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{devices.length}/7</span>
                        <span className="text-[9px] text-slate-400">devices</span>
                    </div>
                    <button onClick={addDevice} disabled={devices.length >= 7} className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 ${devices.length >= 7 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        <Plus className="w-3 h-3" /> Add Device
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={saveSnapshot} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                        <Save className="w-3 h-3" /> Snapshot
                    </button>
                    {snapshots.length > 0 && <button onClick={clearSnapshots} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Clear Snapshots"><Trash2 className="w-4 h-4" /></button>}
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${!rightPanelOpen ? 'text-blue-600' : 'text-slate-400'}`}>
                        {rightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* LEFT: INTELLIGENT REPORT */}
                <div className={`border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 transition-all duration-300 ease-in-out ${leftPanelOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}`}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-wider"><Clock className="w-3 h-3 text-slate-400" /> Coordination Check</span>
                    </div>
                    {/* CTI Validation Banner */}
                    {coordinationReport.length > 0 && (
                        <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border-b ${coordinationReport.some(r => r.violation) ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}`}>
                            {coordinationReport.some(r => r.violation) ? <><AlertOctagon className="w-3 h-3" /> CTI Check: FAIL — Margins below {reqMargin}s</> : <><CheckCircle2 className="w-3 h-3" /> CTI Check: PASS — All margins ≥ {reqMargin}s</>}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
                        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                        {coordinationReport.length > 0 ? coordinationReport.map((item, i) => (
                            <div key={i} className="relative pl-10 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                                {item.type === 'TRIP' ? (
                                    <div className="relative group">
                                        <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm z-10" style={{ backgroundColor: item.color }}></div>
                                        <div className="p-2 rounded-lg border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: item.color }} onClick={() => setSelectedId(item.id)}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.name}</span><span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Trip Initiated</span></div>
                                                <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{item.time.toFixed(3)}s</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="my-1 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'VIOLATION' ? (
                                                <div className="text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200">
                                                    <Flame className="w-3 h-3" /> Violation
                                                </div>
                                            ) : (
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-sm flex items-center gap-1.5 ${item.violation ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'}`}>
                                                    {item.violation ? <AlertOctagon className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />} Margin: {item.val.toFixed(3)}s
                                                </div>
                                            )}
                                        </div>
                                        {item.violation && <div className="text-[10px] text-red-600 italic bg-red-50/50 p-1 rounded border-l-2 border-red-400">{item.msg}</div>}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs text-center px-6"><AlertTriangle className="w-8 h-8 mb-2 opacity-20" />No devices operate at {faultAmps}A. <br />Drag the Red Fault Line to test.</div>
                        )}
                    </div>
                    {/* Export Report & Share Button */}
                    <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                        {coordinationReport.length > 0 && (
                            <button onClick={() => {
                                const lines = coordinationReport.map(r => r.type === 'TRIP' ? `TRIP: ${r.name} at ${r.time.toFixed(3)}s` : r.type === 'VIOLATION' ? `!! ${r.msg}` : `   Margin: ${r.val.toFixed(3)}s ${r.violation ? '(FAIL)' : '(OK)'}`);
                                downloadTextFile(`TCC Coordination Report @ ${faultAmps}A\n${lines.join('\n')}`, 'TCC_Coordination_Report.txt');
                            }} className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                                <Download className="w-3 h-3" /> Export Report
                            </button>
                        )}
                        <button onClick={copyShareLink} className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors">
                            <Share2 className="w-3 h-3" /> Share
                        </button>
                    </div>
                    <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Visible Devices</div>
                        <div className="flex flex-wrap gap-2">
                            {devices.map(d => (
                                <button key={d.id} onClick={() => updateDevice(d.id, { visible: !d.visible })} className={`w-3 h-3 rounded-full transition-all border ${d.visible ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale'}`} style={{ backgroundColor: d.color, borderColor: d.color }} title={d.name} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: INTERACTIVE GRAPH */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden cursor-crosshair flex flex-col">
                    <div ref={graphRef} className="flex-1 relative m-2 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                        <svg width={dims.w} height={dims.h} className="absolute inset-0 block">
                            {GridLines}
                            {snapshots.map(snap => snap.devices.map((dev: any) => (
                                <g key={`snap-${snap.id}-${dev.id}`}>
                                    {CurvePath({ dev: { ...dev, color: snap.color }, isSnapshot: true })}
                                </g>
                            )))}
                            {devices.map(dev => (
                                <g key={dev.id}>
                                    {CurvePath({ dev })}
                                </g>
                            ))}
                            {FaultLine()}
                        </svg>
                        {cursor && (
                            <div className="absolute top-4 right-4 bg-slate-900/90 text-white p-2 rounded-lg text-[10px] font-mono backdrop-blur-md pointer-events-none border border-slate-700 shadow-2xl z-30 flex flex-col gap-1 min-w-[120px]">
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Current:</span> <span className="font-bold text-amber-400">{cursor.x.toFixed(1)} A</span></div>
                                <div className="flex justify-between gap-4"><span className="text-slate-400">Time:</span> <span className="font-bold text-blue-400">{cursor.y.toFixed(3)} s</span></div>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button onClick={() => setView(v => ({ ...v, minX: v.minX * 0.8, maxX: v.maxX * 1.2 }))} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><ZoomOut className="w-4 h-4 text-slate-500" /></button>
                            <button onClick={() => setView({ minX: 10, maxX: 100000, minY: 0.01, maxY: 1000 })} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-slate-50 transition-transform active:scale-95"><RotateCcw className="w-4 h-4 text-slate-500" /></button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SETTINGS PANEL */}
                <div className={`border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${rightPanelOpen ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>

                    {/* TABS */}
                    <div className="flex p-1 m-4 mb-0 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <button onClick={() => setSettingsTab('params')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settingsTab === 'params' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Parameters</button>
                        <button onClick={() => setSettingsTab('analysis')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${settingsTab === 'analysis' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Coordinator</button>
                    </div>

                    {settingsTab === 'params' && (
                        selectedDevice ? (
                            <>
                                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedDevice.color }}></div><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedDevice.type} Settings</span></div>
                                    {!selectedDevice.locked && <button onClick={() => removeDevice(selectedDevice.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>}
                                </div>
                                <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                                    {selectedDevice.locked ? (
                                        <div className="text-center p-6 text-slate-500 text-xs italic bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <Lock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            This is a protected system curve (Damage or Start Limit). It cannot be edited in this view.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Device Name</label><input type="text" value={selectedDevice.name} onChange={(e) => updateDevice(selectedDevice.id, { name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" /></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">CT Ratio</label>
                                                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                                                            <select value={selectedDevice.ctRatio} onChange={(e) => updateDevice(selectedDevice.id, { ctRatio: Number(e.target.value) })} className="w-full bg-transparent border-none py-1.5 text-xs font-mono font-bold outline-none appearance-none">
                                                                {[50,100,150,200,250,300,400,500,600,800,900,1000,1200,1500,2000,2500,3000,4000,5000].map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                            <span className="text-[10px] text-slate-400 font-bold ml-1">:1</span>
                                                        </div>
                                                    </div>
                                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Color</label><div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">{COLORS.slice(0, 4).map(c => (<button key={c} onClick={() => updateDevice(selectedDevice.id, { color: c })} className={`w-4 h-4 rounded-full border-2 transition-transform ${selectedDevice.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
                                                </div>
                                            </div>
                                            <hr className="border-slate-100 dark:border-slate-800" />
                                            <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Characteristic Curve</label><div className="relative"><select value={selectedDevice.curve} onChange={(e) => updateDevice(selectedDevice.id, { curve: e.target.value })} className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-8 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate">{CURVE_LIB.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select><ChevronDown className="absolute right-2 top-3 w-3 h-3 text-slate-400 pointer-events-none" /></div></div>
                                            {/* Manufacturer selector (ANSI curves only) */}
                                            {selectedDevice.curve?.startsWith('ANSI') && (
                                                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                                    <label className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1.5 block">Relay Manufacturer</label>
                                                    <select value={selectedDevice.manufacturer || 'generic'} onChange={(e) => updateDevice(selectedDevice.id, { manufacturer: e.target.value })} className="w-full appearance-none bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-xs font-bold outline-none">
                                                        {Object.entries(MANUFACTURERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                    </select>
                                                    <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1.5 italic">SEL does not multiply additive constant B by TDS — affects trip times at low multiples.</p>
                                                </div>
                                            )}
                                            <div className="space-y-6">
                                                <Slider 
                                                    label="Pickup (Is)" 
                                                    unit=" A" 
                                                    min={10} 
                                                    max={2000} 
                                                    step={10} 
                                                    value={selectedDevice.pickup} 
                                                    onChange={e => updateDevice(selectedDevice.id, { pickup: Number(e.target.value) })} 
                                                    color="blue" 
                                                />
                                                <Slider 
                                                    label="Time Dial (TMS)" 
                                                    min={0.01} 
                                                    max={1.5} 
                                                    step={0.01} 
                                                    value={selectedDevice.tds} 
                                                    onChange={e => updateDevice(selectedDevice.id, { tds: Number(e.target.value) })} 
                                                    color="purple" 
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"><div><div className="text-xs font-bold text-slate-700 dark:text-slate-200">Instantaneous (50)</div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={!!selectedDevice.instantaneous} onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: e.target.checked ? selectedDevice.pickup * 10 : undefined })} /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div></label></div>
                                            {selectedDevice.instantaneous && (<div className="animate-fade-in -mt-4 p-3 pt-0 bg-slate-50 dark:bg-slate-800 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-700"><input type="number" min="0" value={selectedDevice.instantaneous} onChange={(e) => updateDevice(selectedDevice.id, { instantaneous: Number(e.target.value) })} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1.5 text-xs font-mono font-bold" /></div>)}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs p-8 text-center"><MousePointer2 className="w-10 h-10 mb-4 opacity-20" /><p>Select a curve to edit settings</p></div>
                        )
                    )}

                    {settingsTab === 'analysis' && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <GitCompare className="w-4 h-4" /> Pair Analysis
                                </h3>

                                <div className="space-y-4">
                                    {/* UPSTREAM CONFIGURATION */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Upstream (Source)</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-transparent font-bold text-xs outline-none"
                                                    value={analysisPair.up || ''}
                                                    onChange={(e) => setAnalysisPair(prev => ({ ...prev, up: e.target.value }))}
                                                >
                                                    <option value="">Select Device...</option>
                                                    {devices.filter(d => !d.locked).map(d => (
                                                        <option key={d.id} value={d.id}>{d.name} ({d.pickup}A)</option>
                                                    ))}
                                                </select>
                                                <ArrowUpFromLine className="absolute right-0 top-0.5 w-3 h-3 text-blue-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        {analysisPair.up && (
                                            <div className="p-3 grid grid-cols-2 gap-2">
                                                <div className="col-span-2">
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Curve Type</label>
                                                    <select className="w-full text-[10px] bg-slate-100 dark:bg-slate-900 rounded p-1 border-none font-bold"
                                                        value={devices.find(d => d.id === analysisPair.up)?.curve}
                                                        onChange={(e) => updateDevice(analysisPair.up, { curve: e.target.value })}
                                                    >
                                                        {CURVE_LIB.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Pickup (A)</label>
                                                    <input type="number" min="0" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.up)?.pickup ?? ''}
                                                        onChange={(e) => updateDevice(analysisPair.up, { pickup: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Time Dial</label>
                                                    <input type="number" min="0" step="0.05" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.up)?.tds ?? ''}
                                                        onChange={(e) => updateDevice(analysisPair.up, { tds: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Inst (50)</label>
                                                    <input type="number" min="0" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.up)?.instantaneous ?? ''}
                                                        placeholder="None"
                                                        onChange={(e) => updateDevice(analysisPair.up, { instantaneous: e.target.value ? Number(e.target.value) : undefined })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-center -my-3 z-10 relative">
                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-full text-slate-400 shadow-sm">
                                            <ArrowDownToLine className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* DOWNSTREAM CONFIGURATION */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Downstream (Load)</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-transparent font-bold text-xs outline-none"
                                                    value={analysisPair.down || ''}
                                                    onChange={(e) => setAnalysisPair(prev => ({ ...prev, down: e.target.value }))}
                                                >
                                                    <option value="">Select Device...</option>
                                                    {devices.filter(d => !d.locked && d.id !== analysisPair.up).map(d => (
                                                        <option key={d.id} value={d.id}>{d.name} ({d.pickup}A)</option>
                                                    ))}
                                                </select>
                                                <ArrowDownToLine className="absolute right-0 top-0.5 w-3 h-3 text-blue-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        {analysisPair.down && (
                                            <div className="p-3 grid grid-cols-2 gap-2">
                                                <div className="col-span-2">
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Curve Type</label>
                                                    <select className="w-full text-[10px] bg-slate-100 dark:bg-slate-900 rounded p-1 border-none font-bold"
                                                        value={devices.find(d => d.id === analysisPair.down)?.curve}
                                                        onChange={(e) => updateDevice(analysisPair.down, { curve: e.target.value })}
                                                    >
                                                        {CURVE_LIB.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Pickup (A)</label>
                                                    <input type="number" min="0" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.down)?.pickup ?? ''}
                                                        onChange={(e) => updateDevice(analysisPair.down, { pickup: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Time Dial</label>
                                                    <input type="number" min="0" step="0.05" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.down)?.tds ?? ''}
                                                        onChange={(e) => updateDevice(analysisPair.down, { tds: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Inst (50)</label>
                                                    <input type="number" min="0" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                        value={devices.find(d => d.id === analysisPair.down)?.instantaneous ?? ''}
                                                        placeholder="None"
                                                        onChange={(e) => updateDevice(analysisPair.down, { instantaneous: e.target.value ? Number(e.target.value) : undefined })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CTI CALCULATION PARAMETERS */}
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mt-4">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">CTI Parameters (IEEE 242)</label>
                                            <div className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                                Req: {reqMargin.toFixed(3)}s
                                            </div>
                                        </div>
                                        <div className="p-3 grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Breaker (s)</label>
                                                <input type="number" min="0" step="0.01" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                    value={ctiParams.breakerTime}
                                                    onChange={(e) => setCtiParams(prev => ({ ...prev, breakerTime: Number(e.target.value) }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Overshoot (s)</label>
                                                <input type="number" min="0" step="0.01" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                    value={ctiParams.relayOvershoot}
                                                    onChange={(e) => setCtiParams(prev => ({ ...prev, relayOvershoot: Number(e.target.value) }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Safety (s)</label>
                                                <input type="number" min="0" step="0.01" className="w-full bg-slate-100 dark:bg-slate-900 rounded p-1 text-[10px] font-mono font-bold"
                                                    value={ctiParams.safetyMargin}
                                                    onChange={(e) => setCtiParams(prev => ({ ...prev, safetyMargin: Number(e.target.value) }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto">
                                {analysisPair.up && analysisPair.down ? (() => {
                                    const upDev = devices.find(d => d.id === analysisPair.up);
                                    const downDev = devices.find(d => d.id === analysisPair.down);
                                    if (!upDev || !downDev) return null;

                                    const tUp = calculateTripTime(faultAmps, upDev.pickup, upDev.tds, upDev.curve, upDev.instantaneous, upDev.manufacturer || 'generic');
                                    const tDown = calculateTripTime(faultAmps, downDev.pickup, downDev.tds, downDev.curve, downDev.instantaneous, downDev.manufacturer || 'generic');

                                    if (tUp === null || tDown === null) return <div className="text-center text-xs text-slate-500 italic mt-4">One or both devices do not operate at {faultAmps}A. Adjust Fault current.</div>;

                                    const margin = tUp - tDown;
                                    const isCoordinated = margin >= reqMargin;

                                    // Run full-range sweep analysis
                                    const sweep = sweepCoordination(upDev, downDev);
                                    const sweepOk = sweep.minMargin !== null && sweep.minMargin >= reqMargin;

                                    return (
                                        <div className="space-y-4 animate-fade-in">
                                            {/* Point Analysis */}
                                            <div className={`p-4 rounded-xl border-l-4 shadow-sm ${isCoordinated ? 'bg-green-50 dark:bg-green-900/10 border-green-500 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-800 dark:text-red-300'}`}>
                                                <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                                                    {isCoordinated ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                                    {isCoordinated ? 'Coordinated' : 'Coordination Violation'}
                                                </div>
                                                <div className="text-3xl font-black mb-1">{margin.toFixed(3)}s</div>
                                                <div className="text-xs opacity-75">Margin at {faultAmps.toFixed(0)}A (fault line)</div>
                                            </div>

                                            {/* Sweep Analysis */}
                                            {sweep.minMargin !== null && (
                                                <div className={`p-3 rounded-xl border shadow-sm ${sweepOk ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                        <Ruler className="w-3 h-3" /> Full-Range Sweep Analysis
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-slate-400 font-bold block text-[9px] uppercase">Worst-Case Margin</span>
                                                            <span className={`font-mono font-black text-lg ${sweepOk ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{sweep.minMargin.toFixed(3)}s</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 font-bold block text-[9px] uppercase">At Current</span>
                                                            <span className="font-mono font-black text-lg text-slate-700 dark:text-slate-200">{sweep.worstCurrent.toFixed(0)}A</span>
                                                        </div>
                                                    </div>
                                                    {sweep.crossings.length > 0 && (
                                                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-300">
                                                            <span className="text-[10px] font-bold text-red-800 dark:text-red-300 flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> CROSSOVER DETECTED: Curves cross at {sweep.crossings.map(c => `${c.current.toFixed(0)}A`).join(', ')}</span>
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-[9px] text-slate-500 dark:text-slate-400">
                                                        Evaluated {sweep.points.length} points across overlap range. {sweepOk ? `✅ All margins ≥ ${reqMargin}s` : '❌ Violations found — adjust TDS or pickup.'}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Recommendations</h4>
                                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                                                    {(!isCoordinated || !sweepOk) && (
                                                        <li className="flex gap-2">
                                                            <ArrowUpFromLine className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                                            <span>Increase <strong>{upDev.name}</strong> Time Dial (TDS) to at least <strong>{(upDev.tds * (1 + (reqMargin - (sweep.minMargin ?? margin)) / tUp)).toFixed(2)}</strong>.</span>
                                                        </li>
                                                    )}
                                                    {(!isCoordinated || !sweepOk) && (
                                                        <li className="flex gap-2">
                                                            <ArrowDownToLine className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                                            <span>Decrease <strong>{downDev.name}</strong> Time Dial (TDS) if load permits.</span>
                                                        </li>
                                                    )}
                                                    <li className="flex gap-2 text-slate-400">
                                                        <Ruler className="w-3 h-3 shrink-0 mt-0.5" />
                                                        <span>Standard CTI requirement: 0.2s - 0.4s (IEEE 242).</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="text-center text-slate-400 text-xs mt-10">
                                        Select both devices to run analysis.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ENGINEERING FOOTER */}
            <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 ${footerOpen ? 'h-auto max-h-[40vh]' : 'h-8'} overflow-hidden flex flex-col`}>
                <button onClick={() => setFooterOpen(!footerOpen)} className="w-full h-8 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800 transition-colors shrink-0">
                    <GraduationCap className="w-3 h-3" /> Knowledge Base <ChevronUp className={`w-3 h-3 transition-transform duration-300 ${footerOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto">
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4" /> Time Dial (TMS)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">The <strong>Time Multiplier Setting (TMS)</strong>, also known as Time Dial (TDS), vertically shifts the curve.<br /><br /><em className="text-slate-500">Formula (IEC):</em> t = TMS × [k / ((I/Is)^α - 1)]</p></div>
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4" /> Coordination Time Interval (CTI)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Safety margin required between two devices.<br /><strong>Standard: 0.2s - 0.4s</strong>. This accounts for breaker time, relay overshoot, and errors.</p></div>
                    <div className="space-y-3"><h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4" /> Instantaneous (50)</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">ANSI 50 element trips with no intentional delay (typically &lt;30ms). <strong>Warning:</strong> Ensure pickup is set <em>above</em> the maximum through-fault current to avoid over-reaching.</p></div>
                </div>
            </div>
        </div>
    );
};

// --- 4. MAIN COMPONENT (DASHBOARD) ---

const TCCStudio = () => {
    const [mode, setMode] = useState('simulator'); // 'theory' | 'simulator' | 'quiz'

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
<SEO title="T C C Studio" description="Interactive Power System simulation and engineering tool: T C C Studio." url="/tccstudio" />

            {/* Top Navigation Bar */}
            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-black text-lg leading-none tracking-tight text-slate-900 dark:text-white">TCC Studio <span className="text-blue-600">PRO</span></h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protection Suite v2.0</span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full opacity-50"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">IEEE C37.112 / IEC 60255</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[
                        { id: 'theory', label: 'Theory', icon: <BookOpen className="w-4 h-4" /> },
                        { id: 'simulator', label: 'Simulator', icon: <Activity className="w-4 h-4" /> },
                        { id: 'quiz', label: 'Quiz', icon: <Trophy className="w-4 h-4" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === tab.id ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-32 hidden md:block">
                    {/* Spacer to balance title */}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {mode === 'theory' && (
                    <div className="h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                        <TheoryModule />
                    </div>
                )}

                {/* Simulator is kept mounted but hidden when not active to preserve state */}
                <SimulatorView isActive={mode === 'simulator'} />

                {mode === 'quiz' && (
                    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
                        <QuizModule />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TCCStudio;