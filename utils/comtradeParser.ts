export type Channel = {
    id: string;
    phase: string;
    component: string;
    unit: string;
    a: number;
    b: number;
    skew: number;
    min: number;
    max: number;
    primary: number;
    secondary: number;
    ps: string;
};

export type DigitalChannel = {
    id: string;
    phase: string;
    component: string;
    y: number;
};

export type ComtradeData = {
    stationCode: string;
    deviceId: string;
    revYear: string;
    analogChannels: Channel[];
    digitalChannels: DigitalChannel[];
    frequency: number;
    sampleRate: number;
    totalSamples: number;
    startDate: string;
    triggerDate: string;
    dataFormat: string;
    data: {
        timestamp: number; // in seconds
        analogs: number[];
        digitals: number[];
    }[];
};

export const parseComtrade = async (cfgFile: File, datFile: File): Promise<ComtradeData> => {
    const cfgText = await cfgFile.text();
    const lines = cfgText.split('\n').map(l => l.trim()).filter(l => l);
    
    // Line 1: station_name, rec_dev_id, rev_year
    const [stationCode, deviceId, revYear] = lines[0].split(',');
    
    // Line 2: TT, ##A, ##D
    const counts = lines[1].split(',');
    const totalChannels = parseInt(counts[0]);
    const numAnalogs = parseInt(counts[1].replace('A', ''));
    const numDigitals = parseInt(counts[2].replace('D', ''));

    const analogChannels: Channel[] = [];
    const digitalChannels: DigitalChannel[] = [];

    let lineIdx = 2;

    for (let i = 0; i < numAnalogs; i++) {
        const parts = lines[lineIdx++].split(',');
        analogChannels.push({
            id: parts[1], phase: parts[2], component: parts[3], unit: parts[4],
            a: parseFloat(parts[5]), b: parseFloat(parts[6]), skew: parseFloat(parts[7]),
            min: parseFloat(parts[8]), max: parseFloat(parts[9]),
            primary: parseFloat(parts[10]), secondary: parseFloat(parts[11]),
            ps: parts[12]
        });
    }

    for (let i = 0; i < numDigitals; i++) {
        const parts = lines[lineIdx++].split(',');
        digitalChannels.push({
            id: parts[1], phase: parts[2], component: parts[3], y: parseInt(parts[4])
        });
    }

    const frequency = parseFloat(lines[lineIdx++]);
    const nrates = parseInt(lines[lineIdx++]);
    let sampleRate = 0, totalSamples = 0;
    
    for (let i = 0; i < nrates; i++) {
        const [rate, endsamp] = lines[lineIdx++].split(',');
        if (i === 0) {
            sampleRate = parseFloat(rate);
            totalSamples = parseInt(endsamp);
        }
    }

    const startDate = lines[lineIdx++];
    const triggerDate = lines[lineIdx++];
    const dataFormat = lines[lineIdx++].toUpperCase(); // ASCII or BINARY
    
    const data = [];
    
    if (dataFormat === 'ASCII') {
        const datText = await datFile.text();
        const datLines = datText.split('\n').filter(l => l.trim());
        
        for (const line of datLines) {
            const vals = line.split(',').map(v => parseFloat(v));
            // Array format: [sampleNumber, timestamp, A1...An, D1...Dn]
            const timestamp = vals[1] / 1000000.0; // microseconds to seconds
            
            const analogs = [];
            for (let i = 0; i < numAnalogs; i++) {
                const raw = vals[2 + i];
                const ch = analogChannels[i];
                analogs.push((raw * ch.a) + ch.b);
            }
            
            const digitals = [];
            for (let i = 0; i < numDigitals; i++) {
                digitals.push(vals[2 + numAnalogs + i] || 0);
            }
            
            data.push({ timestamp, analogs, digitals });
        }
    } else {
        // BINARY format parsing
        const arrayBuffer = await datFile.arrayBuffer();
        const view = new DataView(arrayBuffer);
        let offset = 0;
        
        const bytesPerDigitalWord = 2; // 16 bits
        const numDigitalWords = Math.ceil(numDigitals / 16);
        const bytesPerSample = 4 + 4 + (numAnalogs * 2) + (numDigitalWords * bytesPerDigitalWord);
        
        while (offset + bytesPerSample <= view.byteLength) {
            const sampleNum = view.getUint32(offset, true); // Little endian
            offset += 4;
            const timestampMicro = view.getUint32(offset, true);
            offset += 4;
            const timestamp = timestampMicro / 1000000.0;
            
            const analogs = [];
            for (let i = 0; i < numAnalogs; i++) {
                const raw = view.getInt16(offset, true);
                offset += 2;
                const ch = analogChannels[i];
                analogs.push((raw * ch.a) + ch.b);
            }
            
            const digitals = [];
            for (let w = 0; w < numDigitalWords; w++) {
                const word = view.getUint16(offset, true);
                offset += 2;
                for (let b = 0; b < 16; b++) {
                    const idx = w * 16 + b;
                    if (idx < numDigitals) {
                        digitals.push((word >> b) & 1);
                    }
                }
            }
            
            data.push({ timestamp, analogs, digitals });
        }
    }

    return {
        stationCode, deviceId, revYear,
        analogChannels, digitalChannels,
        frequency, sampleRate, totalSamples,
        startDate, triggerDate, dataFormat,
        data
    };
};
