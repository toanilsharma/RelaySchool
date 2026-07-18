import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import Disclaimer from './pages/Disclaimer';
import CookiePolicy from './pages/CookiePolicy';
import AboutUs from './pages/AboutUs';
import VectorLab from './pages/VectorLab';
import DigitalTwin from './pages/DigitalTwin';
import TCCStudio from './pages/TCCStudio';
import DistanceLab from './pages/DistanceLab';
import DiffSlope from './pages/DiffSlope';
import SymComponents from './pages/SymComponents';
import RelayTester from './pages/RelayTester';
import OvercurrentSim from './pages/OvercurrentSim';
import LineDiffSim from './pages/LineDiffSim';
import ImpedanceTester from './pages/ImpedanceTester';
import LogicSandbox from './pages/LogicSandbox';
import AutorecloserSim from './pages/AutorecloserSim';
import SynchrocheckSim from './pages/SynchrocheckSim';
import TransformerProtection from './pages/TransformerProtection';
import FrequencyProtection from './pages/FrequencyProtection';
import PowerSwingSim from './pages/PowerSwingSim';
import GroundFaultSim from './pages/GroundFaultSim';
import BreakerFailure from './pages/BreakerFailure';
import BusbarProtection from './pages/BusbarProtection';
import GeneratorProtection from './pages/GeneratorProtection';
import SettingsAudit from './pages/SettingsAudit';
import SubstationBuilder from './pages/SubstationBuilder';
import FastBusTransfer from './pages/FastBusTransfer';
import SCCalculator from './pages/SCCalculator';
import StandardsRef from './pages/StandardsRef';
import EngineerToolkit from './pages/EngineerToolkit';
import CTVTCalculator from './pages/CTVTCalculator';
import PerUnitCalc from './pages/PerUnitCalc';
import MotorProtection from './pages/MotorProtection';
import VoltageRegulator from './pages/VoltageRegulator';
import ArcFlashCalculator from './pages/ArcFlashCalculator';
import CommsHub from './pages/CommsHub';
import ForensicLab from './pages/ForensicLab';
import EventAnalyzer from './pages/EventAnalyzer';
import FailureLab from './pages/FailureLab';
import CaseStudies from './pages/CaseStudies';
import DigitalSubstation from './pages/DigitalSubstation';
import Academy from './pages/Academy';
import Flashcards from './pages/Flashcards';
import KnowledgeEngine from './pages/KnowledgeEngine';
import ANSIReference from './pages/ANSIReference';
import Challenges from './pages/Challenges';
import MistakeLearning from './pages/MistakeLearning';
import SmartGridTrends from './pages/SmartGridTrends';
import Calculators from './pages/Calculators';

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
    { path: '/', component: Dashboard },
    { path: '/profile', component: Profile },
    { path: '/privacy', component: PrivacyPolicy },
    { path: '/terms', component: TermsOfService },
    { path: '/contact', component: Contact },
    { path: '/disclaimer', component: Disclaimer },
    { path: '/cookies', component: CookiePolicy },
    { path: '/about', component: AboutUs },
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
            { id: 'vectors', name: 'Phasor Lab', path: '/vectors', icon: Waves, component: VectorLab },
            { id: 'twin', name: 'Digital Twin', path: '/twin', icon: Server, component: DigitalTwin },
        ],
    },
    {
        id: 'protection',
        label: 'Protection & Relay',
        color: 'text-emerald-400',
        dotColor: 'bg-emerald-500',
        items: [
            { id: 'tcc', name: 'TCC Studio', path: '/tcc', icon: Activity, component: TCCStudio },
            { id: 'distance', name: 'Distance Lab', path: '/distance', icon: Radar, component: DistanceLab },
            { id: 'diffslope', name: 'Diff Slope', path: '/diffslope', icon: GitMerge, component: DiffSlope },
            { id: 'symcomp', name: 'SymComp Lab', path: '/symcomp', icon: PieChart, component: SymComponents },
            { id: 'tester', name: 'Relay Tester', path: '/tester', icon: ClipboardCheck, component: RelayTester },
            { id: 'overcurrent', name: 'Overcurrent (50/51)', path: '/overcurrent', icon: Activity, component: OvercurrentSim },
            { id: 'line-diff', name: 'Line Diff (87L)', path: '/line-diff', icon: GitMerge, component: LineDiffSim },
            { id: 'impedance-tester', name: 'Impedance (21)', path: '/impedance-tester', icon: Radar, component: ImpedanceTester },
            { id: 'logic', name: 'Logic Sandbox', path: '/logic', icon: Cpu, component: LogicSandbox },
            { id: 'autorecloser', name: 'Autorecloser (79)', path: '/autorecloser', icon: RefreshCw, component: AutorecloserSim },
            { id: 'synchrocheck', name: 'Synchrocheck (25)', path: '/synchrocheck', icon: Gauge, component: SynchrocheckSim },
            { id: 'transformer-protection', name: 'Transformer (87T)', path: '/transformer-protection', icon: Zap, component: TransformerProtection },
            { id: 'frequency-protection', name: 'Frequency (81)', path: '/frequency-protection', icon: Activity, component: FrequencyProtection },
            { id: 'power-swing', name: 'Power Swing (78)', path: '/power-swing', icon: Waves, component: PowerSwingSim },
            { id: 'ground-fault', name: 'Ground Fault', path: '/ground-fault', icon: AlertTriangle, component: GroundFaultSim },
            { id: 'breaker-failure', name: 'Breaker Failure (50BF)', path: '/breaker-failure', icon: Timer, component: BreakerFailure },
            { id: 'busbar-protection', name: 'Busbar (87B)', path: '/busbar-protection', icon: Layers, component: BusbarProtection },
            { id: 'generator-protection', name: 'Generator Suite', path: '/generator-protection', icon: Zap, component: GeneratorProtection },
            { id: 'settings-audit', name: 'Settings Audit', path: '/settings-audit', icon: ClipboardCheck, component: SettingsAudit },
        ],
    },
    {
        id: 'studies',
        label: 'System Studies',
        color: 'text-purple-400',
        dotColor: 'bg-purple-500',
        items: [
            { id: 'builder', name: 'SLD Builder', path: '/builder', icon: Network, component: SubstationBuilder },
            { id: 'fbts', name: 'Fast Bus (FBTS)', path: '/fbts', icon: FastForward, component: FastBusTransfer },
            { id: 'sc-calc', name: 'SC Calculator', path: '/sc-calc', icon: Calculator, component: SCCalculator },
            { id: 'standards', name: 'Standards Index', path: '/standards', icon: BookOpen, component: StandardsRef },
            { id: 'tools', name: 'Engineer Toolkit', path: '/tools', icon: Wrench, component: EngineerToolkit },
            { id: 'ct-vt', name: 'CT/VT Calculator', path: '/ct-vt', icon: Settings, component: CTVTCalculator },
            { id: 'per-unit', name: 'Per-Unit Calculator', path: '/per-unit', icon: Calculator, component: PerUnitCalc },
            { id: 'motor-protection', name: 'Motor Protection', path: '/motor-protection', icon: Cpu, component: MotorProtection },
            { id: 'voltage-regulator', name: 'Voltage Regulator', path: '/voltage-regulator', icon: TrendingUp, component: VoltageRegulator },
            { id: 'arc-flash', name: 'Arc Flash (1584)', path: '/arc-flash', icon: Flame, component: ArcFlashCalculator },
        ],
    },
    {
        id: 'forensic',
        label: 'Digital & Forensic',
        color: 'text-amber-400',
        dotColor: 'bg-amber-500',
        items: [
            { id: 'comms', name: 'Comms Hub', path: '/comms', icon: Network, component: CommsHub },
            { id: 'forensic', name: 'Forensic Lab', path: '/forensic', icon: Microscope, component: ForensicLab },
            { id: 'events', name: 'Event Analyzer', path: '/events', icon: Smartphone, component: EventAnalyzer },
            { id: 'failure', name: 'Failure Lab', path: '/failure', icon: AlertTriangle, component: FailureLab },
            { id: 'cases', name: 'Case Studies', path: '/cases', icon: BookOpen, component: CaseStudies },
            { id: 'digital-substation', name: 'Digital Substation', path: '/digital-substation', icon: Server, component: DigitalSubstation },
        ],
    },
    {
        id: 'learning',
        label: 'Learning Hub',
        color: 'text-cyan-400',
        dotColor: 'bg-cyan-500',
        items: [
            { id: 'academy', name: 'Academy', path: '/academy', icon: GraduationCap, component: Academy },
            { id: 'flashcards', name: 'Flashcards', path: '/flashcards', icon: BookOpen, component: Flashcards },
            { id: 'knowledge', name: 'Knowledge Base', path: '/knowledge', icon: BookOpen, component: KnowledgeEngine },
            { id: 'ansi-reference', name: 'ANSI & IS Reference', path: '/ansi-reference', icon: BookOpen, component: ANSIReference },
            { id: 'challenges', name: 'Challenges', path: '/challenges', icon: Target, component: Challenges },
            { id: 'mistakes', name: 'Mistake Learning', path: '/mistakes', icon: AlertTriangle, component: MistakeLearning },
            { id: 'trends', name: 'Smart Grid 2025', path: '/trends', icon: Globe, component: SmartGridTrends },
            { id: 'calculators', name: 'Calculators', path: '/calculators', icon: Calculator, component: Calculators },
        ],
    },
];

// Helper to get all application routes flattened
export const GET_ALL_APP_ROUTES = () => {
    return ROUTE_GROUPS.flatMap(group => group.items);
};
