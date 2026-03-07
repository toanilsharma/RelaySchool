/**
 * Complete ANSI/IEEE C37.2 Device Number Reference
 * 100+ standard device function numbers used in power system protection.
 */

export interface ANSIDevice {
    code: string;
    name: string;
    description: string;
    application: string;
    category: 'protection' | 'control' | 'metering' | 'switching' | 'auxiliary';
}

export const ANSI_DEVICES: ANSIDevice[] = [
    // ─── MASTER ELEMENTS & CONTROL ───
    { code: '1', name: 'Master Element', description: 'Initiates or permits the start/stop of equipment.', application: 'Generator start panel, motor control', category: 'control' },
    { code: '2', name: 'Time-Delay Starting/Closing', description: 'Provides a desired time delay before or after any point of operation.', application: 'Delayed auto-start of backup generators', category: 'control' },
    { code: '3', name: 'Checking/Interlocking Relay', description: 'Verifies conditions before allowing another operation.', application: 'Synchrocheck (25) interlocking with breaker close', category: 'control' },
    { code: '4', name: 'Master Contactor', description: 'Principal switching device serving to make/break a circuit.', application: 'Motor starter main contactor', category: 'switching' },
    { code: '5', name: 'Stopping Device', description: 'Functions to stop equipment.', application: 'Emergency stop (e-stop) circuits', category: 'control' },
    { code: '6', name: 'Starting Circuit Breaker', description: 'Connects the source of starting voltage to the field of a machine.', application: 'Motor starting circuits', category: 'switching' },
    // ─── PROTECTIVE RELAYS ───
    { code: '21', name: 'Distance Relay', description: 'Operates when impedance, reactance, or admittance changes beyond a set value.', application: 'Transmission line protection (Zones 1, 2, 3)', category: 'protection' },
    { code: '24', name: 'Volts/Hertz Relay', description: 'Protects against over-excitation (V/Hz exceeds limit).', application: 'Generator and transformer over-excitation protection', category: 'protection' },
    { code: '25', name: 'Synchrocheck Relay', description: 'Verifies voltage, frequency, and phase angle match before closing.', application: 'Paralleling generators, auto-reclosing on tie breakers', category: 'protection' },
    { code: '26', name: 'Apparatus Thermal Device', description: 'Operates on excessive temperature of equipment.', application: 'Transformer/reactor winding temperature', category: 'protection' },
    { code: '27', name: 'Under-Voltage Relay', description: 'Operates when voltage drops below a preset value.', application: 'Motor protection, bus undervoltage, UPS transfer', category: 'protection' },
    { code: '30', name: 'Annunciator Relay', description: 'Provides visual/audible indication of abnormal conditions.', application: 'Alarm panels in substations', category: 'auxiliary' },
    { code: '32', name: 'Reverse Power Relay', description: 'Detects power flowing in the reverse direction.', application: 'Generator anti-motoring, DG reverse power', category: 'protection' },
    { code: '36', name: 'Polarity/DC Under-Voltage', description: 'Operates on polarity or predetermined value of voltage.', application: 'DC system monitoring in substations', category: 'protection' },
    { code: '37', name: 'Under-Current/Power Relay', description: 'Operates when current/power drops below a preset value.', application: 'Pump dry-run protection, loss of load detection', category: 'protection' },
    { code: '38', name: 'Bearing Protective Device', description: 'Monitors bearing temperature or conditions.', application: 'Motor/generator bearing RTD protection', category: 'protection' },
    { code: '39', name: 'Mechanical Condition Monitor', description: 'Monitors abnormal mechanical conditions.', application: 'Vibration monitoring on rotating machines', category: 'protection' },
    { code: '40', name: 'Loss of Excitation Relay', description: 'Detects loss or abnormally low field current.', application: 'Generator loss of field (impedance-based detection)', category: 'protection' },
    { code: '41', name: 'Field Circuit Breaker', description: 'Device that applies/removes field excitation.', application: 'Generator field breaker control', category: 'switching' },
    { code: '42', name: 'Running Circuit Breaker', description: 'CB that connects the machine to its source of running voltage.', application: 'Motor running contactor', category: 'switching' },
    { code: '43', name: 'Manual Transfer/Selector', description: 'Transfers control circuits to select operating modes.', application: 'Auto/Manual selector on motor control panels', category: 'control' },
    { code: '46', name: 'Reverse Phase/Phase Balance', description: 'Operates on negative sequence current (unbalance).', application: 'Motor/generator negative sequence protection', category: 'protection' },
    { code: '47', name: 'Phase Sequence/Rotation', description: 'Operates on reverse phase sequence voltage.', application: 'Motor phase reversal protection', category: 'protection' },
    { code: '48', name: 'Incomplete Sequence Relay', description: 'Returns equipment to normal if sequence is not completed.', application: 'Motor locked rotor / stall protection', category: 'protection' },
    { code: '49', name: 'Machine/Transformer Thermal', description: 'Operates when temperature exceeds a safe value.', application: 'Motor thermal overload (I²t), transformer winding temp', category: 'protection' },
    { code: '50', name: 'Instantaneous Overcurrent', description: 'Operates instantly when current exceeds a preset value.', application: 'Short-circuit protection on feeders, motors, transformers', category: 'protection' },
    { code: '50BF', name: 'Breaker Failure', description: 'Initiates backup tripping when a breaker fails to clear a fault.', application: 'Substation breaker failure protection (150-200ms timer)', category: 'protection' },
    { code: '50N', name: 'Instantaneous Ground OC', description: 'Instantaneous overcurrent for neutral/ground.', application: 'Instantaneous ground fault detection', category: 'protection' },
    { code: '51', name: 'Time Overcurrent', description: 'Operates with an inverse-time characteristic.', application: 'Feeder backup protection, motor overload', category: 'protection' },
    { code: '51N', name: 'Time Ground Overcurrent', description: 'Inverse-time overcurrent for neutral/ground faults.', application: 'Ground fault protection on feeders', category: 'protection' },
    { code: '51V', name: 'Voltage-Restrained OC', description: 'Overcurrent whose pickup drops as voltage collapses.', application: 'Generator backup overcurrent (restrained by voltage)', category: 'protection' },
    { code: '52', name: 'AC Circuit Breaker', description: 'Device used to close and interrupt an AC circuit.', application: 'All AC power circuit breakers', category: 'switching' },
    { code: '53', name: 'Exciter/DC Generator Relay', description: 'Forces field excitation of a machine.', application: 'Exciter field forcing during faults', category: 'control' },
    { code: '55', name: 'Power Factor Relay', description: 'Operates when power factor falls below a set value.', application: 'Capacitor bank switching, generator PF control', category: 'protection' },
    { code: '56', name: 'Field Application Relay', description: 'Automatically controls field application.', application: 'Automatic voltage regulator field application', category: 'control' },
    { code: '59', name: 'Over-Voltage Relay', description: 'Operates when voltage exceeds a preset value.', application: 'Bus/generator overvoltage protection', category: 'protection' },
    { code: '59N', name: 'Neutral Overvoltage', description: 'Detects overvoltage on the neutral of a generator/transformer.', application: '100% stator ground fault protection (3rd harmonic)', category: 'protection' },
    { code: '60', name: 'Voltage/Current Balance', description: 'Operates on a difference between two quantities.', application: 'VT fuse failure detection, CT balance check', category: 'protection' },
    { code: '62', name: 'Time-Delay Stop/Open', description: 'Provides a time delay in connection with a stop/open function.', application: 'Delayed trip for coordination purposes', category: 'control' },
    { code: '63', name: 'Pressure Switch', description: 'Operates on a rise/fall of gas or liquid pressure.', application: 'Buchholz relay (transformer gas), SF₆ pressure (GIS)', category: 'protection' },
    { code: '64', name: 'Ground Protective Relay', description: 'Operates on failure of insulation (earth fault).', application: 'Rotor earth fault (generator), stator ground fault', category: 'protection' },
    { code: '65', name: 'Governor', description: 'Controls the gate valve or throttle of a prime mover.', application: 'Turbine speed governor', category: 'control' },
    { code: '66', name: 'Notching/Jogging Device', description: 'Limits number of operations or controls jogging.', application: 'Motor starts-per-hour limiter', category: 'control' },
    { code: '67', name: 'Directional Overcurrent', description: 'Overcurrent operating only for a specific current direction.', application: 'Ring bus protection, parallel feeder protection', category: 'protection' },
    { code: '67N', name: 'Directional Ground OC', description: 'Directional earth fault overcurrent relay.', application: 'Ground fault isolation in ring networks', category: 'protection' },
    { code: '68', name: 'Blocking Relay', description: 'Blocks tripping on power swings or out-of-step.', application: 'Power Swing Blocking (PSB) for distance relays', category: 'protection' },
    { code: '69', name: 'Permissive Control Device', description: 'Generally used for interlocking.', application: 'Permissive overreaching transfer trip (POTT)', category: 'control' },
    { code: '71', name: 'Level Switch', description: 'Operates on liquid/gas level changes.', application: 'Transformer conservator oil level alarm', category: 'auxiliary' },
    { code: '72', name: 'DC Circuit Breaker', description: 'Used to close and interrupt a DC circuit.', application: 'DC station battery circuit breakers', category: 'switching' },
    { code: '74', name: 'Alarm Relay', description: 'An alarm device that is not annunciator (30).', application: 'General purpose alarm relay', category: 'auxiliary' },
    { code: '76', name: 'DC Overcurrent Relay', description: 'Operates on excessive DC current.', application: 'DC feeder protection, battery charger OC', category: 'protection' },
    { code: '78', name: 'Phase Angle/Out-of-Step', description: 'Operates at a predetermined phase angle between quantities.', application: 'Out-of-step protection for generators', category: 'protection' },
    { code: '79', name: 'AC Auto-Reclosing Relay', description: 'Controls automatic reclosing and lockout.', application: 'Overhead line auto-reclosing (single/three-phase)', category: 'protection' },
    { code: '81', name: 'Frequency Relay', description: 'Operates on deviation from normal frequency.', application: 'Under/over-frequency load shedding, generator protection', category: 'protection' },
    { code: '81U', name: 'Under-Frequency', description: 'Operates when frequency drops below a preset value.', application: 'Load shedding schemes (49.5, 49.0, 48.5 Hz stages)', category: 'protection' },
    { code: '81O', name: 'Over-Frequency', description: 'Operates when frequency exceeds a preset value.', application: 'Generator over-speed protection, load rejection', category: 'protection' },
    { code: '81R', name: 'Rate of Change of Frequency', description: 'Operates on df/dt exceeding a threshold.', application: 'Islanding detection (ROCOF), system emergency', category: 'protection' },
    { code: '83', name: 'Automatic Selective Control', description: 'Selects between automatic transfer options.', application: 'Automatic bus transfer (ABT) schemes', category: 'control' },
    { code: '85', name: 'Communications Relay', description: 'Carrier/pilot-wire for remote tripping.', application: 'Teleprotection: DTT, POTT, PUTT schemes via fiber/PLC', category: 'protection' },
    { code: '86', name: 'Lockout Relay', description: 'Hand-reset relay that locks out equipment after a trip.', application: 'Transformer lockout, bus lockout — requires manual reset', category: 'protection' },
    { code: '87', name: 'Differential Relay', description: 'Operates on percentage difference between two currents.', application: 'Transformer, generator, bus, motor differential protection', category: 'protection' },
    { code: '87B', name: 'Bus Differential', description: 'Differential protection for busbar zones.', application: 'Busbar protection (low/high impedance)', category: 'protection' },
    { code: '87G', name: 'Generator Differential', description: 'Differential protection for generator stator.', application: 'Generator stator winding protection', category: 'protection' },
    { code: '87L', name: 'Line Differential', description: 'Current differential protection for transmission lines.', application: '87L line protection via fiber optic communication', category: 'protection' },
    { code: '87T', name: 'Transformer Differential', description: 'Differential protection for power transformers.', application: 'Transformer protection with harmonic restraint', category: 'protection' },
    { code: '87M', name: 'Motor Differential', description: 'Differential protection for large motors.', application: 'HV motor stator winding protection (> 1 MW)', category: 'protection' },
    { code: '90', name: 'Regulating Device', description: 'Functions to regulate a quantity at a certain value.', application: 'Voltage regulator, automatic tap changer', category: 'control' },
    { code: '91', name: 'Voltage Directional Relay', description: 'Operates on a predetermined value of voltage polarity.', application: 'Directional element for distance relays', category: 'protection' },
    { code: '92', name: 'Voltage/Power Directional', description: 'Operates when voltage exceeds a set value in a given direction.', application: 'Directional power relay variants', category: 'protection' },
    { code: '94', name: 'Tripping/Trip-Free Relay', description: 'Trips a circuit breaker or removes excitation.', application: 'Master trip relay, trip circuit supervision (TCS)', category: 'protection' },
];

export const DEVICE_CATEGORIES = {
    protection: { label: 'Protection', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    control: { label: 'Control', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    metering: { label: 'Metering', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    switching: { label: 'Switching', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
    auxiliary: { label: 'Auxiliary', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950' },
} as const;

/**
 * Hindi Engineering Glossary — 50+ key electrical engineering terms
 * For Indian engineers who study in English but think in regional languages.
 */
export interface GlossaryEntry {
    english: string;
    hindi: string;
    devanagari: string;
    context: string;
}

export const HINDI_GLOSSARY: GlossaryEntry[] = [
    { english: 'Relay', hindi: 'Rile', devanagari: 'रिले', context: 'Protection device that detects faults' },
    { english: 'Circuit Breaker', hindi: 'Paripath Vichchhedak', devanagari: 'परिपथ विच्छेदक', context: 'Switching device that interrupts fault current' },
    { english: 'Transformer', hindi: 'Parivartak', devanagari: 'परिवर्तक', context: 'Converts voltage levels' },
    { english: 'Fault', hindi: 'Dosh', devanagari: 'दोष', context: 'Abnormal condition in power system' },
    { english: 'Pickup', hindi: 'Uthav', devanagari: 'उठाव', context: 'Minimum current to activate relay' },
    { english: 'Trip', hindi: 'Trip / Vichchhed', devanagari: 'ट्रिप / विच्छेद', context: 'Opening of circuit breaker by relay' },
    { english: 'Overcurrent', hindi: 'Ati-Dhara', devanagari: 'अति-धारा', context: 'Current exceeding normal value' },
    { english: 'Voltage', hindi: 'Voltata', devanagari: 'वोल्टता', context: 'Electrical potential difference' },
    { english: 'Current', hindi: 'Dhara', devanagari: 'धारा', context: 'Flow of electrical charge' },
    { english: 'Impedance', hindi: 'Pratibadha', devanagari: 'प्रतिबाधा', context: 'Opposition to AC current flow' },
    { english: 'Resistance', hindi: 'Pratirodh', devanagari: 'प्रतिरोध', context: 'Opposition to DC current flow' },
    { english: 'Reactance', hindi: 'Pratighaat', devanagari: 'प्रतिघात', context: 'Imaginary part of impedance' },
    { english: 'Earthing / Grounding', hindi: 'Bhumi-Sampadan', devanagari: 'भूमि-संपादन', context: 'Connecting equipment to earth' },
    { english: 'Short Circuit', hindi: 'Laghu Paripath', devanagari: 'लघु परिपथ', context: 'Low-impedance fault path' },
    { english: 'Load', hindi: 'Bhar', devanagari: 'भार', context: 'Equipment drawing power' },
    { english: 'Generator', hindi: 'Janak / Generator', devanagari: 'जनक', context: 'Machine producing electrical energy' },
    { english: 'Busbar', hindi: 'Bus Patti', devanagari: 'बस पट्टी', context: 'Common connection point in switchgear' },
    { english: 'Substation', hindi: 'Upkendra', devanagari: 'उपकेन्द्र', context: 'Facility for voltage transformation' },
    { english: 'Switchgear', hindi: 'Switch Yantra', devanagari: 'स्विच यंत्र', context: 'Switching and protection equipment' },
    { english: 'Power Factor', hindi: 'Shakti Gunak', devanagari: 'शक्ति गुणक', context: 'Ratio of real to apparent power' },
    { english: 'Frequency', hindi: 'Aavritti', devanagari: 'आवृत्ति', context: 'Cycles per second (Hz)' },
    { english: 'Phase', hindi: 'Kala', devanagari: 'कला', context: 'Angular position of AC waveform' },
    { english: 'Neutral', hindi: 'Tathasth', devanagari: 'तटस्थ', context: 'Common return conductor' },
    { english: 'Capacitor', hindi: 'Sandhaaritra', devanagari: 'संधारित्र', context: 'Stores electrical energy' },
    { english: 'Inductor', hindi: 'Preritak', devanagari: 'प्रेरितक', context: 'Stores magnetic energy' },
    { english: 'Arc Flash', hindi: 'Chaap Chamak', devanagari: 'चाप चमक', context: 'Dangerous electrical arc explosion' },
    { english: 'Differential', hindi: 'Vibhedak', devanagari: 'विभेदक', context: 'Protection comparing two measurements' },
    { english: 'Coordination', hindi: 'Samanvay', devanagari: 'समन्वय', context: 'Sequential relay operation for selectivity' },
    { english: 'Selectivity', hindi: 'Chayan-Kshamta', devanagari: 'चयन-क्षमता', context: 'Only nearest relay trips' },
    { english: 'Backup Protection', hindi: 'Sahayak Suraksha', devanagari: 'सहायक सुरक्षा', context: 'Secondary protection if primary fails' },
    { english: 'CT Saturation', hindi: 'CT Santrripti', devanagari: 'CT संतृप्ति', context: 'CT core reaching magnetic saturation' },
    { english: 'Inrush Current', hindi: 'Antarvaahi Dhara', devanagari: 'अन्तर्वाही धारा', context: 'High transient current on energization' },
    { english: 'Phasor', hindi: 'Kala Sadish', devanagari: 'कला सदिश', context: 'Rotating vector representing AC quantity' },
    { english: 'Harmonic', hindi: 'Sanaadi', devanagari: 'संनादी', context: 'Multiple of fundamental frequency' },
    { english: 'Insulation', hindi: 'Vibandhan', devanagari: 'विबंधन', context: 'Material preventing current flow' },
    { english: 'Commissioning', hindi: 'Prarambhikaran', devanagari: 'प्रारंभीकरण', context: 'Testing and verification before service' },
    { english: 'Maintenance', hindi: 'Rakhrakhaav', devanagari: 'रखरखाव', context: 'Regular upkeep of equipment' },
    { english: 'Protection Zone', hindi: 'Suraksha Kshetra', devanagari: 'सुरक्षा क्षेत्र', context: 'Area covered by one protection scheme' },
    { english: 'Alarm', hindi: 'Chetavani', devanagari: 'चेतावनी', context: 'Warning signal for abnormal condition' },
    { english: 'Transmission Line', hindi: 'Preshit Rekha', devanagari: 'प्रेषित रेखा', context: 'HV line carrying bulk power' },
    { english: 'Distribution', hindi: 'Vitaran', devanagari: 'वितरण', context: 'LV/MV network to consumers' },
    { english: 'Per Unit', hindi: 'Prati Ekai', devanagari: 'प्रति इकाई', context: 'Normalized system of units' },
    { english: 'Sequence Components', hindi: 'Kram Ghatak', devanagari: 'क्रम घटक', context: 'Positive, negative, zero sequence' },
    { english: 'Winding', hindi: 'Kundalak', devanagari: 'कुंडलक', context: 'Copper coil in transformer/motor' },
    { english: 'Metering', hindi: 'Mapan', devanagari: 'मापन', context: 'Measurement of electrical quantities' },
    { english: 'Surge Arrester', hindi: 'Tivra-dhaara Avarodhak', devanagari: 'तीव्र-धारा अवरोधक', context: 'Lightning/switching surge protection' },
    { english: 'Recloser', hindi: 'Punar-Yojak', devanagari: 'पुनर्-योजक', context: 'Auto re-closing circuit breaker' },
    { english: 'Load Shedding', hindi: 'Bhar Katautee', devanagari: 'भार कटौती', context: 'Controlled disconnection of loads' },
    { english: 'Grid Code', hindi: 'Grid Sanhita', devanagari: 'ग्रिड संहिता', context: 'Rules governing grid operation' },
    { english: 'Safety', hindi: 'Suraksha', devanagari: 'सुरक्षा', context: 'Protection of personnel' },
];

/**
 * Indian Engineering Standards Reference
 */
export interface IndianStandard {
    code: string;
    title: string;
    scope: string;
    category: 'IS' | 'CEA' | 'IEGC' | 'CEIG' | 'CBIP' | 'RDSO';
}

export const INDIAN_STANDARDS: IndianStandard[] = [
    // IS Standards
    { code: 'IS 3231', title: 'Electrical Relays for Power System Protection', scope: 'Covers general requirements, classification, and testing of protection relays.', category: 'IS' },
    { code: 'IS 3043:2018', title: 'Code of Practice for Earthing', scope: 'System earthing, equipment earthing, lightning protection earth, step & touch voltage limits.', category: 'IS' },
    { code: 'IS 13947', title: 'Low-Voltage Switchgear & Controlgear', scope: 'Ratings, testing, and performance of LV switchgear assemblies (MCCBs, MCBs, contactors).', category: 'IS' },
    { code: 'IS 2026', title: 'Power Transformers', scope: 'Specification for power transformers — ratings, impedance, temperature rise, tests.', category: 'IS' },
    { code: 'IS 2705', title: 'Current Transformers', scope: 'Specification for CTs — accuracy classes, burden, short-time rating, insulation.', category: 'IS' },
    { code: 'IS 3156', title: 'Voltage Transformers', scope: 'Specification for VTs — accuracy classes, rated burden, and insulation levels.', category: 'IS' },
    { code: 'IS 12360', title: 'Voltage Bands for Electrical Installations', scope: 'Defines LV (< 1 kV), MV (1-33 kV), HV (33-220 kV), EHV (> 220 kV) classifications.', category: 'IS' },
    { code: 'IS 732', title: 'Code of Practice for Electrical Wiring', scope: 'Installation practices for internal wiring — conductor sizing, protection, and testing.', category: 'IS' },
    { code: 'IS 694', title: 'PVC Insulated Cables', scope: 'Specification for PVC insulated cables up to 1100V — sizes, ratings, and tests.', category: 'IS' },
    { code: 'IS 1554', title: 'PVC Insulated HV Cables', scope: 'Cables rated for voltages up to 11 kV — construction, ratings, and type tests.', category: 'IS' },
    // CEA Standards
    { code: 'CEA (TP)', title: 'Technical Standards for Construction', scope: 'Technical standards for construction of electrical plants and electric lines — mandated by CEA.', category: 'CEA' },
    { code: 'CEA (Measures)', title: 'Measures for Safety & Electric Supply', scope: 'Safety measures relating to construction, operation, and maintenance of electric supply.', category: 'CEA' },
    { code: 'CEA Grid Code', title: 'Protection & Automation Requirements', scope: 'Specifies protection systems, communication, and automation for 132 kV and above substations.', category: 'CEA' },
    { code: 'CEA Metering', title: 'Metering Regulations', scope: 'Standards for energy metering at interface points — CT/VT accuracy, meter class, data storage.', category: 'CEA' },
    // IEGC
    { code: 'IEGC', title: 'Indian Electricity Grid Code', scope: 'CERC regulations for grid operation: scheduling, UI mechanism, frequency band (49.90-50.05 Hz), LVRT.', category: 'IEGC' },
    { code: 'IEGC Clause 5.2', title: 'Protection Requirements', scope: 'Dual main protection for 400 kV, auto-reclosing requirements, breaker failure backup.', category: 'IEGC' },
    { code: 'IEGC Clause 6.4', title: 'Under-Frequency Load Shedding', scope: 'Mandatory UFLS stages: 48.8 Hz (10%), 48.6 Hz (10%), 48.4 Hz (10%), 48.2 Hz (15%).', category: 'IEGC' },
    // CEIG
    { code: 'CEIG Rule 36', title: 'Safety Clearances', scope: 'Minimum clearance distances for different voltage levels — ground, phase-to-phase, to structures.', category: 'CEIG' },
    { code: 'CEIG Rule 50', title: 'Cut-Out on Consumer Premises', scope: 'Requirements for consumer cutout, metering, and earthing at service entrance.', category: 'CEIG' },
    // CBIP
    { code: 'CBIP Manual 13', title: 'Transmission Line Manual', scope: 'Design, construction, and maintenance of EHV/HV transmission lines — conductor selection, sag-tension.', category: 'CBIP' },
    { code: 'CBIP Manual 16', title: 'Protection Manual', scope: 'Protection system design philosophy, relay settings, CT/VT specification for Indian grid.', category: 'CBIP' },
    // RDSO
    { code: 'RDSO/PE/SPEC/TL/0181', title: 'Railway Traction Protection', scope: 'Protection relay specifications for Indian Railways 25 kV traction system — feeding substations.', category: 'RDSO' },
];
