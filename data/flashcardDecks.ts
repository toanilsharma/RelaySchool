/**
 * Flashcard Decks — comprehensive coverage of all major protection engineering topics.
 * Each deck maps to a simulator/module in the app.
 * 12 decks, 150+ cards total.
 */

export interface FlashCard {
    q: string;
    a: string;
}

export interface FlashDeck {
    id: string;
    title: string;
    emoji: string;
    category: 'protection' | 'system' | 'digital' | 'fundamentals';
    cards: FlashCard[];
}

export const FLASHCARD_DECKS: FlashDeck[] = [
    // ─────────────────────────────────────────────
    // 1. DISTANCE PROTECTION (21)
    // ─────────────────────────────────────────────
    {
        id: 'distance',
        title: 'Distance Protection (21)',
        emoji: '📏',
        category: 'protection',
        cards: [
            { q: 'What is the primary input required for a distance relay?', a: 'Voltage and Current (Z = V/I). The relay measures impedance to determine fault location.' },
            { q: 'Why is Zone 1 typically set to 80-85% of line impedance?', a: 'To prevent overreaching due to CT/VT errors, line parameter inaccuracies, and infeed effects.' },
            { q: 'What does SIR stand for?', a: 'Source Impedance Ratio (ZS/ZL). High SIR means weak source, making relay less sensitive to remote faults.' },
            { q: 'Which impedance characteristic is inherently directional?', a: 'Mho Characteristic — its circle passes through the origin, inherently discriminating forward from reverse faults.' },
            { q: 'What is the purpose of Load Encroachment logic?', a: 'To prevent Zone 3 tripping during heavy load when measured impedance drops into the relay characteristic.' },
            { q: 'Why is Zone 2 set to 120% of line impedance?', a: 'To cover the remaining 15-20% of the line plus a margin, providing backup for the remote bus. It uses a time delay (typically 300-400 ms).' },
            { q: 'What is a "power swing"?', a: 'Oscillation of rotor angles after a disturbance causing the apparent impedance to sweep through relay zones. Power Swing Blocking (PSB) prevents false tripping.' },
            { q: 'What is the advantage of Quadrilateral characteristic over Mho?', a: 'Independent R and X reach settings allow better resistive fault coverage, especially for short lines and high-resistance ground faults.' },
            { q: 'What causes Zone 1 underreach?', a: 'Mutual coupling from parallel lines, infeed from intermediate sources, and CT/VT errors can reduce measured impedance.' },
            { q: 'How does a Permissive Overreaching Transfer Trip (POTT) scheme work?', a: 'Both ends send a permissive signal when their overreaching Zone 2 picks up. A trip occurs only when a relay receives a signal AND its own overreaching element picks up.' },
            { q: 'What is the typical Zone 3 time delay?', a: '1.0 to 1.5 seconds. It acts as remote backup protection for adjacent lines and busbar faults.' },
            { q: 'What is "Carrier-Aided" distance protection?', a: 'Uses a communication channel (fiber, PLC, microwave) between line ends to achieve high-speed tripping for faults anywhere on the line, overcoming Zone 1 underreach.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 2. DIFFERENTIAL PROTECTION (87)
    // ─────────────────────────────────────────────
    {
        id: 'differential',
        title: 'Differential Protection (87)',
        emoji: '⚖️',
        category: 'protection',
        cards: [
            { q: 'What is the core principle of Differential Protection?', a: 'Kirchhoff\'s Current Law — the algebraic sum of currents entering and leaving a protected zone must be zero under normal conditions.' },
            { q: 'What causes false differential currents during transformer energization?', a: 'Transformer Inrush Current — rich in 2nd harmonic (typically 60-70% of fundamental).' },
            { q: 'Why do we use a Percentage Restraint characteristic?', a: 'To increase security during heavy external faults which may cause CT saturation and produce false differential current.' },
            { q: 'What harmonic is used to block inrush?', a: '2nd Harmonic. Typical setting: block if I2/I1 > 15-20%.' },
            { q: 'What harmonic indicates transformer over-excitation?', a: '5th Harmonic. Over-excitation occurs when V/Hz exceeds rated value, producing odd harmonics in exciting current.' },
            { q: 'What is a "through fault stabilization" feature?', a: 'Adaptive increase of restraint after detecting external fault conditions (high through current), preventing misoperation during CT saturation.' },
            { q: 'Why is CT ratio matching important in differential schemes?', a: 'Mismatched CT ratios produce a steady-state differential current that can cause false tripping. Modern relays use software ratio correction.' },
            { q: 'What is the difference between biased and unbiased differential?', a: 'Unbiased (high-impedance) uses a fixed threshold; biased (percentage restraint) increases the operating threshold proportionally to through current.' },
            { q: 'What is a Dual Slope characteristic?', a: 'A restraint curve with two slopes — a lower slope (e.g., 20%) for low currents and a steeper slope (e.g., 60%) for high currents to handle CT saturation.' },
            { q: 'How does high-impedance differential protection work?', a: 'All CTs are connected in parallel with a high-impedance relay. During external faults with CT saturation, the voltage across the relay stays below the threshold.' },
            { q: 'What is the typical minimum operating current (pickup) for transformer differential?', a: '0.2-0.3 × rated current, to account for tap changer effects and CT errors.' },
            { q: 'What is cross-blocking in differential protection?', a: 'When harmonics detected in one phase are used to block tripping in all three phases. This prevents false trips during sympathetic inrush.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 3. OVERCURRENT PROTECTION (50/51)
    // ─────────────────────────────────────────────
    {
        id: 'overcurrent',
        title: 'Overcurrent Protection (50/51)',
        emoji: '⚡',
        category: 'protection',
        cards: [
            { q: 'What is the difference between ANSI 50 and 51?', a: '50 = Instantaneous Overcurrent (no intentional time delay). 51 = Time Overcurrent (inverse-time characteristic).' },
            { q: 'Name the four standard IEC inverse curves.', a: 'Standard Inverse (SI), Very Inverse (VI), Extremely Inverse (EI), and Long Time Inverse (LTI).' },
            { q: 'What is the formula for IEC Standard Inverse curve?', a: 't = TMS × 0.14 / (I^0.02 - 1), where I is the multiple of pickup current.' },
            { q: 'What does TMS stand for?', a: 'Time Multiplier Setting — a scaling factor that shifts the entire time-current curve up or down for coordination.' },
            { q: 'What is the purpose of a "reset ratio" in overcurrent relays?', a: 'It defines the current level at which the relay resets (typically 95-97% of pickup). Important for motor starting scenarios.' },
            { q: 'When should you use a Very Inverse (VI) curve?', a: 'When fault current varies significantly with fault location (e.g. long feeders), as VI provides faster tripping at high currents and slower at low.' },
            { q: 'What is the typical coordination time interval (CTI) between series overcurrent relays?', a: '0.3 to 0.4 seconds. Accounts for relay operating time tolerance, CT errors, and breaker clearing time.' },
            { q: 'What is Directional Overcurrent (67)?', a: 'An overcurrent relay combined with a directional element using voltage as polarizing reference. Required in networked/ring systems.' },
            { q: 'What advantage does IDMT (Inverse Definite Minimum Time) provide?', a: 'Automatic discrimination — closer faults (higher current) clear faster, while distant faults (lower current) have longer operating time.' },
            { q: 'What is a "cold load pickup" problem?', a: 'After a prolonged outage, simultaneous energization of all loads (loss of diversity) causes current 2-6× normal, potentially tripping overcurrent relays.' },
            { q: 'What is the pickup setting rule for 51 relays protecting feeders?', a: 'Typically 1.5× maximum load current (accounting for overload and CT ratio). Must be below minimum fault current for sensitivity.' },
            { q: 'What is the Extremely Inverse curve used for?', a: 'Coordinating with fuse curves and protecting equipment with I²t thermal limits (e.g., cables, motors).' },
        ],
    },

    // ─────────────────────────────────────────────
    // 4. TRANSFORMER PROTECTION
    // ─────────────────────────────────────────────
    {
        id: 'transformer',
        title: 'Transformer Protection',
        emoji: '🔌',
        category: 'protection',
        cards: [
            { q: 'What is the Buchholz relay and what does it detect?', a: 'A mechanical gas-accumulation relay mounted in the pipe between transformer tank and conservator. Detects internal faults that produce gas.' },
            { q: 'Why does a Dyn11 transformer require 30° phase compensation in differential protection?', a: 'The delta-star winding introduces a 30° phase shift. Without compensation, the differential relay sees a permanent spill current.' },
            { q: 'What is the typical Restricted Earth Fault (REF) pickup setting?', a: '10-20% of rated current. REF provides sensitive detection of ground faults near the neutral of star windings.' },
            { q: 'What causes a transformer to over-excite?', a: 'Operating above rated V/Hz ratio — due to overvoltage, under-frequency, or both. Causes core saturation and excessive magnetizing current.' },
            { q: 'What is the purpose of an Oil Temperature relay?', a: 'Trips the transformer when winding hot-spot or top-oil temperature exceeds safe limits. Typically has alarm (Stage 1) and trip (Stage 2) settings.' },
            { q: 'What is a "tap changer" and why does it affect differential protection?', a: 'An On-Load Tap Changer varies the ratio to regulate voltage. This changes the effective CT ratio, introducing a permanent spill current. Modern relays compensate automatically.' },
            { q: 'What does a Sudden Pressure Relay (SPR) detect?', a: 'A rapid rate-of-rise of gas pressure inside the transformer tank, indicating an internal arc fault. Faster than Buchholz for severe faults.' },
            { q: 'What are the typical alarm and trip temperatures for a transformer?', a: 'Top oil: alarm at 85°C, trip at 95°C. Winding hot-spot: alarm at 105°C, trip at 120°C (varies by class).' },
            { q: 'What is the purpose of neutral grounding in a transformer?', a: 'Limits ground fault current magnitude, reduces step/touch voltages, and enables ground fault detection. Methods: solid, resistance, reactance, or ungrounded.' },
            { q: 'Why is the 87T relay considered the primary protection for large transformers?', a: 'It provides instantaneous, selective tripping for internal faults with no coordination delays. Zone is clearly defined by CT locations.' },
            { q: 'What is vector group compensation?', a: 'Adjusting current vectors in the relay to account for the inherent phase shift introduced by the transformer winding configuration (e.g., Dyn11 = 30° lag).' },
        ],
    },

    // ─────────────────────────────────────────────
    // 5. GENERATOR PROTECTION
    // ─────────────────────────────────────────────
    {
        id: 'generator',
        title: 'Generator Protection',
        emoji: '⚙️',
        category: 'protection',
        cards: [
            { q: 'What is 100% stator earth fault protection?', a: 'A scheme using fundamental frequency neutral overvoltage (59N) combined with third harmonic undervoltage (27TH) to detect ground faults anywhere in the stator.' },
            { q: 'What is the purpose of Loss of Excitation (40) protection?', a: 'Detects loss of field current which causes the generator to operate as an induction generator, drawing reactive power from the system and risking damage.' },
            { q: 'What does Reverse Power (32) protection detect?', a: 'Detects motoring condition when prime mover fails. Important for steam turbines (blade damage at ~2% motoring) and gas turbines.' },
            { q: 'What is the typical setting for generator overcurrent backup (51V)?', a: 'Voltage-controlled or voltage-restrained overcurrent. Pickup drops to ~50% of rated when voltage collapses during a fault.' },
            { q: 'What is Negative Sequence Current (46) protection?', a: 'Protects against unbalanced loading which creates a rotating field at twice synchronous speed, causing rapid rotor heating. Typically set at I₂ = 5-10% of rated.' },
            { q: 'Why is generator neutral grounding through a resistor important?', a: 'Limits ground fault current to typically 5-25A, reducing arc damage and iron burning in the stator core. Uses a distribution transformer and secondary resistor.' },
            { q: 'What is Inadvertent Energization (50/27) protection?', a: 'Detects accidental energization of a standstill generator. Uses overcurrent supervised by undervoltage — trips if current flows when voltage is absent.' },
            { q: 'What is the purpose of Out-of-Step (78) protection?', a: 'Detects when a generator loses synchronism with the power system. Trips the unit before each pole slip causes damaging transient torques.' },
            { q: 'What is the Volts/Hz (24) protection setting?', a: 'Typically alarm at 110% (V/Hz) and trip at 118%. Protects against over-excitation which saturates the core and causes overheating.' },
            { q: 'What is the typical stator differential (87G) sensitivity?', a: '5-10% of rated current. More sensitive than transformer differential because generators have well-matched CTs and no tap changers.' },
            { q: 'What is anti-motoring protection important for gas turbines?', a: 'Gas turbines can overheat within seconds of motoring due to compressor surge. Reverse power setting is very sensitive (< 2% rated power).' },
        ],
    },

    // ─────────────────────────────────────────────
    // 6. BUSBAR PROTECTION (87B)
    // ─────────────────────────────────────────────
    {
        id: 'busbar',
        title: 'Busbar Protection (87B)',
        emoji: '🔲',
        category: 'protection',
        cards: [
            { q: 'Why is busbar protection considered the most critical zone?', a: 'A bus fault can involve the highest fault level in the system and affects all connected circuits. False trip disconnects all feeders.' },
            { q: 'What is "CT Saturation Detection" in numerical bus protection?', a: 'An algorithm that detects when a CT saturates during an external fault. It temporarily blocks tripping to prevent false differential operation.' },
            { q: 'What is the advantage of Low-Impedance bus protection?', a: 'Does not require matched CTs. Uses numerical algorithms to compensate for CT differences, making it flexible for evolving substations.' },
            { q: 'What is a check zone in busbar protection?', a: 'An overall differential zone covering the entire bus arrangement. Both the discriminating zone AND check zone must pick up for a trip — providing redundancy.' },
            { q: 'What is end-fault protection?', a: 'Covers faults between the CT and the circuit breaker (outside the normal differential zone). Uses breaker-fail logic to ensure clearance.' },
            { q: 'How does High-Impedance bus differential work?', a: 'All CTs connected in parallel across a high-impedance relay. During external faults, saturated CTs shunt current, keeping voltage below relay setting.' },
            { q: 'What is the typical pickup for low-impedance busbar differential?', a: '20-30% of rated CT secondary current. Must be above maximum CT error current during normal load and external faults.' },
            { q: 'What is zone selection in a double-bus arrangement?', a: 'Isolator status (auxiliary contacts) determines which CTs are assigned to which bus zone, allowing dynamic zone reconfiguration as bus sections change.' },
            { q: 'Why must busbar protection have very fast operating time?', a: 'To limit equipment damage (buses carry highest fault current in the system) and maintain system stability. Typical target: < 1 cycle (20 ms at 50 Hz).' },
        ],
    },

    // ─────────────────────────────────────────────
    // 7. CT & VT FUNDAMENTALS
    // ─────────────────────────────────────────────
    {
        id: 'ct-vt',
        title: 'CT & VT Fundamentals',
        emoji: '📐',
        category: 'fundamentals',
        cards: [
            { q: 'What is the knee-point voltage (Vk) of a CT?', a: 'The voltage at which a 10% increase in excitation voltage produces a 50% increase in magnetizing current. Indicates onset of saturation.' },
            { q: 'What is CT class 5P20?', a: 'Protection class CT with 5% composite error at 20× rated current (Accuracy Limit Factor = 20).' },
            { q: 'Why should a CT secondary never be open-circuited?', a: 'The primary current acts as magnetizing current, driving the core into deep saturation and generating dangerous voltages (potentially kV) on the secondary.' },
            { q: 'What is the CT burden?', a: 'The total impedance (relay + wiring) connected to the CT secondary. Must stay within the rated burden to maintain accuracy.' },
            { q: 'What does a CVT (Capacitor Voltage Transformer) use?', a: 'A capacitor divider stack to step down HV to an intermediate voltage, followed by an electromagnetic transformer. More economical than wound VTs at ≥ 110 kV.' },
            { q: 'What is the excitation curve (B-H curve) of a CT?', a: 'Plots magnetizing voltage vs. excitation current. Below the knee point, the CT is accurate. Above it, errors increase rapidly.' },
            { q: 'What is the CT ratio error at low currents?', a: 'At very low primary currents, the magnetizing current becomes a larger fraction of total primary current, causing significant ratio error (typically > 3% below 5% rated).' },
            { q: 'What is the remanent flux problem in CTs?', a: 'After a DC transient (e.g. fault with DC offset), the CT core may retain residual flux up to 80% of saturation. Subsequent faults may cause immediate saturation.' },
            { q: 'What is a Rogowski coil and its advantages?', a: 'An air-cored current sensor with no iron core — cannot saturate, extremely wide bandwidth, lightweight. Output is di/dt (requires integration).' },
            { q: 'What is the burden of a modern numerical relay?', a: 'Typically < 0.5 VA — much lower than electromechanical relays (5-15 VA). This allows smaller CTs or longer wiring.' },
            { q: 'What is the IEC standard for CTs used in protection?', a: 'IEC 61869-2 (replaced earlier IEC 60044-1). Defines accuracy classes like 5P, 10P, PX/TPX/TPY/TPZ.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 8. IEC 61850 & DIGITAL SUBSTATION
    // ─────────────────────────────────────────────
    {
        id: 'iec61850',
        title: 'IEC 61850 & GOOSE',
        emoji: '🌐',
        category: 'digital',
        cards: [
            { q: 'What does GOOSE stand for?', a: 'Generic Object Oriented Substation Event — a multicast Ethernet protocol for fast, reliable peer-to-peer communication between IEDs.' },
            { q: 'What is a Logical Node (LN) in IEC 61850?', a: 'A standardized functional block (e.g., PTOC for time overcurrent, PDIS for distance). LNs model the functions of protection devices.' },
            { q: 'What is the difference between GOOSE and MMS?', a: 'GOOSE is Layer 2 (Ethernet multicast) for < 4 ms latency critical events. MMS is TCP/IP based for configuration, monitoring, and SCADA (non-critical, higher latency).' },
            { q: 'What is Sampled Values (SV)?', a: 'IEC 61850-9-2: Digital streaming of analog measurements (V, I) from Merging Units at 80 or 256 samples/cycle, replacing hardwired analog connections.' },
            { q: 'What is the Process Bus?', a: 'Ethernet network at the switchyard level carrying Sampled Values and GOOSE between Merging Units, protection IEDs, and bay controllers.' },
            { q: 'What is a SCL (Substation Configuration Language) file?', a: 'An XML-based file (.scd, .icd, .cid) that describes the complete substation configuration — IEDs, communication, data models — enabling interoperability.' },
            { q: 'What is the GOOSE retransmission strategy?', a: 'GOOSE retransmits with exponentially increasing intervals: T0 (immediately), T1 (short, ~2ms), T2, T3 (long, ~1s max). Ensures reliability without acknowledgment.' },
            { q: 'What is a Merging Unit (MU)?', a: 'A device that digitizes analog voltage and current samples from non-conventional instrument transformers and publishes them as IEC 61850 Sampled Values.' },
            { q: 'What is the "Edition 2" improvement of IEC 61850?', a: 'Added redundancy protocols (PRP/HSR), improved data models, more Logical Nodes, and enhanced cybersecurity features.' },
            { q: 'What latency requirement does IEC 61850 specify for GOOSE?', a: 'Transfer time < 3-4 ms for Protection class (Type 1A). GOOSE achieves this using direct Ethernet multicast without TCP/IP overhead.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 9. POWER SYSTEM FUNDAMENTALS
    // ─────────────────────────────────────────────
    {
        id: 'fundamentals',
        title: 'Power System Basics',
        emoji: '📚',
        category: 'fundamentals',
        cards: [
            { q: 'What are Symmetrical Components?', a: 'Fortescue\'s method: any unbalanced 3-phase system can be resolved into three balanced sets — Positive, Negative, and Zero sequence.' },
            { q: 'What is the per-unit system?', a: 'A normalization system where quantities are expressed as fractions of a base value. Eliminates transformer turns ratio from calculations.' },
            { q: 'What is the typical X/R ratio of a transmission line?', a: '5-15 for transmission (high voltage). Lower X/R (1-3) for distribution. Higher X/R means more DC offset in fault current.' },
            { q: 'What is the difference between bolted and arcing faults?', a: 'Bolted: zero fault resistance (maximum fault current). Arcing: fault through an arc (resistance reduces current, makes detection harder).' },
            { q: 'What determines the DC offset in fault current?', a: 'The point-on-wave at which the fault occurs relative to the voltage zero crossing. Maximum DC offset when fault occurs at voltage zero.' },
            { q: 'What is the breaking capacity of a circuit breaker?', a: 'The maximum fault current (in kA rms) that the breaker can safely interrupt at rated voltage. Includes both AC and DC components.' },
            { q: 'What is a Zero Sequence current?', a: 'The in-phase component of unbalanced currents. Flows through ground paths and neutral conductors. Present only in ground faults. I₀ = (Ia + Ib + Ic) / 3.' },
            { q: 'What is the difference between fault level (MVA) and fault current (kA)?', a: 'Fault Level (MVA) = √3 × kV × Fault Current (kA). They express the same thing in different units.' },
            { q: 'What is an Auto-Recloser?', a: 'A device that automatically recloses a breaker after a fault trip. ~80% of overhead line faults are transient — reclosing restores supply without operator intervention.' },
            { q: 'What is Ferranti Effect?', a: 'Voltage rise at the receiving end of a lightly-loaded or open-circuited long transmission line, due to line capacitance exceeding inductive drop.' },
            { q: 'What is the purpose of a Neutral Grounding Resistor (NGR)?', a: 'Limits ground fault current to a safe value (typically 5-400A), reducing equipment damage and step/touch potentials while still allowing fault detection.' },
            { q: 'What is the significance of the first 5 cycles of fault current?', a: 'Contains the maximum asymmetric current (AC + DC offset). Breakers and CTs must be rated for this peak. Subtransient reactance (X"d) governs this period.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 10. MOTOR PROTECTION
    // ─────────────────────────────────────────────
    {
        id: 'motor',
        title: 'Motor Protection',
        emoji: '🔄',
        category: 'protection',
        cards: [
            { q: 'What is the typical starting current of an induction motor?', a: '5-8 × Full Load Current (FLA). Starting time can range from 5 to 30 seconds depending on motor and load inertia.' },
            { q: 'What is a thermal overload (49) relay model?', a: 'Calculates heat rise using I²t integration, simulating the motor\'s thermal behavior. Accounts for ambient temperature and cooling time constants.' },
            { q: 'What is the purpose of Locked Rotor Protection (51LR)?', a: 'Trips the motor if it fails to accelerate within a set time (starting fails). Prevents rotor bar and stator winding damage from sustained high current.' },
            { q: 'What does Negative Sequence Current (46) protection detect in motors?', a: 'Unbalanced supply voltage — even 2-3% voltage unbalance causes ~15-25% negative sequence current, creating reverse-rotating field and rapid rotor heating.' },
            { q: 'What is the permissible number of motor starts per hour?', a: 'Typically 2-3 hot starts and 3-4 cold starts per hour, depending on motor thermal design (Class B, F, or H insulation).' },
            { q: 'What is the purpose of Under-Voltage (27) protection for motors?', a: 'Trips motors during voltage dips to prevent: (a) excessive current draw attempting to maintain torque, and (b) simultaneous restarting (bus overload) on voltage recovery.' },
            { q: 'What is Ground Fault protection for motors?', a: 'Detects current flowing to ground through insulation failure. Uses Zero Sequence CT (core-balance) or residual connection. Pickup: 5-20% of FLA.' },
            { q: 'What is the difference between Class 10 and Class 20 thermal overload?', a: 'Class 10 trips in 10 seconds at 7.2× FLA (standard). Class 20 trips in 20 seconds (for high-inertia loads like fans, compressors).' },
            { q: 'What is RTD (Resistance Temperature Detector) protection?', a: 'Direct winding temperature measurement using embedded sensors (Pt100). More accurate than calculated thermal models. Trips at Class B: 130°C, Class F: 155°C.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 11. FREQUENCY & VOLTAGE PROTECTION
    // ─────────────────────────────────────────────
    {
        id: 'frequency',
        title: 'Frequency & Voltage Protection',
        emoji: '📶',
        category: 'system',
        cards: [
            { q: 'What causes system frequency to drop?', a: 'Generation-load imbalance where load exceeds generation. Each 1% overload causes approximately 0.5 Hz/s rate of frequency decline.' },
            { q: 'What is Under-Frequency Load Shedding (UFLS)?', a: 'Automatic disconnection of load blocks at decreasing frequency thresholds (e.g., 49.0, 48.5, 48.0 Hz) to arrest frequency decline and prevent blackout.' },
            { q: 'What is the df/dt (ROCOF) relay?', a: 'Rate of Change of Frequency relay — detects rapid frequency change indicating severe generation deficit or islanding. Typical setting: 0.5-1.0 Hz/s.' },
            { q: 'What is the Indian Grid Code frequency band?', a: '49.90 - 50.05 Hz (IEGC). Generators must operate continuously within 47.50 - 51.50 Hz (emergency).' },
            { q: 'What is an Over-Voltage relay (59) used for?', a: 'Protects equipment from sustained overvoltage — e.g., capacitor bank switching, load rejection, ferroresonance. Typically set at 110-115% of rated voltage.' },
            { q: 'What is Volts/Hertz (V/Hz) protection?', a: 'Protects transformers and generators from over-excitation (core saturation) caused by overvoltage or under-frequency. Trip at typically 1.10-1.18 p.u. V/Hz.' },
            { q: 'What does Under-Voltage (27) protection prevent?', a: 'Motor stalling, contactor dropout (loss of control), and voltage collapse propagation. Typical setting: 80-90% of rated voltage.' },
            { q: 'What is islanding detection?', a: 'Detecting when a distributed generator becomes isolated from the main grid. Methods: passive (V/f, ROCOF) and active (impedance shift, frequency push).' },
            { q: 'Why is turbine blade protection linked to under-frequency?', a: 'Below ~47 Hz, steam turbine last-stage blades resonate, causing rapid fatigue damage. Cumulative operation below 47.5 Hz is strictly limited.' },
        ],
    },

    // ─────────────────────────────────────────────
    // 12. INDIAN STANDARDS & PRACTICES
    // ─────────────────────────────────────────────
    {
        id: 'indian-standards',
        title: 'Indian Standards (IS/IEGC)',
        emoji: '🇮🇳',
        category: 'system',
        cards: [
            { q: 'What is the IEGC?', a: 'Indian Electricity Grid Code — regulations by CERC governing grid operation, scheduling, metering, and protection. Mandatory for all grid-connected entities.' },
            { q: 'What are the CEA (Technical Standards) Regulations?', a: 'Central Electricity Authority regulations specifying protection requirements, CT/VT specifications, relay types, and testing intervals for Indian power systems.' },
            { q: 'What is the standard frequency in India?', a: '50 Hz. Grid frequency must be maintained within 49.90-50.05 Hz band per IEGC. CERC imposes commercial incentives/penalties.' },
            { q: 'What is the voltage standard for Indian transmission?', a: '400 kV, 220 kV, 132 kV, 110 kV, 66 kV, and 33 kV. 765 kV for long-distance bulk power transmission (PGCIL corridors).' },
            { q: 'What does CEIG stand for?', a: 'Central Electrical Inspector General — oversees electrical safety and standards compliance for installations up to 33 kV (state jurisdiction for LT).' },
            { q: 'What is the Indian standard for protective relays?', a: 'IS 3231 (general), supplemented by IEC 60255 series. Modern numerical relays follow IEC 61850 data models.' },
            { q: 'What grounding practice does CEA mandate for 132 kV and above?', a: 'Effective (solid) grounding with X₀/X₁ ≤ 3 and R₀/X₁ ≤ 1. Limits ground fault overvoltage to 138% or less.' },
            { q: 'What is the mandatory protection relay testing interval in India?', a: 'CEA Technical Standards specify: Primary injection test — every 5 years. Secondary injection + functional test — annually.' },
            { q: 'What is the PGCIL protection philosophy for 400 kV lines?', a: 'Dual Main-1 and Main-2 protection (typically distance), with auto-reclosing, breaker failure backup, and dedicated communication channels.' },
            { q: 'What is the IS standard for earthing practices?', a: 'IS 3043:2018 — Code of Practice for Earthing. Covers system earthing, equipment earthing, and lightning protection earth connections.' },
        ],
    },
];

/** Total card count across all decks */
export const TOTAL_CARDS = FLASHCARD_DECKS.reduce((sum, deck) => sum + deck.cards.length, 0);

/** Unique categories */
export const CATEGORIES = [...new Set(FLASHCARD_DECKS.map(d => d.category))] as const;
