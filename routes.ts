import { lazy } from 'react';
import {
    Activity, Zap, Layers, BookOpen, LayoutDashboard, Sun, Moon, Target,
    ClipboardCheck, Network, AlertTriangle, Calculator, Server, PieChart,
    Radar, Smartphone, FileSearch, Globe, GraduationCap, GitMerge,
    FastForward, Cpu, ChevronDown, Waves, Microscope, ShieldCheck, Wrench,
    RefreshCw, Gauge, Timer, TrendingUp, Settings, Search, X, Trophy,
    Flame, User
} from 'lucide-react';

// ─── STATIC PAGES (Eagerly Loaded or Top-level) ───
export const STATIC_ROUTES = [
    { path: '/', component: lazy(() => import('./pages/Dashboard')) },
    { path: '/profile', component: lazy(() => import('./pages/Profile')) },
    { path: '/privacy', component: lazy(() => import('./pages/PrivacyPolicy')) },
    { path: '/terms', component: lazy(() => import('./pages/TermsOfService')) },
    { path: '/contact', component: lazy(() => import('./pages/Contact')) },
    { path: '/disclaimer', component: lazy(() => import('./pages/Disclaimer')) },
    { path: '/cookies', component: lazy(() => import('./pages/CookiePolicy')) },
    { path: '/about', component: lazy(() => import('./pages/AboutUs')) },
];

export interface RouteItem {
    id: string; // unique short ID (used for file import matching if needed)
    name: string;
    path: string;
    icon: any;
    component: any;
}

export interface RouteGroup {
    id: string;
    label: string;
    color: string;
    dotColor: string;
    items: RouteItem[];
}

// ─── SIMULATOR & ACADEMY ROUTES (Grouped for Sidebar & Router) ───
export const ROUTE_GROUPS: RouteGroup[] = [
    {
        id: 'fundamentals',
        label: 'Fundamentals',
        color: 'text-blue-400',
        dotColor: 'bg-blue-500',
        items: [
            { id: 'vectors', name: 'Phasor Lab', path: '/vectors', icon: Waves, component: lazy(() => import('./pages/VectorLab')) },
            { id: 'twin', name: 'Digital Twin', path: '/twin', icon: Server, component: lazy(() => import('./pages/DigitalTwin')) },
        ],
    },
    {
        id: 'protection',
        label: 'Protection & Relay',
        color: 'text-emerald-400',
        dotColor: 'bg-emerald-500',
        items: [
            { id: 'tcc', name: 'TCC Studio', path: '/tcc', icon: Activity, component: lazy(() => import('./pages/TCCStudio')) },
            { id: 'distance', name: 'Distance Lab', path: '/distance', icon: Radar, component: lazy(() => import('./pages/DistanceLab')) },
            { id: 'diffslope', name: 'Diff Slope', path: '/diffslope', icon: GitMerge, component: lazy(() => import('./pages/DiffSlope')) },
            { id: 'symcomp', name: 'SymComp Lab', path: '/symcomp', icon: PieChart, component: lazy(() => import('./pages/SymComponents')) },
            { id: 'tester', name: 'Relay Tester', path: '/tester', icon: ClipboardCheck, component: lazy(() => import('./pages/RelayTester')) },
            { id: 'overcurrent', name: 'Overcurrent (50/51)', path: '/overcurrent', icon: Activity, component: lazy(() => import('./pages/OvercurrentSim')) },
            { id: 'line-diff', name: 'Line Diff (87L)', path: '/line-diff', icon: GitMerge, component: lazy(() => import('./pages/LineDiffSim')) },
            { id: 'impedance-tester', name: 'Impedance (21)', path: '/impedance-tester', icon: Radar, component: lazy(() => import('./pages/ImpedanceTester')) },
            { id: 'logic', name: 'Logic Sandbox', path: '/logic', icon: Cpu, component: lazy(() => import('./pages/LogicSandbox')) },
            { id: 'autorecloser', name: 'Autorecloser (79)', path: '/autorecloser', icon: RefreshCw, component: lazy(() => import('./pages/AutorecloserSim')) },
            { id: 'synchrocheck', name: 'Synchrocheck (25)', path: '/synchrocheck', icon: Gauge, component: lazy(() => import('./pages/SynchrocheckSim')) },
            { id: 'transformer-protection', name: 'Transformer (87T)', path: '/transformer-protection', icon: Zap, component: lazy(() => import('./pages/TransformerProtection')) },
            { id: 'frequency-protection', name: 'Frequency (81)', path: '/frequency-protection', icon: Activity, component: lazy(() => import('./pages/FrequencyProtection')) },
            { id: 'power-swing', name: 'Power Swing (78)', path: '/power-swing', icon: Waves, component: lazy(() => import('./pages/PowerSwingSim')) },
            { id: 'ground-fault', name: 'Ground Fault', path: '/ground-fault', icon: AlertTriangle, component: lazy(() => import('./pages/GroundFaultSim')) },
            { id: 'breaker-failure', name: 'Breaker Failure (50BF)', path: '/breaker-failure', icon: Timer, component: lazy(() => import('./pages/BreakerFailure')) },
            { id: 'busbar-protection', name: 'Busbar (87B)', path: '/busbar-protection', icon: Layers, component: lazy(() => import('./pages/BusbarProtection')) },
            { id: 'generator-protection', name: 'Generator Suite', path: '/generator-protection', icon: Zap, component: lazy(() => import('./pages/GeneratorProtection')) },
            { id: 'settings-audit', name: 'Settings Audit', path: '/settings-audit', icon: ClipboardCheck, component: lazy(() => import('./pages/SettingsAudit')) },
        ],
    },
    {
        id: 'studies',
        label: 'System Studies',
        color: 'text-purple-400',
        dotColor: 'bg-purple-500',
        items: [
            { id: 'builder', name: 'SLD Builder', path: '/builder', icon: Network, component: lazy(() => import('./pages/SubstationBuilder')) },
            { id: 'fbts', name: 'Fast Bus (FBTS)', path: '/fbts', icon: FastForward, component: lazy(() => import('./pages/FastBusTransfer')) },
            { id: 'sc-calc', name: 'SC Calculator', path: '/sc-calc', icon: Calculator, component: lazy(() => import('./pages/SCCalculator')) },
            { id: 'standards', name: 'Standards Index', path: '/standards', icon: BookOpen, component: lazy(() => import('./pages/StandardsRef')) },
            { id: 'tools', name: 'Engineer Toolkit', path: '/tools', icon: Wrench, component: lazy(() => import('./pages/EngineerToolkit')) },
            { id: 'ct-vt', name: 'CT/VT Calculator', path: '/ct-vt', icon: Settings, component: lazy(() => import('./pages/CTVTCalculator')) },
            { id: 'per-unit', name: 'Per-Unit Calculator', path: '/per-unit', icon: Calculator, component: lazy(() => import('./pages/PerUnitCalc')) },
            { id: 'motor-protection', name: 'Motor Protection', path: '/motor-protection', icon: Cpu, component: lazy(() => import('./pages/MotorProtection')) },
            { id: 'voltage-regulator', name: 'Voltage Regulator', path: '/voltage-regulator', icon: TrendingUp, component: lazy(() => import('./pages/VoltageRegulator')) },
            { id: 'arc-flash', name: 'Arc Flash (1584)', path: '/arc-flash', icon: Flame, component: lazy(() => import('./pages/ArcFlashCalculator')) },
        ],
    },
    {
        id: 'forensic',
        label: 'Digital & Forensic',
        color: 'text-amber-400',
        dotColor: 'bg-amber-500',
        items: [
            { id: 'comms', name: 'Comms Hub', path: '/comms', icon: Network, component: lazy(() => import('./pages/CommsHub')) },
            { id: 'forensic', name: 'Forensic Lab', path: '/forensic', icon: Microscope, component: lazy(() => import('./pages/ForensicLab')) },
            { id: 'events', name: 'Event Analyzer', path: '/events', icon: Smartphone, component: lazy(() => import('./pages/EventAnalyzer')) },
            { id: 'failure', name: 'Failure Lab', path: '/failure', icon: AlertTriangle, component: lazy(() => import('./pages/FailureLab')) },
            { id: 'cases', name: 'Case Studies', path: '/cases', icon: BookOpen, component: lazy(() => import('./pages/CaseStudies')) },
            { id: 'digital-substation', name: 'Digital Substation', path: '/digital-substation', icon: Server, component: lazy(() => import('./pages/DigitalSubstation')) },
        ],
    },
    {
        id: 'learning',
        label: 'Learning Hub',
        color: 'text-cyan-400',
        dotColor: 'bg-cyan-500',
        items: [
            { id: 'academy', name: 'Academy', path: '/academy', icon: GraduationCap, component: lazy(() => import('./pages/Academy')) },
            { id: 'flashcards', name: 'Flashcards', path: '/flashcards', icon: BookOpen, component: lazy(() => import('./pages/Flashcards')) },
            { id: 'knowledge', name: 'Knowledge Base', path: '/knowledge', icon: BookOpen, component: lazy(() => import('./pages/KnowledgeEngine')) },
            { id: 'ansi-reference', name: 'ANSI & IS Reference', path: '/ansi-reference', icon: BookOpen, component: lazy(() => import('./pages/ANSIReference')) },
            { id: 'challenges', name: 'Challenges', path: '/challenges', icon: Target, component: lazy(() => import('./pages/Challenges')) },
            { id: 'mistakes', name: 'Mistake Learning', path: '/mistakes', icon: AlertTriangle, component: lazy(() => import('./pages/MistakeLearning')) },
            { id: 'trends', name: 'Smart Grid 2025', path: '/trends', icon: Globe, component: lazy(() => import('./pages/SmartGridTrends')) },
            { id: 'calculators', name: 'Calculators', path: '/calculators', icon: Calculator, component: lazy(() => import('./pages/Calculators')) },
        ],
    },
];

// Helper to get all application routes flattened
export const GET_ALL_APP_ROUTES = () => {
    return ROUTE_GROUPS.flatMap(group => group.items);
};
