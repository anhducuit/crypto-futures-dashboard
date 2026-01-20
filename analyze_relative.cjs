
const https = require('https');

// Jan 19 2026 6AM VN = Jan 18 2026 23:00 UTC
const VN_6AM = new Date('2026-01-19T06:00:00+07:00').getTime();
const VN_7AM = new Date('2026-01-19T07:00:00+07:00').getTime();

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function calculateATR(klines, period = 14) {
    const trs = [];
    for (let i = 1; i < klines.length; i++) {
        const h = Number(klines[i][2]);
        const l = Number(klines[i][3]);
        const pc = Number(klines[i - 1][4]);
        const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
        trs.push(tr);
    }
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

async function analyzeWindowRelative() {
    console.log(`Analyzing window for RELATIVE anomalies: ${new Date(VN_6AM).toISOString()}`);

    try {
        // Fetch 500 candles before the window to get a stable ATR
        const klinesBase = await fetchUrl(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&endTime=${VN_6AM}&limit=100`);
        const atr = calculateATR(klinesBase);
        console.log(`Base ATR (1m): ${atr.toFixed(2)}`);

        const klinesWindow = await fetchUrl(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&startTime=${VN_6AM}&limit=60`);

        console.log('--- 1M KLINES (Relative to ATR) ---');
        klinesWindow.forEach((k, i) => {
            const [time, open, high, low, close] = k.map(Number);
            const range = high - low;
            const body = Math.abs(close - open);
            const relativeRange = range / atr;
            const relativeBody = body / atr;
            const changePercent = ((close - open) / open) * 100;

            if (relativeRange > 2.0 || relativeBody > 1.5) {
                console.log(`${new Date(time).toISOString()}: Range: ${range.toFixed(2)} (${relativeRange.toFixed(1)}x ATR), Body: ${body.toFixed(2)} (${relativeBody.toFixed(1)}x), Change: ${changePercent.toFixed(2)}%`);
            }
        });
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

analyzeWindowRelative();
