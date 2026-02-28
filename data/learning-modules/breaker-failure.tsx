import { MathBlock, StandardRef, ProTip, Hazard } from '../../components/TheoryComponents';
import { TheoryFlowDiagram, TheoryTimeline } from '../../components/TheoryDiagrams';
import { ShieldCheck, Activity, AlertTriangle, BookOpen, Timer, Clock, Settings } from 'lucide-react';

export const BREAKER_FAILURE_THEORY_CONTENT = [
    {
        id: 'fundamentals',
        title: "1. Breaker Failure Protection (50BF)",
        subtitle: "The Backup When the Breaker Refuses to Open",
        icon: ShieldCheck,
        content: (
            <>
                <p>Breaker Failure (BF) protection is the <strong>ultimate safety net</strong>. When a protection relay issues a trip command and the designated breaker fails to open (mechanical failure, stuck contacts, DC supply loss), the BF scheme trips <em>adjacent breakers</em> to clear the fault.</p>
                <MathBlock
                    formula="T_{BF} = T_{breaker\\_open} + T_{arc\\_extinction} + T_{margin}"
                    legend={[["T_{BF}", "Breaker failure timer setting (typically 150-300ms)"], ["T_{breaker\\_open}", "Expected breaker operating time (~50-80ms)"], ["T_{margin}", "Safety margin (~50ms)"]]}
                />
                <TheoryTimeline title="Breaker Failure Sequence" events={[
                    { time: 't=0', label: 'Protection Trips', detail: 'Relay issues TRIP to Circuit Breaker', color: '#3b82f6' },
                    { time: 't=80ms', label: 'Expected CB Open', detail: 'Breaker should open (5 cycles)', color: '#10b981' },
                    { time: 't=80ms', label: 'CB FAILS!', detail: 'Current still flowing — breaker stuck', color: '#ef4444' },
                    { time: 't=80ms', label: 'BF Timer Starts', detail: '50BF timer initiated by current detector', color: '#f59e0b' },
                    { time: 't=250ms', label: 'BF TRIP', detail: 'All adjacent breakers tripped', color: '#ef4444' },
                ]} />
                <Hazard><strong>Critical:</strong> If the BF timer is set too long, the fault persists causing equipment damage and instability. If too short, it may trip during normal breaker operation. Typical range: <strong>150-300ms</strong>.</Hazard>
            </>
        )
    },
    {
        id: 'detection',
        title: "2. Current Detection Methods",
        subtitle: "How the BF Relay Knows the Breaker Failed",
        icon: Activity,
        content: (
            <>
                <p>The BF scheme needs to confirm that current is <strong>still flowing</strong> after the trip command. This uses a current detector (typically set at 10-20% of CT rated current).</p>
                <TheoryFlowDiagram title="50BF Logic" blocks={[
                    { id: 'trip', label: 'Trip Command', sub: 'From any relay', color: '#3b82f6' },
                    { id: 'bft', label: 'BF Timer', sub: 'Start counting', color: '#f59e0b' },
                    { id: 'det', label: 'Current Detector', sub: 'I > 10% In?', color: '#8b5cf6' },
                    { id: 'bf', label: 'BF TRIP', sub: 'Trip backup CBs', color: '#ef4444' },
                ]} arrows={[
                    { from: 'trip', to: 'bft', label: 'Initiate' },
                    { from: 'bft', to: 'det', label: 'Timer expires' },
                    { from: 'det', to: 'bf', label: 'I still flowing' },
                ]} />
            </>
        )
    },
    {
        id: 'standards',
        title: "3. Standards & References",
        icon: BookOpen,
        content: (
            <>
                <StandardRef code="IEEE C37.119" title="Guide for Breaker Failure Protection of Power Circuit Breakers" />
                <StandardRef code="IEC 62271-100" title="High-Voltage Switchgear and Controlgear" />
                <StandardRef code="IEEE C37.04" title="Rating Structure for AC High-Voltage Circuit Breakers" />
            </>
        )
    }
];
