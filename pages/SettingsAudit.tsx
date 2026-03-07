import React, { useState, useMemo } from 'react';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Download, RotateCcw, Info, Zap, FileText, Shield } from 'lucide-react';
import { useThemeObserver } from '../hooks/useThemeObserver';
import SEO from '../components/SEO';

// ─── SETTINGS AUDIT ENGINE ───
// 10 automated checks for relay protection settings verification

interface RelaySettings {
    feederName: string;
    ctRatio: number;        // e.g., 400 (for 400/1)
    cableRating: number;    // Amps
    maxLoadCurrent: number; // Amps
    minFaultCurrent: number;// Amps at relay (secondary)
    pickupCurrent: number;  // relay pickup in Amps (primary)
    tms: number;            // Time Multiplier Setting
    curveType: string;
    zone1Reach: number;     // % of line impedance (for distance relays)
    ctClass: string;
    burstRating: number;    // kA fault withstand of equipment
    boltedFault: number;    // kA available fault current
    gradingMargin: number;  // seconds between upstream and this relay
    earthFaultPickup: number; // % of CT rating
}

interface AuditCheck {
    id: string;
    name: string;
    standard: string;
    check: (s: RelaySettings) => { pass: boolean; detail: string };
}

const AUDIT_CHECKS: AuditCheck[] = [
    {
        id: 'pickup-above-load',
        name: 'Pickup > 110% Maximum Load',
        standard: 'IEC 60255 / BS 142',
        check: (s) => {
            const ratio = s.pickupCurrent / s.maxLoadCurrent;
            const pass = ratio >= 1.1;
            return {
                pass,
                detail: pass
                    ? `Pickup is ${(ratio * 100).toFixed(0)}% of max load (≥ 110%). ✓`
                    : `Pickup is only ${(ratio * 100).toFixed(0)}% of max load. Must be ≥ 110% to avoid nuisance trips during normal overload.`
            };
        }
    },
    {
        id: 'pickup-below-fault',
        name: 'Pickup < Minimum Fault Current',
        standard: 'IEEE C37.112',
        check: (s) => {
            const faultPrimary = s.minFaultCurrent * s.ctRatio;
            const pass = s.pickupCurrent < faultPrimary;
            return {
                pass,
                detail: pass
                    ? `Pickup ${s.pickupCurrent}A < min fault ${faultPrimary}A. Relay will see all faults. ✓`
                    : `Pickup ${s.pickupCurrent}A ≥ min fault ${faultPrimary}A. Relay may NOT detect remote faults!`
            };
        }
    },
    {
        id: 'cable-protected',
        name: 'Cable Thermally Protected',
        standard: 'IEC 60364 / BS 7671',
        check: (s) => {
            const pass = s.pickupCurrent <= s.cableRating * 1.45;
            return {
                pass,
                detail: pass
                    ? `Pickup ${s.pickupCurrent}A ≤ ${(s.cableRating * 1.45).toFixed(0)}A (1.45 × cable rating). Cable protected. ✓`
                    : `Pickup ${s.pickupCurrent}A > ${(s.cableRating * 1.45).toFixed(0)}A. Cable may be damaged before relay operates!`
            };
        }
    },
    {
        id: 'tms-minimum',
        name: 'TMS ≥ 0.05',
        standard: 'IEC 60255-151',
        check: (s) => {
            const pass = s.tms >= 0.05;
            return {
                pass,
                detail: pass
                    ? `TMS = ${s.tms} (≥ 0.05). Within normal operating range. ✓`
                    : `TMS = ${s.tms} is below minimum. Most relays cannot reliably reproduce curves below TMS 0.05.`
            };
        }
    },
    {
        id: 'tms-maximum',
        name: 'TMS ≤ 1.2',
        standard: 'IEC 60255-151',
        check: (s) => {
            const pass = s.tms <= 1.2;
            return {
                pass,
                detail: pass
                    ? `TMS = ${s.tms} (≤ 1.2). Acceptable. ✓`
                    : `TMS = ${s.tms} is very high. Relay will be slow — investigate if upstream coordination can be improved.`
            };
        }
    },
    {
        id: 'grading-margin',
        name: 'Grading Margin ≥ 0.3s',
        standard: 'IEEE C37.112 / CEA Grid Code',
        check: (s) => {
            const pass = s.gradingMargin >= 0.3;
            return {
                pass,
                detail: pass
                    ? `Grading margin = ${s.gradingMargin}s (≥ 0.3s). Proper coordination. ✓`
                    : `Grading margin = ${s.gradingMargin}s (< 0.3s). Risk of both relays tripping — increase to 0.3-0.4s.`
            };
        }
    },
    {
        id: 'ct-burden',
        name: 'CT Class Adequate for Protection',
        standard: 'IEC 61869-2',
        check: (s) => {
            const validClasses = ['5P10', '5P20', '5P30', '10P10', '10P20', '10P30', 'PX', 'TPX', 'TPY'];
            const pass = validClasses.some(c => s.ctClass.toUpperCase().includes(c.toUpperCase()));
            return {
                pass,
                detail: pass
                    ? `CT class "${s.ctClass}" is suitable for protection applications. ✓`
                    : `CT class "${s.ctClass}" may not be suitable. Protection CTs should be 5P20/10P20 or PX class per IEC 61869-2.`
            };
        }
    },
    {
        id: 'fault-withstand',
        name: 'Equipment Fault Rating ≥ Available Fault',
        standard: 'IEC 62271-200',
        check: (s) => {
            const pass = s.burstRating >= s.boltedFault;
            return {
                pass,
                detail: pass
                    ? `Equipment rated ${s.burstRating} kA ≥ available fault ${s.boltedFault} kA. ✓`
                    : `Equipment rated ${s.burstRating} kA < available fault ${s.boltedFault} kA. ⚠️ DANGEROUS — equipment may explode!`
            };
        }
    },
    {
        id: 'earth-fault-sensitivity',
        name: 'Earth Fault Pickup ≤ 20% CT Rating',
        standard: 'CEA Technical Standards',
        check: (s) => {
            const pass = s.earthFaultPickup <= 20;
            return {
                pass,
                detail: pass
                    ? `Earth fault pickup at ${s.earthFaultPickup}% (≤ 20%). Sensitive enough for ground faults. ✓`
                    : `Earth fault pickup at ${s.earthFaultPickup}%. Too high — may miss high-impedance ground faults. Set ≤ 20%.`
            };
        }
    },
    {
        id: 'zone1-reach',
        name: 'Zone 1 Reach 80-85% of Line',
        standard: 'IEEE C37.113 / IEC 60255-121',
        check: (s) => {
            const pass = s.zone1Reach >= 75 && s.zone1Reach <= 90;
            return {
                pass,
                detail: pass
                    ? `Zone 1 reach = ${s.zone1Reach}% (75-90% range). ✓`
                    : `Zone 1 reach = ${s.zone1Reach}%. Recommended range is 80-85% to avoid overreach/underreach.`
            };
        }
    },
];

export default function SettingsAudit() {
    const isDark = useThemeObserver();

    const [settings, setSettings] = useState<RelaySettings>({
        feederName: '11kV Feeder F-1',
        ctRatio: 400,
        cableRating: 350,
        maxLoadCurrent: 250,
        minFaultCurrent: 2.5,
        pickupCurrent: 300,
        tms: 0.15,
        curveType: 'Standard Inverse (SI)',
        zone1Reach: 80,
        ctClass: '5P20',
        burstRating: 25,
        boltedFault: 20,
        gradingMargin: 0.35,
        earthFaultPickup: 10,
    });

    const update = (key: keyof RelaySettings, value: string | number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const results = useMemo(() => {
        return AUDIT_CHECKS.map(check => ({
            ...check,
            result: check.check(settings),
        }));
    }, [settings]);

    const passCount = results.filter(r => r.result.pass).length;
    const failCount = results.filter(r => !r.result.pass).length;
    const score = Math.round((passCount / results.length) * 100);

    const scoreColor = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
            <SEO
                title="Relay Settings Audit Tool"
                description="Automated relay protection settings verification against IEC, IEEE, and CEA standards. 10-point audit with pass/fail report."
                url="/settings-audit"
            />

            {/* Header */}
            <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-lg mr-4 shadow-lg shadow-indigo-500/20">
                        <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Settings Audit Tool</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">10-Point Commissioning Check</p>
                    </div>
                </div>
                {/* Score badge */}
                <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <span className={`text-2xl font-black ${scoreColor}`}>{score}%</span>
                    <span className="text-xs text-slate-500">{passCount}/{results.length} passed</span>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ─── INPUT PANEL ─── */}
                    <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Feeder & Relay Settings
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Feeder Name</label>
                                <input type="text" value={settings.feederName} onChange={e => update('feederName', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">CT Ratio (/1)</label>
                                    <input type="number" value={settings.ctRatio} onChange={e => update('ctRatio', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">CT Class</label>
                                    <input type="text" value={settings.ctClass} onChange={e => update('ctClass', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Cable Rating (A)</label>
                                    <input type="number" value={settings.cableRating} onChange={e => update('cableRating', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Max Load Current (A)</label>
                                    <input type="number" value={settings.maxLoadCurrent} onChange={e => update('maxLoadCurrent', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Pickup Current (A)</label>
                                    <input type="number" value={settings.pickupCurrent} onChange={e => update('pickupCurrent', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">TMS</label>
                                    <input type="number" step={0.01} value={settings.tms} onChange={e => update('tms', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Min Fault (A, secondary)</label>
                                    <input type="number" step={0.1} value={settings.minFaultCurrent} onChange={e => update('minFaultCurrent', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Grading Margin (s)</label>
                                    <input type="number" step={0.05} value={settings.gradingMargin} onChange={e => update('gradingMargin', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Bolted Fault (kA)</label>
                                    <input type="number" value={settings.boltedFault} onChange={e => update('boltedFault', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Equipment Rating (kA)</label>
                                    <input type="number" value={settings.burstRating} onChange={e => update('burstRating', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Zone 1 Reach (%)</label>
                                    <input type="number" value={settings.zone1Reach} onChange={e => update('zone1Reach', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Earth Fault Pickup (%)</label>
                                    <input type="number" value={settings.earthFaultPickup} onChange={e => update('earthFaultPickup', Number(e.target.value))}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RESULTS PANEL ─── */}
                    <div className="space-y-4">
                        {/* Score Summary */}
                        <div className={`p-6 rounded-2xl border shadow-sm text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`text-5xl font-black ${scoreColor}`}>{score}%</div>
                            <div className="text-sm font-bold text-slate-500 mt-1">Audit Score</div>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-bold">
                                    <CheckCircle className="w-4 h-4" /> {passCount} Passed
                                </div>
                                <div className="flex items-center gap-1.5 text-red-500 text-sm font-bold">
                                    <XCircle className="w-4 h-4" /> {failCount} Failed
                                </div>
                            </div>
                            {/* Score bar */}
                            <div className="mt-4 w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(passCount / results.length) * 100}%` }} />
                                <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(failCount / results.length) * 100}%` }} />
                            </div>
                        </div>

                        {/* Individual Check Results */}
                        <div className="space-y-2">
                            {results.map((r) => (
                                <div
                                    key={r.id}
                                    className={`p-4 rounded-xl border transition-all ${r.result.pass
                                            ? isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'
                                            : isDark ? 'bg-red-950/20 border-red-800/50' : 'bg-red-50 border-red-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {r.result.pass
                                            ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        }
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm">{r.name}</span>
                                                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    {r.standard}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                {r.result.detail}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Feeder Summary */}
                        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Audit Summary
                            </h3>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between"><span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Feeder:</span><span className="font-bold">{settings.feederName}</span></div>
                                <div className="flex justify-between"><span className={isDark ? 'text-slate-400' : 'text-slate-600'}>CT Ratio:</span><span className="font-mono">{settings.ctRatio}/1 ({settings.ctClass})</span></div>
                                <div className="flex justify-between"><span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Pickup:</span><span className="font-mono">{settings.pickupCurrent}A / TMS {settings.tms}</span></div>
                                <div className="flex justify-between"><span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Fault Level:</span><span className="font-mono">{settings.boltedFault} kA (equip: {settings.burstRating} kA)</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
