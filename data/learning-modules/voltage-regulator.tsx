import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, BookOpen, Sliders, TrendingUp, Zap } from 'lucide-react';

export const VOLTAGE_REGULATOR_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Voltage Regulation",
        subtitle: "Why Voltage Must Be Controlled (ANSI 90/27/59)",
        icon: ShieldCheck,
        content: (
            <>
                <p>Voltage regulation maintains the bus voltage within acceptable limits (typically ±5% of nominal per ANSI C84.1) despite changing load and generation conditions. Without voltage regulation, voltages sag under heavy load and swell under light load.</p>
                <MathBlock formula="V_{reg}(\\%) = \\frac{V_{no\\_load} - V_{full\\_load}}{V_{full\\_load}} \\times 100" legend={[["V_{reg}", "Voltage regulation percentage"]]} />
                <Hazard><strong>Under-voltage (27):</strong> Motors stall, contactors drop out, equipment malfunctions. <strong>Over-voltage (59):</strong> Insulation stress, equipment damage, safety hazard.</Hazard>
            </>
        )
    },
    {
        id: 'avr',
        title: "2. AVR & Tap Changer Control",
        subtitle: "How Voltage is Actually Controlled",
        icon: Sliders,
        content: (
            <>
                <p><strong>Automatic Voltage Regulator (AVR)</strong> controls generator excitation to maintain terminal voltage. <strong>On-Load Tap Changer (OLTC)</strong> adjusts transformer turns ratio under load — typically ±10% in 1.25% steps (17 positions).</p>
                <TheoryFlowDiagram title="Voltage Control Hierarchy" blocks={[
                    { id: 'meas', label: 'Measure Bus V', sub: 'Via VT', color: '#3b82f6' },
                    { id: 'comp', label: 'Compare to Setpoint', sub: 'V_set ± deadband', color: '#64748b' },
                    { id: 'delay', label: 'Time Delay', sub: '30-60 seconds', color: '#f59e0b' },
                    { id: 'act', label: 'Tap Up / Down', sub: 'One step per command', color: '#10b981' },
                ]} arrows={[
                    { from: 'meas', to: 'comp' }, { from: 'comp', to: 'delay', label: 'Error > DB' }, { from: 'delay', to: 'act', label: 'Timer expires' },
                ]} />
                <ProTip><strong>Coordination:</strong> When multiple OLTCs operate in series (e.g., transmission-distribution), their delays must be staggered. The upstream OLTC should have a longer delay (e.g., 60s) than the downstream (30s) to avoid hunting.</ProTip>
            </>
        )
    },
    {
        id: 'standards',
        title: "3. Standards & References",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="ANSI C84.1" title="Voltage Ranges for Service Voltage" />
                <StandardRef code="IEEE C57.15" title="Standard for Step-Voltage Regulators" />
                <StandardRef code="IEC 60076-21" title="Tap Changers for On-Load Use" />
                <StandardRef code="IEEE C37.99" title="Guide for Protection of Shunt Capacitor Banks (Voltage Related)" />
            </>
        )
    }
];
