
const https = require('https');

const VN_6AM = new Date('2026-01-19T06:00:00+07:00').getTime();
const VN_7AM = new Date('2026-01-19T07:00:00+07:00').getTime();

const thresholds = { '1m': 0.5, '15m': 1.0, '1h': 2.5, '4h': 4.5 };

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function calculateATRLocal(klines, i) {
    const prevKlines = klines.slice(Math.max(0, i - 20), i);
    if (prevKlines.length < 10) return 0;
    const trs = prevKlines.map((pk, idx) => {
        if (idx === 0) return 0;
        const h = Number(pk[2]);
        const l = Number(pk[3]);
        const pc = Number(prevKlines[idx - 1][4]);
        return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    });
    return trs.reduce((a, b) => a + b, 0) / trs.length;
}

async function simulate() {
    console.log('--- SIMULATING DETECTION ---');
    const klines = await fetchUrl(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&startTime=${VN_6AM - 3600000}&limit=200`);

    let detectedCount = 0;
    for (let i = 1; i < klines.length; i++) {
        const [time, open, high, low, close] = klines[i].map(Number);
        if (time < VN_6AM || time > VN_7AM) continue;

        const prevClose = Number(klines[i - 1][4]);
        const change = ((close - prevClose) / prevClose) * 100;
        const absChange = Math.abs(change);

        const atr = calculateATRLocal(klines, i);
        const candleRange = high - low;
        const candleBody = Math.abs(close - open);
        const isRelative = atr > 0 && (candleRange > atr * 3.5 || candleBody > atr * 2.5);
        const isStatic = absChange >= thresholds['1m'];

        if (isStatic || isRelative) {
            detectedCount++;
            console.log(`[DETECTED] ${new Date(time).toISOString()}: static=${isStatic}, relative=${isRelative} (Body/ATR: ${(candleBody / atr).toFixed(1)}x), Change: ${change.toFixed(2)}%`);
        }
    }
    console.log(`\nTotal Detected: ${detectedCount}`);
}

simulate();
