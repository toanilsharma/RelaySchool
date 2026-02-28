import { MathBlock, InlineMath, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryLineChart, TheoryFlowDiagram, TheoryTimeline } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, Sliders, AlertTriangle, BookOpen, Cpu, Settings, Zap, Timer, TrendingUp } from 'lucide-react';

export const MOTOR_PROTECTION_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Motor Protection Overview",
        subtitle: "Why Motors Need Comprehensive Protection (ANSI 49/50/51/66)",
        icon: ShieldCheck,
        content: (
            <>
                <p>Electric motors are the workhorses of industry — and also the most vulnerable equipment. They face <strong>thermal, electrical, and mechanical</strong> stresses that require multiple layers of protection working together.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="p-5 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-2">Thermal (49)</h4>
                        <p className="text-xs text-slate-500">Overload, locked rotor, blocked cooling. Uses thermal replica model.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Short Circuit (50/51)</h4>
                        <p className="text-xs text-slate-500">Phase-to-phase, phase-to-ground. Instant and time-OC elements.</p>
                    </div>
                    <div className="p-5 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-2">Starts/Hour (66)</h4>
                        <p className="text-xs text-slate-500">Limits re-starts to prevent excessive thermal stress on rotor bars.</p>
                    </div>
                </div>
                <MathBlock
                    formula="\\theta(t) = \\theta_{amb} + (\\theta_{max} - \\theta_{amb}) \\times \\left(1 - e^{-t/\\tau}\\right) \\times \\left(\\frac{I}{I_{FLA}}\\right)^2"
                    legend={[["\\theta(t)", "Temperature at time t"], ["\\tau", "Motor thermal time constant (minutes)"], ["I/I_{FLA}", "Current as multiple of full-load amps"]]}
                />
            </>
        )
    },
    {
        id: 'thermal',
        title: "2. Thermal Replica Model",
        subtitle: "Heating & Cooling Curves",
        icon: TrendingUp,
        content: (
            <>
                <p>The thermal replica tracks the motor's estimated temperature based on measured current. It models both <strong>heating</strong> (motor running above rated current) and <strong>cooling</strong> (motor at rest or below rated).</p>
                <TheoryLineChart
                    title="Motor Heating Curve: Current vs. Safe Running Time"
                    data={[
                        { I: 1.0, time: 999 },
                        { I: 1.1, time: 120 },
                        { I: 1.3, time: 30 },
                        { I: 1.5, time: 12 },
                        { I: 2.0, time: 4 },
                        { I: 3.0, time: 1.5 },
                        { I: 5.0, time: 0.5 },
                        { I: 6.0, time: 0.2 },
                    ]}
                    xKey="I" yKeys={[{ key: 'time', name: 'Safe Time (minutes)', color: '#ef4444' }]}
                    xAxisLabel="Current (× FLA)" yAxisLabel="Time (minutes)" height={300}
                />
                <ProTip><strong>Cold vs Hot Start:</strong> A motor that has been running at load has less thermal margin than a cold motor. Modern relays track this using the thermal replica memory — the accumulated heat from previous operations reduces the available starting time.</ProTip>
            </>
        )
    },
    {
        id: 'locked-rotor',
        title: "3. Locked Rotor & Stall Protection (14)",
        subtitle: "The Most Dangerous Condition",
        icon: AlertTriangle,
        content: (
            <>
                <p>A locked rotor draws <strong>5-8× FLA</strong> continuously. Without rotation, there's no cooling airflow. The motor overheats in seconds. The safe stall time (rotor thermal limit) is typically <strong>10-20 seconds hot, 20-40 seconds cold</strong>.</p>
                <Hazard><strong>Critical:</strong> The locked-rotor protection (14) time must be set <strong>below</strong> the motor's safe stall time. If the motor doesn't accelerate to {'>'} 80% speed within the allowed start time, the relay must trip.</Hazard>
            </>
        )
    },
    {
        id: 'standards',
        title: "4. Standards & References",
        subtitle: "Governing Documents",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C37.96" title="Guide for AC Motor Protection" />
                <StandardRef code="IEC 60034-1" title="Rotating Electrical Machines — Rating and Performance" />
                <StandardRef code="NEMA MG-1" title="Motors and Generators (Service Factor, Insulation Class)" />
                <StandardRef code="IEEE 3004.8" title="Motor Protection in Industrial and Commercial Power Systems" />
            </>
        )
    }
];
