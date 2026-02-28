const fs = require('fs');

function updateAutorecloserSim() {
    let file = 'e:\\GOOGLE AI STUDIO\\RELAYSCHOOL\\RELAYSHOOL UNZIPPED\\pages\\AutorecloserSim.tsx';
    let content = fs.readFileSync(file, 'utf8');

    const replacements = {
        'opts: ["30%", "50%", "80%", "95%"], ans: 2 }': 'opts: ["30%", "50%", "80%", "95%"], ans: 2, why: "Approximately 80% to 90% of faults on overhead lines are transient (e.g., lightning strikes, momentary tree contacts) and clear themselves shortly after the breaker trips." }',
        'opts: ["Keeps reclosing", "Lockout", "Alarm only", "Transfer trip"], ans: 1 }': 'opts: ["Keeps reclosing", "Lockout", "Alarm only", "Transfer trip"], ans: 1, why: "Once all programmed reclose attempts fail to clear the fault, the autorecloser goes to \'Lockout\' (remains open) to prevent further damage and await manual inspection." }',
        'opts: ["Closed", "Open (waiting)", "Tripping", "Being tested"], ans: 1 }': 'opts: ["Closed", "Open (waiting)", "Tripping", "Being tested"], ans: 1, why: "Dead time (open time) is the calculated delay between the breaker opening to clear the fault and the subsequent automatic reclosing attempt." }',
        'opts: ["Overhead lines", "Underground cables", "Transformers", "Busbars"], ans: 1 }': 'opts: ["Overhead lines", "Underground cables", "Transformers", "Busbars"], ans: 1, why: "Faults on underground cables are almost always permanent (insulation breakdown). Reclosing into a permanent cable fault causes severe further damage." }',
        'opts: ["Time to repair", "Time to reset shot counter after success", "Fault clearing time", "Breaker operating time"], ans: 1 }': 'opts: ["Time to repair", "Time to reset shot counter after success", "Fault clearing time", "Breaker operating time"], ans: 1, why: "Reclaim time is the period the breaker must remain closed after a successful reclose before the scheme resets the shot counter back to zero." }',
        'opts: ["Above the fuse curve", "Below the fuse minimum-melt curve", "Equal to the fuse curve", "Disabled"], ans: 1 }': 'opts: ["Above the fuse curve", "Below the fuse minimum-melt curve", "Equal to the fuse curve", "Disabled"], ans: 1, why: "To save the fuse from blowing on a transient fault, the autorecloser\'s fast trip curve must be faster (below) the fuse\'s minimum melting time curve." }',
        'opts: ["Motor re-acceleration", "Arc deionization time", "CT saturation", "VT accuracy"], ans: 1 }': 'opts: ["Motor re-acceleration", "Arc deionization time", "CT saturation", "VT accuracy"], ans: 1, why: "At higher voltages, the arc channel takes longer to dissipate the ionized gas (deionize). If reclosed too quickly, the restriking voltage will reignite the arc." }',
        'opts: ["25", "50", "79", "81"], ans: 2 }': 'opts: ["25", "50", "79", "81"], ans: 2, why: "ANSI/IEEE device number 79 represents an AC reclosing relay." }',
        'opts: ["5 seconds", "0.3-0.5 seconds", "60 seconds", "0.01 seconds"], ans: 1 }': 'opts: ["5 seconds", "0.3-0.5 seconds", "60 seconds", "0.01 seconds"], ans: 1, why: "A typical first \'fast\' shot dead time on distribution is around 0.3 to 0.5 seconds, just enough for lightning arcs to deionize while minimizing customer interruption." }',
        'opts: ["Increments", "Resets to zero", "Stays the same", "Doubles"], ans: 1 }': 'opts: ["Increments", "Resets to zero", "Stays the same", "Doubles"], ans: 1, why: "The purpose of the reclaim timer is to determine if a reclose was successful. If the timer expires without another fault occurring, the sequence resets to zero." }',
        'opts: ["Fault current magnitude", "System voltage level", "CT ratio", "Relay type"], ans: 1 }': 'opts: ["Fault current magnitude", "System voltage level", "CT ratio", "Relay type"], ans: 1, why: "Deionization time strictly increases with system voltage because higher voltages can jump larger gaps and maintain ionization longer." }',
        'opts: ["It saves fuses", "It minimizes momentary outages on the main feeder", "It\'s cheaper", "It\'s faster"], ans: 1 }': 'opts: ["It saves fuses", "It minimizes momentary outages on the main feeder", "It\'s cheaper", "It\'s faster"], ans: 1, why: "Fuse-blowing (trip-saving) philosophy lets the lateral fuse blow immediately for faults, preventing a momentary voltage dip/blinking lights for all other customers on the main feeder." }',
        'opts: ["CT accuracy check", "Anti-islanding / DER trip verification", "VT calibration", "Harmonic filtering"], ans: 1 }': 'opts: ["CT accuracy check", "Anti-islanding / DER trip verification", "VT calibration", "Harmonic filtering"], ans: 1, why: "Before reclosing, the utility must ensure that Distributed Energy Resources (DERs) have tripped offline (anti-islanding) so the recloser does not close out-of-phase with the remaining island." }',
        'opts: ["Multi-shot causes more damage", "Single-shot has higher success rate", "System stability limits allow only one attempt", "Equipment cost"], ans: 2 }': 'opts: ["Multi-shot causes more damage", "Single-shot has higher success rate", "System stability limits allow only one attempt", "Equipment cost"], ans: 2, why: "On EHV transmission lines, multiple recloses into a solid fault can cause severe transients, destabilizing the generator rotors and leading to a wider system collapse." }',
        'opts: ["Faster tripping", "Breaker cannot reclose until manually reset", "CT protection", "Voltage restoration"], ans: 1 }': 'opts: ["Faster tripping", "Breaker cannot reclose until manually reset", "CT protection", "Voltage restoration"], ans: 1, why: "The 86 lockout relay physically prevents breaker closing circuits from operating until an operator visually inspects the equipment and manually resets the relay." }',
    };

    for (const [key, val] of Object.entries(replacements)) {
        content = content.replace(key, val);
    }
    
    // Add rendering
    content = content.replace(
        '</button>\r\n                        ))}\r\n                    </div>\r\n                </div>',
        '</button>\r\n                        ))}\r\n                    </div>\r\n                    {selected !== null && q.why && (\r\n                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? \'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400\' : \'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400\'}`}>\r\n                            <strong>{selected === q.ans ? \'✅ Correct! \' : \'❌ Incorrect. \'}</strong>\r\n                            {q.why}\r\n                        </div>\r\n                    )}\r\n                </div>'
    );
     content = content.replace(
        '</button>\n                        ))}\n                    </div>\n                </div>',
        '</button>\n                        ))}\n                    </div>\n                    {selected !== null && q.why && (\n                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? \'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400\' : \'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400\'}`}>\n                            <strong>{selected === q.ans ? \'✅ Correct! \' : \'❌ Incorrect. \'}</strong>\n                            {q.why}\n                        </div>\n                    )}\n                </div>'
    );

    fs.writeFileSync(file, content);
    console.log('AutorecloserSim updated');
}

function updateFrequencyProtection() {
    let file = 'e:\\GOOGLE AI STUDIO\\RELAYSCHOOL\\RELAYSHOOL UNZIPPED\\pages\\FrequencyProtection.tsx';
    let content = fs.readFileSync(file, 'utf8');

    const replacements = {
        'opts: ["Rises", "Drops", "Stays the same", "Oscillates"], ans: 1 }': 'opts: ["Rises", "Drops", "Stays the same", "Oscillates"], ans: 1, why: "Power system frequency is a balance between generation and load. If load exceeds generation, the remaining kinetic energy in the rotating machines is extracted, slowing them down and dropping the frequency." }',
        'opts: ["50", "67", "81", "87"], ans: 2 }': 'opts: ["50", "67", "81", "87"], ans: 2, why: "ANSI/IEEE device number 81 is designated for frequency relays (81U for under-frequency, 81O for over-frequency, 81R for rate-of-change)." }',
        'opts: ["Under-Frequency Load Shedding", "Ultra-Fast Line Switching", "Under-Frequency Loss of Supply", "Unified Frequency Logic System"], ans: 0 }': 'opts: ["Under-Frequency Load Shedding", "Ultra-Fast Line Switching", "Under-Frequency Loss of Supply", "Unified Frequency Logic System"], ans: 0, why: "Under-Frequency Load Shedding (UFLS) is an automated scheme designed to drop non-critical load blocks to arrest frequency decline and prevent severe generation loss." }',
        'opts: ["48 Hz", "50 Hz", "55 Hz", "60 Hz"], ans: 1 }': 'opts: ["48 Hz", "50 Hz", "55 Hz", "60 Hz"], ans: 1, why: "50 Hz is the standard nominal frequency used in most of the world outside of the Americas." }',
        'opts: ["Voltage change rate", "Frequency change rate", "Current change rate", "Power change rate"], ans: 1 }': 'opts: ["Voltage change rate", "Frequency change rate", "Current change rate", "Power change rate"], ans: 1, why: "ROCOF stands for Rate Of Change Of Frequency (df/dt), measured in Hz/second. It indicates the severity of the generation/load imbalance." }',
        'opts: ["20%", "35%", "50%", "75%"], ans: 2 }': 'opts: ["20%", "35%", "50%", "75%"], ans: 2, why: "IEEE standards generally recommend that regional UFLS schemes have the capability to shed up to 50% of the system peak load in emergencies." }',
        'opts: ["Fault detection", "Islanding detection", "CT saturation", "Harmonic measurement"], ans: 1 }': 'opts: ["Fault detection", "Islanding detection", "CT saturation", "Harmonic measurement"], ans: 1, why: "A high ROCOF is a prime indicator that a local section of the grid has separated from the main grid (islanding) and is experiencing severe imbalance." }',
        'opts: ["50.5 Hz", "49.0 Hz", "47.0 Hz", "45.0 Hz"], ans: 1 }': 'opts: ["50.5 Hz", "49.0 Hz", "47.0 Hz", "45.0 Hz"], ans: 1, why: "The first stage of UFLS is typically set just below the normal operating band, often around 49.0 - 49.2 Hz in 50Hz systems." }',
        'opts: ["Slower frequency decay", "Faster frequency decay (higher ROCOF)", "No change", "Higher voltage"], ans: 1 }': 'opts: ["Slower frequency decay", "Faster frequency decay (higher ROCOF)", "No change", "Higher voltage"], ans: 1, why: "Inertia acts as a shock absorber. Solar and wind are inverter-based resources with low physical inertia. If a disturbance occurs, the frequency changes much faster." }',
        'opts: ["CT saturation", "Nuisance trips from transient frequency dips", "Voltage sags", "Harmonic resonance"], ans: 1 }': 'opts: ["CT saturation", "Nuisance trips from transient frequency dips", "Voltage sags", "Harmonic resonance"], ans: 1, why: "Time delays (typically 0.1 to 0.3 seconds) ensure the relay doesn\'t trip incorrectly during temporary transient swings or switching events that briefly affect the measured frequency." }',
        'opts: ["V/I ratio", "Power imbalance and inertia constant H", "Transformer turns ratio", "CT burden"], ans: 1 }': 'opts: ["V/I ratio", "Power imbalance and inertia constant H", "Transformer turns ratio", "CT burden"], ans: 1, why: "The swing equation connects the rate of change of frequency (df/dt) directly to the accelerating power (imbalance) inversely divided by the system inertia constant (H)." }',
        'opts: ["Overcurrent coordination", "Automatic UFLS requirements", "Distance protection", "Transformer protection"], ans: 1 }': 'opts: ["Overcurrent coordination", "Automatic UFLS requirements", "Distance protection", "Transformer protection"], ans: 1, why: "NERC PRC-006 is the reliability standard that establishes requirements for automatic Underfrequency Load Shedding (UFLS) schemes in North America." }',
        'opts: ["Higher harmonics", "Reduced system inertia", "CT saturation", "Voltage regulation"], ans: 1 }': 'opts: ["Higher harmonics", "Reduced system inertia", "CT saturation", "Voltage regulation"], ans: 1, why: "As traditional heavy turbines (coal/gas) are replaced by inverter-based renewables, total grid inertia decreases, leading to dangerously fast frequency drops during faults." }',
        'opts: ["Frequency rise", "Rapid frequency decline", "Stable operation", "Voltage swell"], ans: 1 }': 'opts: ["Frequency rise", "Rapid frequency decline", "Stable operation", "Voltage swell"], ans: 1, why: "A 40% load deficit (more load than generation) combined with high inverter penetration (low inertia) guarantees a very rapid and steep decline in frequency." }',
        'opts: ["Motor protection", "Generator speed control failure / load rejection", "Cable overheating", "Busbar faults"], ans: 1 }': 'opts: ["Motor protection", "Generator speed control failure / load rejection", "Cable overheating", "Busbar faults"], ans: 1, why: "If a generator suddenly loses its load (breaker opens), the turbine can rapidly accelerate and over-speed, destroying the rotor if 81O doesn\'t quickly trip the unit." }'
    };

    for (const [key, val] of Object.entries(replacements)) {
        content = content.replace(key, val);
    }

    // Add rendering
    content = content.replace(
        '</button>))}\r\n                    </div>\r\n                </div>',
        '</button>))}\r\n                    </div>\r\n                    {selected !== null && q.why && (\r\n                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? \'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400\' : \'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400\'}`}>\r\n                            <strong>{selected === q.ans ? \'✅ Correct! \' : \'❌ Incorrect. \'}</strong>\r\n                            {q.why}\r\n                        </div>\r\n                    )}\r\n                </div>'
    );
     content = content.replace(
        '</button>))}</div>\n                </div>',
        '</button>))}</div>\n                    {selected !== null && q.why && (\n                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? \'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400\' : \'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400\'}`}>\n                            <strong>{selected === q.ans ? \'✅ Correct! \' : \'❌ Incorrect. \'}</strong>\n                            {q.why}\n                        </div>\n                    )}\n                </div>'
    );
    // Extra replacement patterns logic just in case the formatting is slightly different
    content = content.replace(
        '</button>))}</div>\r\n                </div>',
        '</button>))}</div>\r\n                    {selected !== null && q.why && (\r\n                        <div className={`mt-4 p-4 rounded-xl text-sm ${selected === q.ans ? \'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400\' : \'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400\'}`}>\r\n                            <strong>{selected === q.ans ? \'✅ Correct! \' : \'❌ Incorrect. \'}</strong>\r\n                            {q.why}\r\n                        </div>\r\n                    )}\r\n                </div>'
    );

    fs.writeFileSync(file, content);
    console.log('FrequencyProtection updated');
}

updateAutorecloserSim();
updateFrequencyProtection();
