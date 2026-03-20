import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const DEFAULT_SYMBOLS = ['XAUUSDT', 'XAGUSDT', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];
const BACKFILL_START_TIME = new Date('2026-01-18T17:00:00Z').getTime(); // 00:00 Jan 19 VN
const TF_CONFIG = [
    { interval: '1m', limit: 500 },
    { interval: '15m', limit: 500 },
    { interval: '1h', limit: 500 },
    { interval: '4h', limit: 500 }
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* --- HELPER FUNCTIONS --- */

function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateSMAArray(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result; // Aligned with end of data
}

function calculateEMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

function calculateEMAArray(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
}

function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length <= period) return 0;
    const trs = [];
    for (let i = 1; i < closes.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trs.push(tr);
    }
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateIchimoku(highs: number[], lows: number[]) {
    const calculatePeak = (h: number[], l: number[], period: number) => {
        const sliceH = h.slice(-period);
        const sliceL = l.slice(-period);
        return (Math.max(...sliceH) + Math.min(...sliceL)) / 2;
    };

    const tenkan = calculatePeak(highs, lows, 9);
    const kijun = calculatePeak(highs, lows, 26);

    // Senkou Span A (at current candle, calculated 26 candles ago)
    const spanA_current = (calculatePeak(highs.slice(0, -26), lows.slice(0, -26), 9) + calculatePeak(highs.slice(0, -26), lows.slice(0, -26), 26)) / 2;

    // Senkou Span B (at current candle, calculated from 52 periods 26 candles ago)
    const spanB_current = calculatePeak(highs.slice(0, -26), lows.slice(0, -26), 52);

    return { tenkan, kijun, spanA: spanA_current, spanB: spanB_current };
}

function detectRSIDivergence(prices: number[], rsi: number[]) {
    // Basic peak/trough detection
    const isPeak = (arr: number[], i: number) => arr[i] > arr[i - 1] && arr[i] > arr[i + 1];
    const isTrough = (arr: number[], i: number) => arr[i] < arr[i - 1] && arr[i] < arr[i + 1];

    const findLastTwoPeaks = (arr: number[]) => {
        const peaks = [];
        for (let i = arr.length - 2; i > 1 && peaks.length < 2; i--) {
            if (isPeak(arr, i)) peaks.push({ val: arr[i], idx: i });
        }
        return peaks;
    };

    const findLastTwoTroughs = (arr: number[]) => {
        const troughs = [];
        for (let i = arr.length - 2; i > 1 && troughs.length < 2; i--) {
            if (isTrough(arr, i)) troughs.push({ val: arr[i], idx: i });
        }
        return troughs;
    };

    const pricePeaks = findLastTwoPeaks(prices);
    const rsiPeaks = findLastTwoPeaks(rsi);

    const priceTroughs = findLastTwoTroughs(prices);
    const rsiTroughs = findLastTwoTroughs(rsi);

    let result = 'NONE';

    // Bearish Divergence: Price higher peak, RSI lower peak
    if (pricePeaks.length === 2 && rsiPeaks.length === 2) {
        if (pricePeaks[0].val > pricePeaks[1].val && rsiPeaks[0].val < rsiPeaks[1].val) result = 'BEARISH';
    }

    // Bullish Divergence: Price lower trough, RSI higher trough
    if (priceTroughs.length === 2 && rsiTroughs.length === 2) {
        if (priceTroughs[0].val < priceTroughs[1].val && rsiTroughs[0].val > rsiTroughs[1].val) result = 'BULLISH';
    }

    return result; // Aligned with end of data
}

function calculatePivotPoints(high: number, low: number, close: number) {
    const pivot = (high + low + close) / 3;
    return {
        pivot,
        r1: (2 * pivot) - low,
        r2: pivot + (high - low),
        r3: high + 2 * (pivot - low),
        s1: (2 * pivot) - high,
        s2: pivot - (high - low),
        s3: low - 2 * (high - pivot)
    };
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length <= period * 2) return 0;

    const trs: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < closes.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trs.push(tr);

        const upMove = highs[i] - highs[i - 1];
        const downMove = lows[i - 1] - lows[i];

        if (upMove > downMove && upMove > 0) {
            plusDM.push(upMove);
        } else {
            plusDM.push(0);
        }

        if (downMove > upMove && downMove > 0) {
            minusDM.push(downMove);
        } else {
            minusDM.push(0);
        }
    }

    const smoothTR = [trs.slice(0, period).reduce((a, b) => a + b, 0)];
    const smoothPlusDM = [plusDM.slice(0, period).reduce((a, b) => a + b, 0)];
    const smoothMinusDM = [minusDM.slice(0, period).reduce((a, b) => a + b, 0)];

    for (let i = period; i < trs.length; i++) {
        smoothTR.push(smoothTR[smoothTR.length - 1] - (smoothTR[smoothTR.length - 1] / period) + trs[i]);
        smoothPlusDM.push(smoothPlusDM[smoothPlusDM.length - 1] - (smoothPlusDM[smoothPlusDM.length - 1] / period) + plusDM[i]);
        smoothMinusDM.push(smoothMinusDM[smoothMinusDM.length - 1] - (smoothMinusDM[smoothMinusDM.length - 1] / period) + minusDM[i]);
    }

    const dx: number[] = [];
    for (let i = 0; i < smoothTR.length; i++) {
        const plusDI = (smoothPlusDM[i] / smoothTR[i]) * 100;
        const minusDI = (smoothMinusDM[i] / smoothTR[i]) * 100;
        const diff = Math.abs(plusDI - minusDI);
        const sum = plusDI + minusDI;
        dx.push((diff / (sum || 1)) * 100);
    }

    const adx = dx.slice(-period).reduce((a, b) => a + b, 0) / period;
    return adx;
}

function calculateFibonacciLevels(high: number, low: number, direction: 'LONG' | 'SHORT'): Record<string, number> {
    const fibRatios = [0, 0.1, 0.382, 0.5, 0.559, 0.619, 0.667, 0.786, 0.882, 1];
    const range = high - low;

    const result: Record<string, number> = {};
    fibRatios.forEach(ratio => {
        const price = direction === 'LONG' 
            ? high - (range * ratio)
            : low + (range * ratio);
        result[ratio.toFixed(3)] = price;
    });
    return result;
}

function calculateTrendForTF(tf: string, ohlcv: OHLCV): 'LONG' | 'SHORT' {
    const { c: closes } = ohlcv;
    if (tf === '4h') {
        const sma50 = calculateSMA(closes, 50);
        const sma200 = calculateSMA(closes, 200);
        return sma50 > sma200 ? 'LONG' : 'SHORT';
    }
    if (tf === '1h') {
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);
        return sma20 > sma50 ? 'LONG' : 'SHORT';
    }
    if (tf === '15m') {
        const sma12 = calculateSMA(closes, 12);
        const sma26 = calculateSMA(closes, 26);
        return sma12 > sma26 ? 'LONG' : 'SHORT';
    }
    // 1m
    const sma20 = calculateSMA(closes, 20);
    const currentPrice = closes[closes.length - 1];
    const gap = ((currentPrice - sma20) / sma20) * 100;
    return gap >= 0 ? 'LONG' : 'SHORT';
}

function detectRecentSwing(highs: number[], lows: number[], period: number = 100) {
    const sliceH = highs.slice(-period);
    const sliceL = lows.slice(-period);
    return {
        high: Math.max(...sliceH),
        low: Math.min(...sliceL)
    };
}

function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2) {
    if (closes.length < period) return { middle: 0, upper: 0, lower: 0, width: 0 };
    
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    
    const variance = slice.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
    const sd = Math.sqrt(variance);
    
    const upper = middle + (stdDev * sd);
    const lower = middle - (stdDev * sd);
    const width = (upper - lower) / middle;
    
    return { middle, upper, lower, width };
}

function determineMarketRegime(adx: number, bbWidth: number, ema9: number, ema21: number) {
    if (adx >= 25) {
        return ema9 > ema21 ? "TREND_UP" : "TREND_DOWN";
    }
    if (bbWidth < 0.2) {
        return "SIDEWAY_SQUEEZE";
    }
    return "SIDEWAY_NORMAL";
}

function calculateHeikinAshi(opens: number[], highs: number[], lows: number[], closes: number[]) {
    const haOpens: number[] = [opens[0]];
    const haCloses: number[] = [(opens[0] + highs[0] + lows[0] + closes[0]) / 4];
    const haHighs: number[] = [highs[0]];
    const haLows: number[] = [lows[0]];

    for (let i = 1; i < opens.length; i++) {
        const haO = (haOpens[i - 1] + haCloses[i - 1]) / 2;
        const haC = (opens[i] + highs[i] + lows[i] + closes[i]) / 4;
        const haH = Math.max(highs[i], haO, haC);
        const haL = Math.min(lows[i], haO, haC);
        
        haOpens.push(haO);
        haCloses.push(haC);
        haHighs.push(haH);
        haLows.push(haL);
    }

    const lastIdx = haCloses.length - 1;
    return {
        open: haOpens[lastIdx],
        high: haHighs[lastIdx],
        low: haLows[lastIdx],
        close: haCloses[lastIdx],
        color: haCloses[lastIdx] >= haOpens[lastIdx] ? 'GREEN' : 'RED'
    };
}

function detectICTOrderBlock(highs: number[], lows: number[], closes: number[], opens: number[]) {
    const i = closes.length - 1;
    if (i < 5) return 'NONE';

    // Bullish OB: Last down candle before a displacement up
    // displacement = long green candle + breaking previous high
    const isDisplacementUp = closes[i] > opens[i] && (closes[i] - opens[i]) > (highs[i] - lows[i]) * 0.6 && closes[i] > Math.max(...highs.slice(i-4, i));
    
    if (isDisplacementUp) {
        // Find the last red candle
        for (let j = i - 1; j >= i - 3; j--) {
            if (closes[j] < opens[j]) return 'BULLISH';
        }
    }

    // Bearish OB: Last up candle before a displacement down
    const isDisplacementDown = closes[i] < opens[i] && (opens[i] - closes[i]) > (highs[i] - lows[i]) * 0.6 && closes[i] < Math.min(...lows.slice(i-4, i));
    
    if (isDisplacementDown) {
        for (let j = i - 1; j >= i - 3; j--) {
            if (closes[j] > opens[j]) return 'BEARISH';
        }
    }

    return 'NONE';
}


function detectPriceAction(opens: number[], highs: number[], lows: number[], closes: number[]) {
    const i = closes.length - 1; // Current candle
    const bodySize = Math.abs(closes[i] - opens[i]);
    const candleRange = highs[i] - lows[i];
    if (candleRange === 0) return { pinBar: 'NONE', engulfing: 'NONE' };
    const upperShadow = highs[i] - Math.max(opens[i], closes[i]);
    const lowerShadow = Math.min(opens[i], closes[i]) - lows[i];

    // 1. PIN BAR detection
    let pinBar = 'NONE';
    // Bullish Pin Bar: Small body, long lower shadow
    if (lowerShadow > bodySize * 2 && upperShadow < bodySize) pinBar = 'BULLISH';
    // Bearish Pin Bar: Small body, long upper shadow
    if (upperShadow > bodySize * 2 && lowerShadow < bodySize) pinBar = 'BEARISH';

    // 2. ENGULFING detection
    let engulfing = 'NONE';
    if (i > 0) {
        const prevBody = Math.abs(closes[i - 1] - opens[i - 1]);
        const currBody = Math.abs(closes[i] - opens[i]);
        if (currBody > prevBody) {
            if (closes[i] > opens[i] && closes[i - 1] < opens[i - 1] && closes[i] > opens[i - 1] && opens[i] < closes[i - 1]) engulfing = 'BULLISH';
            if (closes[i] < opens[i] && closes[i - 1] > opens[i - 1] && closes[i] < opens[i - 1] && opens[i] > closes[i - 1]) engulfing = 'BEARISH';
        }
    }

    return { pinBar, engulfing };
}

/* --- 6 COMBO STRATEGY LOGIC --- */

interface ComboSignal {
    combo: number;
    direction: 'LONG' | 'SHORT';
    risk: number;
    rr: number;
    reason: string;
    score: number; // 0-100 suitability score
}

interface OHLCV {
    o: number[];
    h: number[];
    l: number[];
    c: number[];
    v: number[];
}

interface SymbolData {
    symbol: string;
    m1: OHLCV;
    m15: OHLCV;
    h1: OHLCV;
    h4: OHLCV;
    regime: string;
    utcHour: number;
    utcMinute: number;
}

// COMBO 1: REVERSAL (Bắt Đỉnh Đáy)
function checkCombo1(ohlcv: OHLCV, regime: string): ComboSignal | null {
    if (regime !== "SIDEWAY_NORMAL") return null;
    const { c, h, l, o, v } = ohlcv;
    const rsi = calculateRSI(c);
    const vol = v[v.length - 1];
    const volMA = calculateSMA(v, 20);
    const pa = detectPriceAction(o, h, l, c);
    const rsis = c.map((_, idx) => calculateRSI(c.slice(0, idx + 1)));
    const div = detectRSIDivergence(c, rsis);

    let score = 0;
    let direction: 'LONG' | 'SHORT' | null = null;

    // LONG Criteria
    if (rsi < 40) {
        score += rsi < 30 ? 40 : 20;
        if (div === 'BULLISH') score += 30;
        if (pa.pinBar === 'BULLISH') score += 20;
        if (vol > volMA * 1.5) score += 10;
        direction = 'LONG';
    } 
    // SHORT Criteria
    else if (rsi > 60) {
        score += rsi > 70 ? 40 : 20;
        if (div === 'BEARISH') score += 30;
        if (pa.pinBar === 'BEARISH') score += 20;
        if (vol > volMA * 1.5) score += 10;
        direction = 'SHORT';
    }

    if (score >= 30 && direction) {
        return { combo: 1, direction, risk: 0.01, rr: 2, reason: `C1: Reversal ${direction} (Score: ${score})`, score };
    }
    return null;
}

// COMBO 2: TREND (Đi Theo Xu Hướng)
function checkCombo2(ohlcv: OHLCV, higherOHLCV: OHLCV, regime: string): ComboSignal | null {
    if (!regime.startsWith("TREND")) return null;
    const { c: c1, h: h1, l: l1 } = ohlcv;
    const { h: h4, l: h4l } = higherOHLCV;

    const adx = calculateADX(h1, l1, c1);
    const ichiH1 = calculateIchimoku(h1, l1);
    const ichiH4 = calculateIchimoku(h4, h4l);
    const ema9 = calculateEMA(c1, 9);
    const ema21 = calculateEMA(c1, 21);
    const price = c1[c1.length - 1];

    let score = 0;
    let direction: 'LONG' | 'SHORT' | null = null;

    const aboveCloud1 = price > ichiH1.spanA && price > ichiH1.spanB;
    const aboveCloud4 = price > ichiH4.spanA && price > ichiH4.spanB;
    const belowCloud1 = price < ichiH1.spanA && price < ichiH1.spanB;
    const belowCloud4 = price < ichiH4.spanA && price < ichiH4.spanB;

    if (ema9 > ema21 && adx > 20) {
        score += adx > 30 ? 40 : 20;
        if (aboveCloud1) score += 20;
        if (aboveCloud4) score += 20;
        if (ema9 > ema21 * 1.002) score += 10;
        direction = 'LONG';
    } 
    else if (ema9 < ema21 && adx > 20) {
        score += adx > 30 ? 40 : 20;
        if (belowCloud1) score += 20;
        if (belowCloud4) score += 20;
        if (ema9 < ema21 * 0.998) score += 10;
        direction = 'SHORT';
    }

    if (score >= 30 && direction) {
        return { combo: 2, direction, risk: 0.03, rr: 3, reason: `C2: Trend ${direction} (Score: ${score})`, score };
    }
    return null;
}

// COMBO 3: FAKEOUT (Phá Vỡ Giả)
function checkCombo3(ohlcv: OHLCV, regime: string): ComboSignal | null {
    if (regime !== "SIDEWAY_NORMAL") return null;
    const { c, h, l, o, v } = ohlcv;
    
    const vol = v[v.length - 1];
    const volMA = calculateSMA(v, 20);
    const recentHigh = Math.max(...h.slice(-21, -1));
    const recentLow = Math.min(...l.slice(-21, -1));
    const prevHigh = h[h.length - 2];
    const prevLow = l[l.length - 2];
    const price = c[c.length - 1];
    const pa = detectPriceAction(o, h, l, c);

    let score = 0;
    let direction: 'LONG' | 'SHORT' | null = null;

    // SHORT Fakeout: price broke high then returned below
    if (prevHigh > recentHigh && price < recentHigh) {
        score += 40; // Base fakeout
        if (pa.pinBar === 'BEARISH') score += 30;
        if (vol > volMA * 1.5) score += 30;
        direction = 'SHORT';
    } 
    // LONG Fakeout: price broke low then returned above
    else if (prevLow < recentLow && price > recentLow) {
        score += 40; // Base fakeout
        if (pa.pinBar === 'BULLISH') score += 30;
        if (vol > volMA * 1.5) score += 30;
        direction = 'LONG';
    }

    if (score >= 30 && direction) {
        return { combo: 3, direction, risk: 0.01, rr: 1.5, reason: `C3: Fakeout ${direction} (Score: ${score})`, score };
    }
    return null;
}

// COMBO 4: MOMENTUM (Nổ Lệnh)
function checkCombo4(ohlcv: OHLCV, regime: string): ComboSignal | null {
    if (regime !== "SIDEWAY_SQUEEZE") return null;
    const { c, h, l, o, v } = ohlcv;

    const bb = calculateBollingerBands(c);
    const ema9 = calculateEMA(c, 9);
    const ema21 = calculateEMA(c, 21);
    const ema50 = calculateEMA(c, 50);
    const price = c[c.length - 1];
    const spread = Math.max(ema9, ema21, ema50) - Math.min(ema9, ema21, ema50);
    
    const vol = v[v.length - 1];
    const volMA = calculateSMA(v, 20);
    const isMarubozu = detectMarubozu(o[o.length - 1], h[h.length - 1], l[l.length - 1], c[c.length - 1]);

    let score = 0;
    let direction: 'LONG' | 'SHORT' | null = null;

    if (isMarubozu && vol > volMA * 1.5) {
        score += 40; // Base momentum
        if (vol > volMA * 2.5) score += 30;
        if (spread / price < 0.005) score += 20; // Tight squeeze
        if (bb.width < 0.1) score += 10;
        
        direction = price > o[o.length - 1] ? 'LONG' : 'SHORT';
    }

    if (score >= 30 && direction) {
        return { combo: 4, direction, risk: 0.02, rr: 2, reason: `C4: Momentum ${direction} (Score: ${score})`, score };
    }
    return null;
}

// COMBO 5: TRAILING STOP HELPER (Dùng cho quản lý lệnh)
function getCombo5TrailingLevel(o: number[], h: number[], l: number[], c: number[], direction: 'LONG' | 'SHORT') {
    const res = calculateChandelierExitHeikinAshi(o, h, l, c, 1, 1.85);
    if (!res) return null;
    return direction === 'LONG' ? res.highestHigh - (res.atr * 1.85) : res.lowestLow + (res.atr * 1.85);
}

// COMBO 6: ICT (Quét Thanh Khoản Á)
function checkCombo6(ohlcv: OHLCV, sourceData: SymbolData): ComboSignal | null {
    const killzone = getICTKillzone(sourceData.utcHour, sourceData.utcMinute);
    if (!killzone.isActive) return null;

    const { c, h, l, o } = ohlcv;
    // Asia session pivots are normally judged on M15 regardless of entry TF
    const pivots = getAsiaSessionPivots(sourceData.m15.c.map((val, idx) => [0, sourceData.m15.o[idx], sourceData.m15.h[idx], sourceData.m15.l[idx], val]));

    const price = c[c.length - 1];
    const ob = detectICTOrderBlock(h, l, c, o);

    let score = 0;
    let direction: 'LONG' | 'SHORT' | null = null;

    if (price < pivots.asiaLow) {
        score += 40; // Sweep asia low
        if (ob === 'BULLISH') score += 40;
        if (killzone.name === 'NY AM' || killzone.name === 'London') score += 20;
        direction = 'LONG';
    } 
    else if (price > pivots.asiaHigh) {
        score += 40; // Sweep asia high
        if (ob === 'BEARISH') score += 40;
        if (killzone.name === 'NY AM' || killzone.name === 'London') score += 20;
        direction = 'SHORT';
    }

    if (score >= 30 && direction) {
        return { combo: 6, direction, risk: 0.01, rr: 2, reason: `C6: ICT ${direction} Sweep (Score: ${score})`, score };
    }
    return null;
}

function evaluateFiboFiringLogic(signals: ComboSignal[]): ComboSignal | null {
    if (signals.length === 0) return null;
    
    // Sort signals by score descending
    const sorted = [...signals].sort((a, b) => b.score - a.score);
    const n = sorted.length;
    const scores = sorted.map(s => s.score);
    const sum = scores.reduce((a, b) => a + b, 0);

    // RULE 1: 1 Combo >= 70
    if (n >= 1 && scores[0] >= 70) return sorted[0];

    // RULE 2: 2 Combos, both >= 40, sum >= 80
    if (n >= 2 && scores[0] >= 40 && scores[1] >= 40 && (scores[0] + scores[1]) >= 80) {
        const best = sorted[0];
        best.reason = `N=2 Alignment: ${sorted[0].reason} + ${sorted[1].reason} (Total: ${scores[0] + scores[1]})`;
        return best;
    }

    // RULE 3: 3 Combos, all >= 30, sum >= 90
    if (n >= 3 && scores[0] >= 30 && scores[1] >= 30 && scores[2] >= 30 && sum >= 90) {
        const best = sorted[0];
        best.reason = `N=3 Alignment: ${sorted[0].reason} + ${sorted[1].reason} + ${sorted[2].reason} (Total: ${sum})`;
        return best;
    }

    // N >= 4: Ignored/Blocked as per user request to avoid noise
    return null;
}


function checkKeySRLevels(price: number, high: number[], low: number[]) {
    // Basic pivot check from last 50 candles
    const h = Math.max(...high.slice(-50));
    const l = Math.min(...low.slice(-50));
    const range = h - l;
    const threshold = range * 0.05; // 5% of range buffer
    return (Math.abs(price - h) < threshold) || (Math.abs(price - l) < threshold);
}

function detectMarubozu(open: number, high: number, low: number, close: number) {
    const bodySize = Math.abs(close - open);
    const candleRange = high - low;
    if (candleRange === 0) return false;
    // Body is > 90% of the whole range
    return (bodySize / candleRange) > 0.9;
}

function checkEMASqueeze(closes: number[]) {
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes.slice(-200), 200);
    if (!ema20 || !ema50 || !ema200) return false;

    const max = Math.max(ema20, ema50, ema200);
    const min = Math.min(ema20, ema50, ema200);
    const spread = (max - min) / min;
    return spread < 0.005; // 0.5% squeeze
}

function calculateChandelierExitHeikinAshi(
    opens: number[], highs: number[], lows: number[], closes: number[], 
    period: number = 1, multiplier: number = 1.85
) {
    if (closes.length < period + 1) return null;

    // 1. Calculate Heikin Ashi
    const haOpens: number[] = [];
    const haHighs: number[] = [];
    const haLows: number[] = [];
    const haCloses: number[] = [];

    // First HA candle
    haOpens.push(opens[0]);
    haCloses.push((opens[0] + highs[0] + lows[0] + closes[0]) / 4);
    haHighs.push(highs[0]);
    haLows.push(lows[0]);

    for (let i = 1; i < opens.length; i++) {
        const haO = (haOpens[i - 1] + haCloses[i - 1]) / 2;
        const haC = (opens[i] + highs[i] + lows[i] + closes[i]) / 4;
        const haH = Math.max(highs[i], haO, haC);
        const haL = Math.min(lows[i], haO, haC);
        
        haOpens.push(haO);
        haCloses.push(haC);
        haHighs.push(haH);
        haLows.push(haL);
    }

    // 2. Calculate RMA-based ATR over HA candles
    const trs: number[] = [haHighs[0] - haLows[0]]; 
    for (let i = 1; i < haCloses.length; i++) {
        const tr = Math.max(
            haHighs[i] - haLows[i],
            Math.abs(haHighs[i] - haCloses[i - 1]),
            Math.abs(haLows[i] - haCloses[i - 1])
        );
        trs.push(tr);
    }

    const alpha = 1 / period;
    const rmas: number[] = [trs[0]];
    for (let i = 1; i < trs.length; i++) {
        const rma = (alpha * trs[i]) + ((1 - alpha) * rmas[i - 1]);
        rmas.push(rma);
    }

    // 3. Calculate Chandelier Exit
    const longStops: number[] = [];
    const shortStops: number[] = [];
    const dirs: number[] = [];

    for (let i = 0; i < haCloses.length; i++) {
        const atrValue = rmas[i] * multiplier;
        
        const lookbackStart = Math.max(0, i - period + 1);
        let highest = -Infinity;
        let lowest = Infinity;
        for (let j = lookbackStart; j <= i; j++) {
            if (haHighs[j] > highest) highest = haHighs[j];
            if (haLows[j] < lowest) lowest = haLows[j];
        }

        let longStop = highest - atrValue;
        let shortStop = lowest + atrValue;

        if (i > 0) {
            const prevLongStop = longStops[i - 1];
            const prevShortStop = shortStops[i - 1];
            const prevClose = haCloses[i - 1];

            // Trailing Ratchet: longStop only moves up, shortStop only moves down
            if (prevClose > prevLongStop) {
                longStop = Math.max(longStop, prevLongStop);
            }
            if (prevClose < prevShortStop) {
                shortStop = Math.min(shortStop, prevShortStop);
            }
        }
        
        longStops.push(longStop);
        shortStops.push(shortStop);

        // Calculate direction
        if (i === 0) {
            dirs.push(1);
        } else {
            const prevShortStop = shortStops[i - 1];
            const prevLongStop = longStops[i - 1];
            const currClose = haCloses[i];
            
            let dir = dirs[i - 1];
            if (currClose > prevShortStop) dir = 1;
            else if (currClose < prevLongStop) dir = -1;
            
            dirs.push(dir);
        }
    }

    const currentIdx = haCloses.length - 1;
    const currentDir = dirs[currentIdx];
    const prevDir = dirs[currentIdx - 1];

    const buySignal = currentDir === 1 && prevDir === -1;
    const sellSignal = currentDir === -1 && prevDir === 1;

    return {
        exitLong: longStops[currentIdx],
        exitShort: shortStops[currentIdx],
        dir: currentDir,
        buySignal,
        sellSignal,
        atr: rmas[currentIdx],
        highestHigh: haHighs[currentIdx],
        lowestLow: haLows[currentIdx],
        trend: currentDir === 1 ? 'BULLISH' : 'BEARISH'
    };
}

// --- ICT KILLZONES + PIVOTS ---
interface ICTKillzoneInfo {
    name: string;
    emoji: string;
    isActive: boolean;
    canTrade: boolean; // Only London & NY AM are trade zones
}

function getICTKillzone(utcHour: number, utcMinute: number): ICTKillzoneInfo {
    // All times in New York (ET = UTC-5, EDT = UTC-4)
    // We use UTC and convert: NY = UTC - 5 (standard) or UTC - 4 (DST)
    // For simplicity, we use UTC directly and define killzones in UTC:
    // Asia:     01:00-05:00 UTC  (20:00-00:00 NY EST)
    // London:   07:00-10:00 UTC  (02:00-05:00 NY EST)
    // NY AM:    14:30-16:00 UTC  (09:30-11:00 NY EST)
    // NY Lunch: 17:00-18:00 UTC  (12:00-13:00 NY EST)
    // NY PM:    18:30-21:00 UTC  (13:30-16:00 NY EST)
    const t = utcHour * 60 + utcMinute;

    if (t >= 60 && t < 300) return { name: 'Asia', emoji: '🔵', isActive: true, canTrade: false };
    if (t >= 420 && t < 600) return { name: 'London', emoji: '🔴', isActive: true, canTrade: true };
    if (t >= 870 && t < 960) return { name: 'NY AM', emoji: '🟢', isActive: true, canTrade: true };
    if (t >= 1020 && t < 1080) return { name: 'NY Lunch', emoji: '🟡', isActive: true, canTrade: false };
    if (t >= 1110 && t < 1260) return { name: 'NY PM', emoji: '🟣', isActive: true, canTrade: false };
    return { name: 'Off-Session', emoji: '⚪', isActive: false, canTrade: false };
}

interface AsiaSessionPivots {
    asiaHigh: number;
    asiaLow: number;
    asiaRange: number;
    found: boolean;
}

function getAsiaSessionPivots(klines15m: any[]): AsiaSessionPivots {
    // Find Asia session (01:00-05:00 UTC) candles from the last 24h of 15m data
    // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let asiaHigh = -Infinity;
    let asiaLow = Infinity;
    let found = false;

    for (const k of klines15m) {
        const openTime = typeof k[0] === 'number' ? k[0] : parseInt(k[0]);
        if (openTime < oneDayAgo) continue;

        const d = new Date(openTime);
        const utcH = d.getUTCHours();

        // Asia session: 01:00-05:00 UTC
        if (utcH >= 1 && utcH < 5) {
            const h = parseFloat(k[2]);
            const l = parseFloat(k[3]);
            if (h > asiaHigh) asiaHigh = h;
            if (l < asiaLow) asiaLow = l;
            found = true;
        }
    }

    return {
        asiaHigh: found ? asiaHigh : 0,
        asiaLow: found ? asiaLow : 0,
        asiaRange: found ? asiaHigh - asiaLow : 0,
        found
    };
}

interface ICTSignal {
    type: 'LONG' | 'SHORT';
    reason: string;
}

function detectICTSignal(
    pivots: AsiaSessionPivots,
    klines15m: any[],
    rsi: number,
    volRatio: number
): ICTSignal | null {
    if (!pivots.found || pivots.asiaRange <= 0) return null;

    // Need at least 3 candles to detect sweep + rejection
    if (klines15m.length < 3) return null;

    const curr = klines15m[klines15m.length - 1];
    const prev = klines15m[klines15m.length - 2];

    const currHigh = parseFloat(curr[2]);
    const currLow = parseFloat(curr[3]);
    const currClose = parseFloat(curr[4]);
    const prevHigh = parseFloat(prev[2]);
    const prevLow = parseFloat(prev[3]);

    // Sweep Asia Low + Rejection = LONG
    // Pattern: prev candle swept below Asia Low, current candle closed back above
    const sweptAsiaLow = prevLow < pivots.asiaLow || currLow < pivots.asiaLow;
    const rejectedAbove = currClose > pivots.asiaLow;
    if (sweptAsiaLow && rejectedAbove && rsi < 45 && volRatio > 1.2) {
        return { type: 'LONG', reason: 'Sweep Asia Low + Rejection' };
    }

    // Sweep Asia High + Rejection = SHORT
    // Pattern: prev candle swept above Asia High, current candle closed back below
    const sweptAsiaHigh = prevHigh > pivots.asiaHigh || currHigh > pivots.asiaHigh;
    const rejectedBelow = currClose < pivots.asiaHigh;
    if (sweptAsiaHigh && rejectedBelow && rsi > 55 && volRatio > 1.2) {
        return { type: 'SHORT', reason: 'Sweep Asia High + Rejection' };
    }

    return null;
}


function calculateDynamicTPSL(
    entryPrice: number,
    signal: 'LONG' | 'SHORT',
    swingHigh: number,
    swingLow: number,
    atr: number = 0,
    timeframe: string = '15m'
) {
    const range = (swingHigh && swingLow) ? (swingHigh - swingLow) : 0;

    // Default fallback if range is too small or invalid
    if (range === 0 || isNaN(range) || range / entryPrice < 0.001) {
        const baseRisk = timeframe === '1m' ? 0.008 : 0.006; // 0.8% for 1m, 0.6% others
        const baseReward = baseRisk * 1.5;
        return {
            target: signal === 'LONG' ? entryPrice * (1 + baseReward) : entryPrice * (1 - baseReward),
            stopLoss: signal === 'LONG' ? entryPrice * (1 - baseRisk) : entryPrice * (1 + baseRisk)
        }
    }

    const rrMap: Record<string, number> = {
        '1m': 1.5,
        '15m': 2.0,
        '1h': 2.5,
        '4h': 3.0
    };
    const targetRR = rrMap[timeframe] || 2.0;

    let target, stopLoss;
    // ATR Multiplier optimized by Timeframe - Widened for H1/H4 per user request
    const atrMultiplier = timeframe === '4h' ? 5.0 : (timeframe === '1h' ? 4.2 : 3.0);
    const volatilityBuffer = atr > 0 ? (atr * atrMultiplier) : (range * 0.5);

    if (signal === 'LONG') {
        stopLoss = entryPrice - volatilityBuffer;
        const riskDist = entryPrice - stopLoss;
        target = entryPrice + (riskDist * targetRR);

        // Hard limits for safety
        const maxSL = 0.06; 
        const minSL = timeframe === '4h' ? 0.035 : (timeframe === '1h' ? 0.022 : 0.015); 

        const currentSLPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 - minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 - maxSL);

        // Re-calculate target based on actual SL to maintain R:R
        const finalRiskDist = entryPrice - stopLoss;
        target = entryPrice + (finalRiskDist * targetRR);
    } else {
        stopLoss = entryPrice + volatilityBuffer;
        const riskDist = stopLoss - entryPrice;
        target = entryPrice - (riskDist * targetRR);

        const maxSL = 0.06;
        const minSL = timeframe === '4h' ? 0.035 : (timeframe === '1h' ? 0.022 : 0.015);

        const currentSLPercent = Math.abs(stopLoss - entryPrice) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 + minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 + maxSL);

        const finalRiskDist = stopLoss - entryPrice;
        target = entryPrice - (finalRiskDist * targetRR);
    }

    // DYNAMIC ROUNDING based on price
    const getDecimals = (p: number) => {
        if (p < 1) return 6;
        if (p < 10) return 4;
        return 2;
    };
    const dEntry = getDecimals(entryPrice);
    const dTarget = getDecimals(target);
    const dSL = getDecimals(stopLoss);

    return {
        target: parseFloat(target.toFixed(dTarget)),
        stopLoss: parseFloat(stopLoss.toFixed(dSL))
    };
}

/**
 * SMART NOISE FILTER
 * Chống nhiễu, chống spam, xử lý xung đột hướng lệnh và AI Memory
 */
async function applySmartNoiseFilter(supabase: any, symbol: string, currentSignal: any): Promise<{ allowed: boolean, reason?: string, action?: string, oppositeTrades?: any[] }> {
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch recent history for this symbol (last 24 hours for deeper memory)
    const { data: recentHistory } = await supabase
        .from('trading_history')
        .select('id, signal, timeframe, strategy_name, created_at, status, price_at_signal, telegram_message_id')
        .eq('symbol', symbol)
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

    if (!recentHistory || recentHistory.length === 0) return { allowed: true };

    // Tín hiệu ưu tiên cao có quyền phá vỡ quy tắc xung đột hướng
    const highPriorityKeywords = [
        'VOL BREAKOUT',
        'REVERSAL OVERBOUGHT',
        'REVERSAL OVERSOLD',
        'MOMENTUM BREAKOUT'
    ];

    const isHighPriority = highPriorityKeywords.some(keyword => currentSignal.name.includes(keyword));

    const oppositePendingTrades = [];

    for (const trade of recentHistory) {
        const tradeTime = new Date(trade.created_at).getTime();
        const isWithin30Mins = (now.getTime() - tradeTime) < (30 * 60 * 1000);

        // A. CHỐNG SPAM (Cùng hướng trong 1 giờ cho cùng chiến lược)
        const isSameStrategy = trade.strategy_name === currentSignal.name;
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).getTime();
        if (isSameStrategy && trade.signal === currentSignal.type && tradeTime > oneHourAgo) {
            return { allowed: false, reason: `Spam: Chiến lược ${currentSignal.name} (cùng hướng) vừa nổ trong 60p qua` };
        }

        // B. CHỐNG LẶP LẠI (Cùng hướng bất kể chiến lược trong 30p)
        if (trade.signal === currentSignal.type && isWithin30Mins) {
            return { allowed: false, reason: `Spam: Hướng ${trade.signal} vừa nổ trong 30p qua` };
        }

        // C. PHÁT HIỆN XUNG ĐỘT / ĐẢO CHIỀU (Ngược hướng và đang PENDING)
        if (trade.signal !== currentSignal.type && trade.status === 'PENDING') {
            oppositePendingTrades.push(trade);
        }

        // D. KÝ ỨC AI 5 LỚP (Tránh tái phạm sai lầm quá khứ gần)
        if (trade.status === 'FAILED' && isSameStrategy && trade.signal === currentSignal.type) {
            const entryPrice = currentSignal.ref.close;
            const priceDiff = Math.abs(trade.price_at_signal - entryPrice) / entryPrice;
            if (priceDiff < 0.005) { // Dưới 0.5% chênh lệch giá so với lệnh thua cũ
                return { 
                    allowed: false, 
                    reason: `AI 5-Layer Memory: Vừa bị Stop Loss lệnh ${trade.signal} (#${trade.strategy_name}) tại vùng giá $${trade.price_at_signal}. Chặn tín hiệu để tránh bẫy giá lặp lại!` 
                };
            }
        }
    }

    if (oppositePendingTrades.length > 0) {
        return { allowed: true, action: 'REVERSAL', oppositeTrades: oppositePendingTrades };
    }

    return { allowed: true };
}

async function sendTelegram(message: string, replyToId?: number, chatIds?: (string | number)[]) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const ownerChatId = Deno.env.get('TELEGRAM_CHAT_ID');

    // Ensure we have a valid list of targets
    let targets = (chatIds && chatIds.length > 0) ? [...chatIds] : (ownerChatId ? [ownerChatId] : []);
    // Remove duplicates and ensure strings
    targets = Array.from(new Set(targets.map(id => String(id))));


    if (targets.length === 0) return { ok: false, error: 'No recipients' };

    const results = await Promise.all(targets.map(async (chatId) => {
        try {
            const body: any = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            };

            // Only apply reply_to_message_id for the ownerChatId 
            // because we only store ONE message_id in DB (the owner's)
            if (replyToId && String(chatId) === String(ownerChatId)) {
                body.reply_to_message_id = replyToId;
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            // FAIL-SAFE: If reply fails (usually "message not found"), retry as a new message
            if (!data.ok && data.description?.includes('message to be replied not found')) {
                console.warn(`Reply failed for ${chatId}, retrying without reply_to_message_id`);
                delete body.reply_to_message_id;
                const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                return await retryRes.json();
            }

            return data;
        } catch (e: any) {
            console.error(`sendTelegram Error for ${chatId}:`, e.message);
            return { ok: false };
        }
    }));

    // Prioritize returning the owner's result so we save the correct message_id for future replies
    const ownerIndex = targets.findIndex(id => String(id) === String(ownerChatId));
    if (ownerIndex !== -1 && results[ownerIndex]?.ok) {
        return results[ownerIndex];
    }

    return results[0] || { ok: false };
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        const now = new Date();
        console.log(`[${now.toISOString()}] BOT SCAN START - Action: ${action || 'none'} - Method: ${req.method}`);

        if (action === 'get-calendar') {
            try {
                const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Failed to fetch calendar' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        if (action === 'reset') {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            // Get counts before
            const { count: hBefore } = await supabase.from('trading_history').select('*', { count: 'exact', head: true });
            const { count: aBefore } = await supabase.from('market_anomalies').select('*', { count: 'exact', head: true });

            // Force delete all
            await Promise.all([
                supabase.from('trading_history').delete().gte('created_at', '2020-01-01'),
                supabase.from('market_anomalies').delete().gte('created_at', '2020-01-01')
            ]);

            // Get counts after
            const { count: hAfter } = await supabase.from('trading_history').select('*', { count: 'exact', head: true });

            return new Response(JSON.stringify({
                success: true,
                message: "All trading data has been cleared.",
                details: {
                    trading_history: { before: hBefore, after: hAfter },
                    market_anomalies: { before: aBefore }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'cleanup-m5') {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { count: hBefore } = await supabase.from('trading_history').select('*', { count: 'exact', head: true }).eq('timeframe', '5m');
            const { count: aBefore } = await supabase.from('market_anomalies').select('*', { count: 'exact', head: true }).eq('timeframe', '5m');

            const { error: hErr } = await supabase.from('trading_history').delete().eq('timeframe', '5m');
            const { error: aErr } = await supabase.from('market_anomalies').delete().eq('timeframe', '5m');

            if (hErr || aErr) {
                return new Response(JSON.stringify({ success: false, error: hErr?.message || aErr?.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({
                success: true,
                message: "All 5-minute data has been cleared.",
                details: {
                    trading_history: { deleted: hBefore },
                    market_anomalies: { deleted: aBefore }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        if (action === 'test') {
            const results: any[] = [];
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data: settings } = await supabase.from('bot_settings').select('value').eq('key', 'target_symbols').single();
            const SYMBOLS_SCAN_FOR_SUMMARY = settings?.value || DEFAULT_SYMBOLS;

            for (const symbol of SYMBOLS_SCAN_FOR_SUMMARY) {
                const analyses: any = {};
                try {
                    for (const cfg of TF_CONFIG) {
                        const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`);
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            const closes = data.map((x: any) => parseFloat(x[4]));
                            const highs = data.map((x: any) => parseFloat(x[2]));
                            const lows = data.map((x: any) => parseFloat(x[3]));

                            if (cfg.interval === '1m') {
                                const ma7Array = calculateSMAArray(closes, 7);
                                const ma25Array = calculateSMAArray(closes, 25);
                                const ma7_curr = ma7Array[ma7Array.length - 1];
                                const ma25_curr = ma25Array[ma25Array.length - 1];
                                const ma7_prev = ma7Array[ma7Array.length - 2];
                                const ma25_prev = ma25Array[ma25Array.length - 2];

                                let cross = 'NONE';
                                if (ma7_prev <= ma25_prev && ma7_curr > ma25_curr) cross = 'BULLISH_CROSS';
                                if (ma7_prev >= ma25_prev && ma7_curr < ma25_curr) cross = 'BEARISH_CROSS';

                                analyses['1m'] = {
                                    close: closes[closes.length - 1],
                                    rsi: calculateRSI(closes),
                                    sma20: calculateSMA(closes, 20),
                                    swingHigh: Math.max(...highs),
                                    swingLow: Math.min(...lows),
                                    cross
                                };
                            } else if (cfg.interval === '1h') {
                                const ema20 = calculateEMA(closes, 20);
                                const ema50 = calculateEMA(closes, 50);
                                analyses['1h'] = {
                                    ema20, ema50,
                                    trend: ema20 > ema50 ? 'BULLISH' : 'BEARISH'
                                };
                            }
                        }
                    }

                    let signal = null;
                    let reason = "NO_SIGNAL";

                    if (analyses['1h'] && analyses['1m']) {
                        const h1 = analyses['1h'];
                        const m1 = analyses['1m'];

                        // Strategy Logic: MA7/MA25 Cross OR EMA Bounce (Trend Continuation)
                        if (h1.trend === 'BULLISH') {
                            if (m1.cross === 'BULLISH_CROSS') {
                                if (m1.rsi < 85) signal = 'LONG';
                                else reason = `RSI_TOO_HIGH (${m1.rsi.toFixed(1)})`;
                            }
                            // TREND CONTINUATION: Price pulls back to MA25 and bounces up
                            else if (m1.close > m1.sma20 && m1.rsi < 60) {
                                // Add a pseudo-signal for trend following if already in trend
                                // signal = 'LONG'; reason = 'TREND_FOLLOWING';
                            }
                            else reason = `WAITING_FOR_SETUP (Last: ${m1.cross})`;
                        } else if (h1.trend === 'BEARISH') {
                            if (m1.cross === 'BEARISH_CROSS') {
                                if (m1.rsi > 15) signal = 'SHORT';
                                else reason = `RSI_TOO_LOW (${m1.rsi.toFixed(1)})`;
                            }
                            else reason = `WAITING_FOR_SETUP (Last: ${m1.cross})`;
                        }
                    }

                    results.push({ symbol, signal, reason, analyses });
                } catch (e) {
                    results.push({ symbol, error: e.message });
                }
            }

            // Test Telegram directly
            const token = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
            const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '';
            const tokenDebug = token ? `${token.slice(0, 5)}...${token.slice(-5)}` : 'MISSING';
            const chatDebug = chatId ? `${chatId.slice(0, 3)}...` : 'MISSING';

            const testTele = await sendTelegram(`🔔 <b>BOT TEST</b>\nTime: ${new Date().toISOString()}\nStatus: Online`);

            return new Response(JSON.stringify({
                success: true,
                env: { token: tokenDebug, chat: chatDebug },
                telegramTest: testTele,
                results
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'simulate') {
            const icon = '🔴';
            const activeTf = '1m';
            const symbol = 'BTCUSDT';
            const strategyName = 'Scalp 1m';
            const signal = 'SHORT';
            const close = 92700.3;
            const target = 92650.00;
            const stopLoss = 92400.00;

            const msg = `${icon} <b>NEW SIGNAL (${activeTf}): ${symbol}</b>\n` +
                `Strategy: ${strategyName}\n` +
                `Type: <b>${signal}</b>\n` +
                `Entry: $${close}\n` +
                `Target: $${target.toFixed(2)}\n` +
                `StopLoss: $${stopLoss.toFixed(2)}`;

            const teleRes = await sendTelegram(msg);
            return new Response(JSON.stringify({ success: true, message: "Simulation executed", telegramResponse: teleRes }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'fix-cron') {
            const sql = `
                SELECT cron.unschedule('check-trades-every-minute');
                SELECT cron.schedule(
                'check-trades-every-minute',
                '* * * * *',
                $$
                SELECT
                    net.http_post(
                    url := 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades',
                    headers := '{"Content-Type": "application/json"}'::jsonb,
                    body := '{}'::jsonb
                    )
                $$
                );
            `;
            // Note: We can only run this if we have an RPC like 'execute_sql'. 
            // If not, we will just return a manual instruction for the user.
            return new Response(JSON.stringify({
                instruction: "Please run the following SQL in your Supabase SQL Editor to fix the bot automation:",
                sql: sql.trim()
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // HEARTBEAT: Update pa_bot_last_scan_at to prove bot is active
        const { data: existingHeartbeat, error: fetchError } = await supabase.from('bot_settings').select('id').eq('key', 'pa_bot_last_scan_at').single();
        if (fetchError) console.error('Heartbeat fetch error:', fetchError);

        if (existingHeartbeat) {
            console.log('Updating heartbeat ID:', existingHeartbeat.id);
            const { error: updateError } = await supabase.from('bot_settings').update({ value: new Date().toISOString() }).eq('id', existingHeartbeat.id);
            if (updateError) console.error('Heartbeat update error:', updateError);
        } else {
            console.log('Inserting new heartbeat');
            const { error: insertError } = await supabase.from('bot_settings').insert({ key: 'pa_bot_last_scan_at', value: new Date().toISOString() });
            if (insertError) console.error('Heartbeat insert error:', insertError);
        }

        await supabase.from('bot_settings').delete().eq('key', 'pa_bot_last_scan_at').neq('id', existingHeartbeat?.id || 0);

        /* =========================================
           PART -1: GLOBAL RETENTION POLICY (90 DAYS)
           ========================================= */
        const nowMs = now.getTime();
        const ninetyDaysAgo = new Date(nowMs - (90 * 24 * 60 * 60 * 1000)).toISOString();

        // Keep all trades (except PENDING) for 90 days for balanced analytics
        await supabase.from('trading_history').delete()
            .lt('created_at', ninetyDaysAgo)
            .neq('status', 'PENDING');

        const logs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        // Custom logs for report
        console.log = (...args) => { logs.push(args.join(' ')); originalLog(...args); };
        console.warn = (...args) => { logs.push(`[WARN] ${args.join(' ')}`); originalWarn(...args); };
        console.error = (...args) => { logs.push(`[ERROR] ${args.join(' ')}`); originalError(...args); };

        const updates: any[] = [];
        const newSignals: any[] = [];

        /* =========================================
       ACTION: BACKFILL ANOMALIES (Jan 19)
       ========================================= */
        if (action === 'backfill-anomalies') {
            console.log("Starting Backfill for Jan 19...");
            let insertedCount = 0;
            for (const symbol of DEFAULT_SYMBOLS) {
                for (const tf of ['1m', '15m', '1h', '4h']) {
                    try {
                        const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${tf}&limit=1000`);
                        const klines = await res.json();

                        for (let i = 1; i < klines.length; i++) {
                            const [time, open, high, low, close] = klines[i].map(Number);
                            const change = ((close - Number(klines[i - 1][1])) / Number(klines[i - 1][1])) * 100; // Use open of prev as baseline for window change
                            if (time < BACKFILL_START_TIME) continue;

                            const prevClose = Number(klines[i - 1][4]);
                            const candleChange = ((close - prevClose) / prevClose) * 100;
                            const absChange = Math.abs(candleChange);

                            // Calculate ATR for backfill (Dynamic)
                            const thresholds: Record<string, number> = { '1m': 0.5, '15m': 1.0, '1h': 2.5, '4h': 4.5 };
                            const prevKlines = klines.slice(Math.max(0, i - 20), i);
                            let atr = 0;
                            if (prevKlines.length >= 10) {
                                const trs = prevKlines.map((pk: any, idx: number) => {
                                    if (idx === 0) return 0;
                                    const h = Number(pk[2]);
                                    const l = Number(pk[3]);
                                    const pc = Number(prevKlines[idx - 1][4]);
                                    return Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
                                });
                                atr = trs.reduce((a: number, b: number) => a + b, 0) / trs.length;
                            }

                            const isRelativeAnomaly = atr > 0 && (Math.abs(high - low) > atr * 3.5 || Math.abs(close - open) > atr * 2.5);

                            if (absChange >= (thresholds[tf] || 1.5) || isRelativeAnomaly) {
                                const anomalyType = candleChange > 0 ? 'PUMP' : 'DUMP';

                                // Check if already exists
                                const { data: exist } = await supabase
                                    .from('market_anomalies')
                                    .select('id')
                                    .eq('symbol', symbol)
                                    .eq('timeframe', tf)
                                    .eq('created_at', new Date(time).toISOString())
                                    .limit(1);

                                if (!exist || exist.length === 0) {
                                    // Find recovery in subsequent klines
                                    let status = 'EXPIRED';
                                    let recoveredAt = null;

                                    // Dynamic expiry threshold based on timeframe
                                    const expiryThresholds: Record<string, number> = { '1m': 1, '15m': 4, '1h': 24, '4h': 48 };
                                    const expiryHrs = expiryThresholds[tf] || 48;

                                    for (let j = i + 1; j < klines.length; j++) {
                                        const nextClose = Number(klines[j][4]);
                                        const nextTime = Number(klines[j][0]);
                                        if (anomalyType === 'DUMP' && nextClose >= open) {
                                            status = 'RECOVERED';
                                            recoveredAt = new Date(nextTime).toISOString();
                                            break;
                                        }
                                        if (anomalyType === 'PUMP' && nextClose <= open) {
                                            status = 'RECOVERED';
                                            recoveredAt = new Date(nextTime).toISOString();
                                            break;
                                        }
                                        // Dynamic limit for recovery
                                        if ((nextTime - time) > expiryHrs * 60 * 60 * 1000) break;
                                    }

                                    const { error: insErr } = await supabase.from('market_anomalies').insert({
                                        symbol,
                                        timeframe: tf,
                                        anomaly_type: anomalyType,
                                        start_price: open,
                                        extreme_price: anomalyType === 'PUMP' ? high : low,
                                        recovery_price: open,
                                        change_percent: candleChange,
                                        status,
                                        recovered_at: recoveredAt,
                                        created_at: new Date(time).toISOString()
                                    });
                                    if (!insErr) {
                                        insertedCount++;
                                        console.log(`[BACKFILL] Inserted ${symbol} ${tf} ${anomalyType} @ ${new Date(time).toISOString()}`);
                                    } else {
                                        console.error(`[BACKFILL] Error inserting:`, insErr.message);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`Backfill error for ${symbol} ${tf}:`, (e as any).message);
                    }
                }
            }
            return new Response(JSON.stringify({ message: "Backfill completed", insertedCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        /* =========================================
           PART 0: FETCH BOT SETTINGS
           ========================================= */
        const { data: settingsData } = await supabase
            .from('bot_settings')
            .select('key, value')
            .in('key', ['allowed_timeframes', 'subscriber_ids', 'target_symbols', 'enable_bot']);

        const settings = (settingsData || []).reduce((acc: any, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        const SYMBOLS_TO_SCAN: string[] = settings['target_symbols'] || DEFAULT_SYMBOLS;

        // Default allow all if not set
        const allowedTimeframes: string[] = settings['allowed_timeframes'] || ['1m', '15m', '1h', '4h'];
        const subscriberIds: (string | number)[] = settings['subscriber_ids'] || [];

        /* =========================================
           PART 1: AUDIT EXISTING TRADES
           ========================================= */
        const { data: pendingTrades } = await supabase
            .from('trading_history')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(100); // LIMIT to avoid timeouts

        if (pendingTrades && pendingTrades.length > 0) {
            const grouped = pendingTrades.reduce((acc, t) => {
                acc[t.symbol] = acc[t.symbol] || [];
                acc[t.symbol].push(t);
                return acc;
            }, {});

            for (const sym of Object.keys(grouped)) {
                const klineRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=1m&limit=1000`);
                const klineData = await klineRes.json();
                if (!Array.isArray(klineData)) continue;

                const candles = klineData.map((c: any) => ({
                    o: parseFloat(c[1]), 
                    h: parseFloat(c[2]), 
                    l: parseFloat(c[3]), 
                    c: parseFloat(c[4]),
                    t: c[6]
                }));

                const tickerRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${sym}`);
                const tickerData = await tickerRes.json();
                const currentPrice = parseFloat(tickerData.price);

                for (const trade of grouped[sym]) {
                    let newStatus = 'PENDING';
                    let hitMilestone = false;

                    if (trade.signal === 'NEUTRAL') {
                        await supabase.from('trading_history').update({ status: 'JobDone' }).eq('id', trade.id);
                        continue;
                    }

                    const getStatusOnSL = (entry: number, sl: number, signal: string) => {
                        const isP = signal === 'LONG'
                            ? (sl > entry + 0.00000001)
                            : (sl < entry - 0.00000001);
                        if (isP) return 'SUCCESS';
                        
                        const isB = Math.abs(sl - entry) <= 0.00001;
                        if (isB) return 'PROTECTED';
                        
                        return 'FAILED';
                    };

                    if (trade.signal === 'LONG') {
                        if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice <= trade.stop_loss) {
                            newStatus = getStatusOnSL(trade.price_at_signal, trade.stop_loss, trade.signal);
                        }
                    } else {
                        if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice >= trade.stop_loss) {
                            newStatus = getStatusOnSL(trade.price_at_signal, trade.stop_loss, trade.signal);
                        }
                    }

                    // --- COMBO 5: TRAILING STOP PROTECTION ---
                        // DYNAMIC ACTIVATION: Only start trailing once price has reached 30% of target distance
                        const tpDist = Math.abs(trade.target_price - trade.price_at_signal);
                        const progress = Math.abs(currentPrice - trade.price_at_signal) / tpDist;

                        if (progress >= 0.3 && (newStatus === 'PENDING' || newStatus === 'PROTECTED')) {
                            const m15 = candles;
                            const trailingSL = getCombo5TrailingLevel(
                                m15.map(c => c.o),
                                m15.map(c => c.h), 
                                m15.map(c => c.l), 
                                m15.map(c => c.c), 
                                trade.signal as 'LONG' | 'SHORT'
                            );
                            
                            if (trailingSL) {
                                let shouldUpdate = false;
                                if (trade.signal === 'LONG' && trailingSL > trade.stop_loss) shouldUpdate = true;
                                if (trade.signal === 'SHORT' && trailingSL < trade.stop_loss) shouldUpdate = true;

                                if (shouldUpdate) {
                                    console.log(`[TRAILING SL ACTIVATED] ${trade.symbol} update to ${trailingSL.toFixed(5)} (Progress: ${(progress*100).toFixed(1)}%)`);
                                    await supabase.from('trading_history')
                                        .update({ stop_loss: trailingSL })
                                        .eq('id', trade.id);
                                    trade.stop_loss = trailingSL;
                                }
                            }
                        }

                    if (newStatus === 'PENDING') {
                        const tradeTime = new Date(trade.created_at).getTime();
                        const relevant = candles.filter((c: any) => c.t >= tradeTime);

                        // Milestones for Break-Even Protection
                        const tpDistance = Math.abs(trade.target_price - trade.price_at_signal);
                        const milestone50 = trade.signal === 'LONG'
                            ? trade.price_at_signal + (tpDistance * 0.5)
                            : trade.price_at_signal - (tpDistance * 0.5);

                        for (const c of relevant) {
                            // Milestone Tracking (simplified logic for the scan)
                            if (trade.signal === 'LONG') {
                                if (c.h >= milestone50) hitMilestone = true;

                                if (c.h >= trade.target_price) {
                                    newStatus = 'SUCCESS';
                                    break;
                                } else if (hitMilestone && c.l <= trade.price_at_signal) {
                                    // Profitable exit (at least entry)
                                    newStatus = 'PROTECTED';
                                    break;
                                } else if (c.l <= trade.stop_loss) {
                                    // Standard loss or tracked SL hit
                                    newStatus = getStatusOnSL(trade.price_at_signal, trade.stop_loss, trade.signal);
                                    break;
                                }
                            } else {
                                if (c.l <= milestone50) hitMilestone = true;

                                if (c.l <= trade.target_price) {
                                    newStatus = 'SUCCESS';
                                    break;
                                } else if (hitMilestone && c.h >= trade.price_at_signal) {
                                    newStatus = 'PROTECTED';
                                    break;
                                } else if (c.h >= trade.stop_loss) {
                                    newStatus = getStatusOnSL(trade.price_at_signal, trade.stop_loss, trade.signal);
                                    break;
                                }
                            }
                        }

                        // Final check with current price for the "hitMilestone" logic
                        if (newStatus === 'PENDING') {
                            if (trade.signal === 'LONG') {
                                if (currentPrice >= milestone50) hitMilestone = true;
                                if (hitMilestone && currentPrice <= trade.price_at_signal) newStatus = 'PROTECTED';
                            } else {
                                if (currentPrice <= milestone50) hitMilestone = true;
                                if (hitMilestone && currentPrice >= trade.price_at_signal) newStatus = 'PROTECTED';
                            }
                        }
                    }

                    if (newStatus !== 'PENDING') {
                        // Generate dynamic reason
                        let autoReason = '';
                        if (newStatus === 'SUCCESS') {
                            const currentIsProfit = trade.signal === 'LONG'
                                ? (trade.stop_loss > trade.price_at_signal + 0.00000001)
                                : (trade.stop_loss < trade.price_at_signal - 0.00000001);

                            if (currentIsProfit) {
                                autoReason = `💰 Thắng lệnh (Trailing SL): Đã bảo toàn lợi nhuận khi giá quay đầu. Chiến lược: ${trade.strategy_name}.`;
                            } else {
                                autoReason = `✅ Thắng lệnh (Full Target) do: ${trade.strategy_name}. RSI: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x.`;
                            }
                        } else if (newStatus === 'PROTECTED') {
                            autoReason = `🛡️ Bảo vệ hòa vốn: Hệ thống tự động đóng lệnh tại Entry để bảo toàn vốn. Chiến lược: ${trade.strategy_name}.`;
                        } else {
                            autoReason = `❌ Thua lệnh: Giá đi ngược dự đoán (Stoploss). RSI vào lệnh: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x. Thị trường đảo chiều mạnh.`;
                        }

                        const updateData: any = { status: newStatus, pnl_reason: autoReason };
                        if (newStatus === 'PROTECTED') {
                            updateData.stop_loss = trade.price_at_signal;
                        }
                        const { error: upErr } = await supabase.from('trading_history').update(updateData).eq('id', trade.id);

                        // Fallback if pnl_reason column still not added by user
                        if (upErr && upErr.message.includes('column') && upErr.message.includes('not exist')) {
                            const fallbackData: any = { status: newStatus };
                            if (newStatus === 'PROTECTED') fallbackData.stop_loss = trade.price_at_signal;
                            await supabase.from('trading_history').update(fallbackData).eq('id', trade.id);
                        }

                        updates.push({ id: trade.id, status: newStatus });

                        // REPLY TO OPEN MESSAGE IF EXISTS (Closed Trades)
                        const icon = newStatus === 'SUCCESS' ? '✅' : (newStatus === 'PROTECTED' ? '🛡️' : '❌');
                        const resultText = newStatus === 'SUCCESS' ? 'SUCCESS' : (newStatus === 'PROTECTED' ? 'PROTECTED (Breakeven)' : 'FAILED');
                        const msg = `${icon} <b>TRADE CLOSED: ${trade.symbol}</b>\n` +
                            `Result: <b>${resultText}</b>\n` +
                            `Type: ${trade.signal}\n` +
                            `Entry: $${trade.price_at_signal}\n` +
                            `Initial SL: $${trade.initial_stop_loss || trade.stop_loss}\n` +
                            `Exit SL: $${trade.stop_loss}\n` +
                            `Close Price: $${currentPrice}\n` +
                            `Lý do Robot: <i>${autoReason}</i>`;

                        await sendTelegram(msg, trade.telegram_message_id, subscriberIds);
                    }
                }
            }
        }

        /* =========================================
           PART 1.5: TRACK MARKET ANOMALIES (RECOVERY)
           ========================================= */
        const { data: trackingAnomalies } = await supabase
            .from('market_anomalies')
            .select('*')
            .eq('status', 'TRACKING');

        if (trackingAnomalies && trackingAnomalies.length > 0) {
            for (const anomaly of trackingAnomalies) {
                try {
                    const priceRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${anomaly.symbol}`);
                    const priceData = await priceRes.json();
                    const currentPrice = parseFloat(priceData.price);

                    let isRecovered = false;
                    if (anomaly.anomaly_type === 'DUMP' && currentPrice >= anomaly.recovery_price) isRecovered = true;
                    if (anomaly.anomaly_type === 'PUMP' && currentPrice <= anomaly.recovery_price) isRecovered = true;

                    if (isRecovered) {
                        await supabase.from('market_anomalies').update({
                            status: 'RECOVERED',
                            recovered_at: new Date().toISOString()
                        }).eq('id', anomaly.id);
                    } else {
                        // Dynamic expiry thresholds: 1m:1h, 15m:4h, 1h:24h, 4h:48h
                        const expiryThresholds: Record<string, number> = { '1m': 1, '15m': 4, '1h': 24, '4h': 48 };
                        const expiryHrs = expiryThresholds[anomaly.timeframe] || 48;

                        const ageHrs = (new Date().getTime() - new Date(anomaly.created_at).getTime()) / (1000 * 60 * 60);
                        if (ageHrs > expiryHrs) {
                            await supabase.from('market_anomalies').update({ status: 'EXPIRED' }).eq('id', anomaly.id);
                        }
                    }
                } catch (e) {
                    console.error(`Error tracking anomaly ${anomaly.id}:`, e.message);
                }
            }
        }

        /* =========================================
           PART 2: GENERATE NEW SIGNALS & DETECT ANOMALIES
           ========================================= */

        console.log(`[CHECK TRADES] Starting scan for ${SYMBOLS_TO_SCAN.length} symbols...`);
        const results = await Promise.allSettled(SYMBOLS_TO_SCAN.map(async (symbol) => {
            const dataMap: any = {};
            
            // Fetch TFs in parallel for speed
            const fetches = TF_CONFIG.map(cfg =>
                fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`)
                    .then(r => r.json())
                    .then(data => ({ cfg, data }))
                    .catch(() => ({ cfg, data: null }))
            );

            const responses = await Promise.all(fetches);
            console.log(`[CHECK TRADES] ${symbol}: Fetched ${responses.filter(r => r.data).length}/${TF_CONFIG.length} timeframes`);

            for (const { cfg, data } of responses) {
                if (!Array.isArray(data)) {
                    console.error(`[CHECK TRADES] ${symbol}: Failed to fetch ${cfg.interval}`);
                    continue;
                }
                dataMap[cfg.interval] = {
                    o: data.map((x: any) => parseFloat(x[1])),
                    h: data.map((x: any) => parseFloat(x[2])),
                    l: data.map((x: any) => parseFloat(x[3])),
                    c: data.map((x: any) => parseFloat(x[4])),
                    v: data.map((x: any) => parseFloat(x[5]))
                };
            }

            if (!dataMap['15m'] || !dataMap['1h'] || !dataMap['4h']) {
                console.log(`[CHECK TRADES] ${symbol}: Missing core analyses (15m/1h/4h)`);
                return;
            }

            const h1 = dataMap['1h'];
            const adxH1 = calculateADX(h1.h, h1.l, h1.c);
            const bbH1 = calculateBollingerBands(h1.c);
            const ema9_h1 = calculateEMA(h1.c, 9);
            const ema21_h1 = calculateEMA(h1.c, 21);
            const regime = determineMarketRegime(adxH1, bbH1.width, ema9_h1, ema21_h1);

            const symbolData: SymbolData = {
                symbol,
                m1: dataMap['1m'], 
                m15: dataMap['15m'],
                h1: dataMap['1h'],
                h4: dataMap['4h'],
                regime,
                utcHour: now.getUTCHours(),
                utcMinute: now.getUTCMinutes()
            };

            // --- MULTI-TIMEFRAME FIBONACCI SCAN ---
            const currentPrice = symbolData.m15.c[symbolData.m15.c.length - 1];
            const tolerance = currentPrice * 0.0015; // 0.15%

            const tfChecklist = [
                { name: '4h', data: symbolData.h4 },
                { name: '1h', data: symbolData.h1 },
                { name: '15m', data: symbolData.m15 },
                { name: '1m', data: symbolData.m1 }
            ];

            for (const tf of tfChecklist) {
                const trend = calculateTrendForTF(tf.name, tf.data);
                const swing = detectRecentSwing(tf.data.h, tf.data.l, 500); 
                const fibs = calculateFibonacciLevels(swing.high, swing.low, trend);
                
                let tfActiveFib = null;
                for (const [ratio, price] of Object.entries(fibs)) {
                    if (Math.abs(currentPrice - price) <= tolerance) {
                        tfActiveFib = { ratio, price, tf: tf.name, swingH: swing.high, swingL: swing.low };
                        break;
                    }
                }

                if (tfActiveFib) {
                    console.log(`[CHECK TRADES] ${symbol}: PRICE AT FIB ${tfActiveFib.ratio} ($${tfActiveFib.price.toFixed(2)}) on ${tfActiveFib.tf}. Analyzing combos...`);

                    const tfKeyMap: Record<string, { current: keyof SymbolData, higher: keyof SymbolData }> = {
                        '4h': { current: 'h4', higher: 'h4' },
                        '1h': { current: 'h1', higher: 'h4' },
                        '15m': { current: 'm15', higher: 'h1' },
                        '1m': { current: 'm1', higher: 'm15' }
                    };

                    const mapping = tfKeyMap[tfActiveFib.tf];
                    const currentOHLCV = symbolData[mapping.current] as OHLCV;
                    const higherOHLCV = symbolData[mapping.higher] as OHLCV;

                    const c1 = checkCombo1(currentOHLCV, symbolData.regime);
                    const c2 = checkCombo2(currentOHLCV, higherOHLCV, symbolData.regime);
                    const c3 = checkCombo3(currentOHLCV, symbolData.regime);
                    const c4 = checkCombo4(currentOHLCV, symbolData.regime);
                    const c6 = checkCombo6(currentOHLCV, symbolData);

                    const possibleSignalsForTF = [c1, c2, c3, c4, c6]
                        .filter((s): s is ComboSignal => s !== null)
                        .filter(sig => {
                            const ratio = parseFloat(tfActiveFib.ratio);
                            if (ratio <= 0.382 && sig.direction === 'LONG') return false;
                            if (ratio >= 0.618 && sig.direction === 'SHORT') return false;
                            return true;
                        });

                    const bestSignal = evaluateFiboFiringLogic(possibleSignalsForTF);
                    if (bestSignal) {
                        bestSignal.reason += ` (Hit ${tfActiveFib.tf} Fib ${tfActiveFib.ratio})`;
                        console.log(`[CHECK TRADES] ${symbol}: SIGNAL DETECTED on ${tfActiveFib.tf}: ${bestSignal.reason}`);

                        const sig = {
                            type: bestSignal.direction,
                            tf: tfActiveFib.tf, 
                            name: bestSignal.reason,
                            ref: {
                                close: currentPrice,
                                swingHigh: tfActiveFib.swingH,
                                swingLow: tfActiveFib.swingL,
                                atr: calculateATR(tf.data.h, tf.data.l, tf.data.c, 14),
                                rsi: calculateRSI(tf.data.c),
                                volRatio: tf.data.v[tf.data.v.length - 1] / calculateSMA(tf.data.v, 20)
                            }
                        };

                        console.log(`[DEBUG SCAN] ${symbol}: Signal detected on ${sig.tf}. sig.tf should be ${tf.name}. Storing...`);

                        if (!allowedTimeframes.includes(sig.tf)) continue;

                        const filterResult: any = await applySmartNoiseFilter(supabase, symbol, sig);
                        if (!filterResult.allowed) continue;

                        // Reversal logic
                        if (filterResult.action === 'REVERSAL' && filterResult.oppositeTrades) {
                            for (const oldTrade of filterResult.oppositeTrades) {
                                let isProfit = (oldTrade.signal === 'LONG' && sig.ref.close > oldTrade.price_at_signal) ||
                                              (oldTrade.signal === 'SHORT' && sig.ref.close < oldTrade.price_at_signal);

                                if (isProfit) {
                                    await supabase.from('trading_history').update({
                                        stop_loss: oldTrade.price_at_signal,
                                        pnl_reason: `🛡️ Reversal pressure from ${sig.name}`
                                    }).eq('id', oldTrade.id);
                                    await sendTelegram(`🛡️ <b>DỜI SL HÒA VỐN: ${symbol}</b>\nLý do: ${sig.name}`, oldTrade.telegram_message_id, subscriberIds);
                                }
                            }
                        }

                        const { target, stopLoss } = calculateDynamicTPSL(sig.ref.close, sig.type, sig.ref.swingHigh, sig.ref.swingLow, sig.ref.atr, sig.tf);
                        const icon = sig.type === 'LONG' ? '🟢' : '🔴';
                        const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                        const timestampStr = `${vnNow.getUTCHours().toString().padStart(2, '0')}:${vnNow.getUTCMinutes().toString().padStart(2, '0')} ${vnNow.getUTCDate().toString().padStart(2, '0')}/${(vnNow.getUTCMonth() + 1).toString().padStart(2, '0')}`;
                        const tradeId = `${symbol.replace('USDT', '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                        const msg = `${icon} <b>NEW SIGNAL (${sig.tf}): ${symbol}</b>\n` +
                            `ID: <b>#${tradeId}</b>\n` +
                            `Strategy: <b>${sig.name}</b>\n` +
                            `Type: <b>${sig.type}</b>\n` +
                            `Entry: $${sig.ref.close.toFixed(2)}\n` +
                            `Target: $${target.toFixed(2)}\n` +
                            `StopLoss: $${stopLoss.toFixed(2)}\n` +
                            `Time: ${timestampStr}`;

                        const { data: inserted, error: insertError } = await supabase.from('trading_history').insert({
                            symbol, timeframe: sig.tf, signal: sig.type,
                            price_at_signal: sig.ref.close, target_price: target, stop_loss: stopLoss,
                            initial_stop_loss: stopLoss, status: 'PENDING',
                            rsi: sig.ref.rsi, volume_ratio: sig.ref.volRatio,
                            strategy_name: sig.name, trade_id: tradeId
                        }).select('id').single();

                        if (!insertError && inserted) {
                            const teleRes = await sendTelegram(msg, undefined, subscriberIds);
                            if (teleRes?.ok) await supabase.from('trading_history').update({ telegram_message_id: teleRes.result.message_id }).eq('id', inserted.id);
                            newSignals.push({ symbol, signal: sig.type, tf: sig.tf });
                        }
                    }
                }
            }

        }));

        return new Response(JSON.stringify({
            success: true,
            server_time: new Date().toISOString(),
            action_processed: action || 'none',
            new_signals: newSignals,
            scan_report: logs
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
