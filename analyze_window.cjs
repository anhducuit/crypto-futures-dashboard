
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

async function analyzeWindow() {
    console.log(`Analyzing window: ${new Date(VN_6AM).toISOString()} to ${new Date(VN_7AM).toISOString()}`);

    try {
        const klinesH = await fetchUrl(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&startTime=${VN_6AM - 3600000}&limit=5`);

        console.log('--- 1H KLINES ---');
        klinesH.forEach((k, i) => {
            const [time, open, high, low, close] = k.map(Number);
            const prevClose = i > 0 ? Number(klinesH[i - 1][4]) : open;
            const change = ((close - prevClose) / prevClose) * 100;
            console.log(`${new Date(time).toISOString()}: Close: ${close}, Change: ${change.toFixed(2)}%`);
        });

        const klinesM = await fetchUrl(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&startTime=${VN_6AM}&limit=60`);

        console.log('--- 1M KLINES (Notable Changes > 0.3%) ---');
        klinesM.forEach((k, i) => {
            const [time, open, high, low, close] = k.map(Number);
            const prevClose = i > 0 ? Number(klinesM[i - 1][4]) : open;
            const change = ((close - prevClose) / prevClose) * 100;
            if (Math.abs(change) > 0.3) {
                console.log(`${new Date(time).toISOString()}: ${change.toFixed(2)}%`);
            }
        });
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

analyzeWindow();
