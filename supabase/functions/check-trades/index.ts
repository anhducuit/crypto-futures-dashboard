import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT'];
const BACKFILL_START_TIME = new Date('2026-01-18T17:00:00Z').getTime(); // 00:00 Jan 19 VN
const TF_CONFIG = [
    { interval: '1m', limit: 300 },
    { interval: '15m', limit: 100 },
    { interval: '1h', limit: 100 },
    { interval: '4h', limit: 300 }
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


function detectPriceAction(opens: number[], highs: number[], lows: number[], closes: number[]) {
    const i = closes.length - 1; // Current candle
    const bodySize = Math.abs(closes[i] - opens[i]);
    const candleRange = highs[i] - lows[i];
    const upperShadow = highs[i] - Math.max(opens[i], closes[i]);
    const lowerShadow = Math.min(opens[i], closes[i]) - lows[i];

    // 1. PIN BAR detection
    let pinBar = 'NONE';
    if (candleRange > 0) {
        // Bullish Pin Bar: Small body, long lower shadow
        if (lowerShadow > bodySize * 2 && upperShadow < bodySize) pinBar = 'BULLISH';
        // Bearish Pin Bar: Small body, long upper shadow
        if (upperShadow > bodySize * 2 && lowerShadow < bodySize) pinBar = 'BEARISH';
    }

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

    let target, stopLoss;
    // ATR Multiplier optimized by Timeframe
    const atrMultiplier = timeframe === '4h' ? 4.0 : (timeframe === '1h' ? 3.5 : 3.0);
    const volatilityBuffer = atr > 0 ? (atr * atrMultiplier) : (range * 0.5);

    if (signal === 'LONG') {
        // Target at Fib 0.618 of range or entry + buffer
        target = entryPrice + Math.max(range * 0.618, volatilityBuffer * 1.5);
        // Stoploss at entry - buffer (ATR based or 38.2% Fib)
        stopLoss = entryPrice - volatilityBuffer;

        // Hard limits for safety and minimum R:R
        const minRR = 1.3; // Increased from 1.2 for better quality
        const maxSL = 0.035; // Max 3.5%
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.01));

        const currentSLPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 - minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 - maxSL);

        const currentTPPercent = Math.abs(target - entryPrice) / entryPrice;
        const requiredTP = (Math.abs(entryPrice - stopLoss) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 + requiredTP);
    } else {
        target = entryPrice - Math.max(range * 0.618, volatilityBuffer * 1.5);
        stopLoss = entryPrice + volatilityBuffer;

        const minRR = 1.3;
        const maxSL = 0.035;
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.01));

        const currentSLPercent = Math.abs(stopLoss - entryPrice) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 + minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 + maxSL);

        const currentTPPercent = Math.abs(entryPrice - target) / entryPrice;
        const requiredTP = (Math.abs(stopLoss - entryPrice) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 - requiredTP);
    }

    // ROUNDING FIX for floating point errors
    return {
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(stopLoss * 100) / 100
    };
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

            const { error } = await supabase.from('trading_history').delete().neq('id', 0); // Delete all
            if (error) {
                return new Response(JSON.stringify({ success: false, error: error.message }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 500
                });
            }

            return new Response(JSON.stringify({ success: true, message: "All trading history has been cleared." }), {
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

        // HEARTBEAT: Update last_scan_at to prove bot is active
        const { data: existingHeartbeat, error: fetchError } = await supabase.from('bot_settings').select('id').eq('key', 'last_scan_at').single();
        if (fetchError) console.error('Heartbeat fetch error:', fetchError);

        if (existingHeartbeat) {
            console.log('Updating heartbeat ID:', existingHeartbeat.id);
            const { error: updateError } = await supabase.from('bot_settings').update({ value: new Date().toISOString() }).eq('id', existingHeartbeat.id);
            if (updateError) console.error('Heartbeat update error:', updateError);
        } else {
            console.log('Inserting new heartbeat');
            const { error: insertError } = await supabase.from('bot_settings').insert({ key: 'last_scan_at', value: new Date().toISOString() });
            if (insertError) console.error('Heartbeat insert error:', insertError);
        }

        // Cleanup duplicates (just in case)
        await supabase.from('bot_settings').delete().eq('key', 'last_scan_at').neq('id', existingHeartbeat?.id || 0);

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
                    h: parseFloat(c[2]), l: parseFloat(c[3]), t: c[6]
                }));

                const tickerRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${sym}`);
                const tickerData = await tickerRes.json();
                const currentPrice = parseFloat(tickerData.price);

                for (const trade of grouped[sym]) {
                    let newStatus = 'PENDING';
                    if (trade.signal === 'NEUTRAL') {
                        await supabase.from('trading_history').update({ status: 'JobDone' }).eq('id', trade.id);
                        continue;
                    }

                    if (trade.signal === 'LONG') {
                        if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                    } else {
                        if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                    }

                    if (newStatus === 'PENDING') {
                        const tradeTime = new Date(trade.created_at).getTime();
                        const relevant = candles.filter((c: any) => c.t >= tradeTime);
                        for (const c of relevant) {
                            if (trade.signal === 'LONG') {
                                if (c.h >= trade.target_price) newStatus = 'SUCCESS';
                                else if (c.l <= trade.stop_loss) newStatus = 'FAILED';
                            } else {
                                if (c.l <= trade.target_price) newStatus = 'SUCCESS';
                                else if (c.h >= trade.stop_loss) newStatus = 'FAILED';
                            }
                            if (newStatus !== 'PENDING') break;
                        }
                    }

                    if (newStatus !== 'PENDING') {
                        // Generate dynamic reason
                        let autoReason = '';
                        if (newStatus === 'SUCCESS') {
                            autoReason = `✅ Thắng lệnh do: ${trade.strategy_name}. RSI: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x. Thị trường thuận xu hướng.`;
                        } else {
                            autoReason = `❌ Thua lệnh: Giá đi ngược dự đoán (Stoploss). RSI vào lệnh: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x. Thị trường đảo chiều mạnh.`;
                        }

                        const updateData: any = { status: newStatus, pnl_reason: autoReason };
                        const { error: upErr } = await supabase.from('trading_history').update(updateData).eq('id', trade.id);

                        // Fallback if pnl_reason column still not added by user
                        if (upErr && upErr.message.includes('column') && upErr.message.includes('not exist')) {
                            await supabase.from('trading_history').update({ status: newStatus }).eq('id', trade.id);
                        }

                        updates.push({ id: trade.id, status: newStatus });

                        // REPLY TO OPEN MESSAGE IF EXISTS (Closed Trades)
                        const icon = newStatus === 'SUCCESS' ? '✅' : '❌';
                        const msg = `${icon} <b>TRADE CLOSED: ${trade.symbol}</b>\n` +
                            `Result: <b>${newStatus}</b>\n` +
                            `Type: ${trade.signal}\n` +
                            `Entry: $${trade.price_at_signal}\n` +
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

        const results = await Promise.allSettled(SYMBOLS_TO_SCAN.map(async (symbol) => {
            const analyses: Record<string, any> = {};
            let failed = false;

            // Fetch TFs in parallel for speed
            const fetches = TF_CONFIG.map(cfg =>
                fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`)
                    .then(r => r.json())
                    .then(data => ({ cfg, data }))
                    .catch(() => ({ cfg, data: null }))
            );

            const responses = await Promise.all(fetches);

            for (const { cfg, data } of responses) {
                if (!Array.isArray(data)) { failed = true; break; }

                const closes = data.map((x: any) => parseFloat(x[4]));
                const highs = data.map((x: any) => parseFloat(x[2]));
                const lows = data.map((x: any) => parseFloat(x[3]));
                const volumes = data.map((x: any) => parseFloat(x[5]));

                const currentClose = closes[closes.length - 1];
                const currentVol = volumes[volumes.length - 1];
                const avgVol20 = calculateSMA(volumes, 20);
                const volRatio = avgVol20 > 0 ? (currentVol / avgVol20) : 1;
                const rsi = calculateRSI(closes);

                // RSI Array for Divergence (last 50)
                const rsiArr = [];
                for (let i = Math.max(14, closes.length - 50); i <= closes.length; i++) {
                    rsiArr.push(calculateRSI(closes.slice(0, i)));
                }
                const divergence = detectRSIDivergence(closes.slice(-50), rsiArr.slice(-50));

                const ichimoku = calculateIchimoku(highs, lows);
                const pivots = calculatePivotPoints(highs[highs.length - 2], lows[lows.length - 2], closes[closes.length - 2]); // Use previous full candle for pivots
                const priceAction = detectPriceAction(data.map((x: any) => parseFloat(x[1])), highs, lows, closes);

                // 4H Analysis (EMA20/50 Cross - More active than MA50/200)
                if (cfg.interval === '4h') {
                    const ema20Arr = calculateEMAArray(closes, 20);
                    const ema50Arr = calculateEMAArray(closes, 50);

                    if (ema20Arr.length > 2 && ema50Arr.length > 2) {
                        const ema20_curr = ema20Arr[ema20Arr.length - 1];
                        const ema50_curr = ema50Arr[ema50Arr.length - 1];
                        const ema20_prev = ema20Arr[ema20Arr.length - 2];
                        const ema50_prev = ema50Arr[ema50Arr.length - 2];

                        let cross = 'NONE';
                        if (ema20_prev <= ema50_prev && ema20_curr > ema50_curr) cross = 'BULLISH_CROSS';
                        if (ema20_prev >= ema50_prev && ema20_curr < ema50_curr) cross = 'BEARISH_CROSS';

                        const atr = calculateATR(highs, lows, closes, 14);
                        const distFromEMA = Math.abs(currentClose - ema20_curr) / ema20_curr;

                        analyses['4h'] = {
                            cross,
                            close: currentClose,
                            swingHigh: Math.max(...highs),
                            swingLow: Math.min(...lows),
                            rsi, volRatio,
                            ema20: ema20_curr,
                            ema50: ema50_curr,
                            atr, distFromEMA,
                            ichimoku, pivots, divergence, priceAction
                        };
                    }
                }

                // 1H Analysis (EMA20/50)
                if (cfg.interval === '1h') {
                    const ema20Arr = calculateEMAArray(closes, 20);
                    const ema50Arr = calculateEMAArray(closes, 50);
                    const ema20_curr = ema20Arr[ema20Arr.length - 1];
                    const ema50_curr = ema50Arr[ema50Arr.length - 1];
                    const ema20_prev = ema20Arr[ema20Arr.length - 2];
                    const ema50_prev = ema50Arr[ema50Arr.length - 2];

                    let cross = 'NONE';
                    if (ema20_prev <= ema50_prev && ema20_curr > ema50_curr) cross = 'BULLISH_CROSS';
                    if (ema20_prev >= ema50_prev && ema20_curr < ema50_curr) cross = 'BEARISH_CROSS';

                    const atr = calculateATR(highs, lows, closes, 14);
                    const distFromEMA = Math.abs(currentClose - ema20_curr) / ema20_curr;

                    analyses['1h'] = {
                        trend: ema20_curr > ema50_curr ? 'BULLISH' : 'BEARISH',
                        cross,
                        ema20: ema20_curr,
                        ema50: ema50_curr,
                        close: currentClose,
                        rsi, volRatio, atr, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        ichimoku, pivots, divergence, priceAction
                    }
                }

                // 15M Analysis
                if (cfg.interval === '15m') {
                    const ema12Array = calculateEMAArray(closes, 12);
                    const ema26Array = calculateEMAArray(closes, 26);

                    const ema12_curr = ema12Array[ema12Array.length - 1];
                    const ema26_curr = ema26Array[ema26Array.length - 1];
                    const ema12_prev = ema12Array[ema12Array.length - 2];
                    const ema26_prev = ema26Array[ema26Array.length - 2];

                    let cross = 'NONE';
                    if (ema12_prev <= ema26_prev && ema12_curr > ema26_curr) cross = 'BULLISH_CROSS';
                    if (ema12_prev >= ema26_prev && ema12_curr < ema26_curr) cross = 'BEARISH_CROSS';

                    const ema20 = calculateEMA(closes, 20);
                    const atr = calculateATR(highs, lows, closes, 14);
                    const currentRange = highs[highs.length - 1] - lows[lows.length - 1];
                    const isExtremeVol = atr > 0 && currentRange > (atr * 2.5);
                    const distFromEMA = Math.abs(currentClose - ema20) / ema20;

                    const emaDistance = Math.abs(ema12_curr - ema26_curr) / ema26_curr;
                    const emaDistancePrev = Math.abs(ema12_prev - ema26_prev) / ema26_prev;
                    const isTrendStrengthening = emaDistance > emaDistancePrev;

                    analyses['15m'] = {
                        cross: cross,
                        close: currentClose,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        rsi, volRatio,
                        atr, isExtremeVol, distFromEMA, ema20,
                        isTrendStrengthening, emaDistance
                    }
                }

                // 1m Scalp Analysis (Using EMA for speed)
                if (cfg.interval === '1m') {
                    // School 1: Scalping (EMA5/13)
                    const ema5Array = calculateEMAArray(closes, 5);
                    const ema13Array = calculateEMAArray(closes, 13);
                    const ema5_curr = ema5Array[ema5Array.length - 1];
                    const ema13_curr = ema13Array[ema13Array.length - 1];
                    const ema5_prev = ema5Array[ema5Array.length - 2];
                    const ema13_prev = ema13Array[ema13Array.length - 2];

                    let crossScalp = 'NONE';
                    if (ema5_prev <= ema13_prev && ema5_curr > ema13_curr) crossScalp = 'BULLISH_CROSS';
                    if (ema5_prev >= ema13_prev && ema5_curr < ema13_curr) crossScalp = 'BEARISH_CROSS';

                    // School 2: Safe Mode (EMA12/26)
                    const ema12Array = calculateEMAArray(closes, 12);
                    const ema26Array = calculateEMAArray(closes, 26);
                    const ema12_curr = ema12Array[ema12Array.length - 1];
                    const ema26_curr = ema26Array[ema26Array.length - 1];
                    const ema12_prev = ema12Array[ema12Array.length - 2];
                    const ema26_prev = ema26Array[ema26Array.length - 2];

                    let crossSafe = 'NONE';
                    if (ema12_prev <= ema26_prev && ema12_curr > ema26_curr) crossSafe = 'BULLISH_CROSS';
                    if (ema12_prev >= ema26_prev && ema12_curr < ema26_curr) crossSafe = 'BEARISH_CROSS';

                    const ema20 = calculateEMA(closes, 20);
                    const atr = calculateATR(highs, lows, closes, 14);
                    const currentRange = highs[highs.length - 1] - lows[lows.length - 1];
                    const isExtremeVol = atr > 0 && currentRange > (atr * 3.0);
                    const distFromEMA = Math.abs(currentClose - ema20) / ema20;

                    analyses['1m_scalp'] = {
                        cross: crossScalp,
                        close: currentClose,
                        rsi, volRatio, ema20, atr, isExtremeVol, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
                    };
                    analyses['1m_safe'] = {
                        cross: crossSafe,
                        close: currentClose,
                        rsi, volRatio, ema20, atr, isExtremeVol, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
                    };
                }

                // --- NEW: MARKET ANOMALY DETECTION (Dynamic & Static) ---
                const openPrice = parseFloat(data[data.length - 1][1]);
                const highPrice = parseFloat(data[data.length - 1][2]);
                const lowPrice = parseFloat(data[data.length - 1][3]);
                const closePrice = parseFloat(data[data.length - 1][4]);
                const candleRange = highPrice - lowPrice;
                const candleBody = Math.abs(closePrice - openPrice);

                const change = ((closePrice - openPrice) / openPrice) * 100;
                const absChange = Math.abs(change);

                // 1. Static Thresholds
                const thresholds: Record<string, number> = { '1m': 0.5, '15m': 1.0, '1h': 2.5, '4h': 4.5 };
                const currentThreshold = thresholds[cfg.interval] || 1.5;

                // 2. Relative Volatility (ATR-based)
                const atr = calculateATR(highs, lows, closes, 20);
                const isRelativeAnomaly = atr > 0 && (candleRange > atr * 3.5 || candleBody > atr * 2.5);

                if (absChange >= currentThreshold || isRelativeAnomaly) {
                    const anomalyType = change > 0 ? 'PUMP' : 'DUMP';
                    const triggerType = absChange >= currentThreshold ? 'STATIC' : 'RELATIVE';

                    // Avoid duplicate anomalies
                    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
                    const { data: recent } = await supabase
                        .from('market_anomalies')
                        .select('id')
                        .eq('symbol', symbol)
                        .eq('timeframe', cfg.interval)
                        .eq('anomaly_type', anomalyType)
                        .gt('created_at', tenMinsAgo)
                        .limit(1);

                    if (!recent || recent.length === 0) {
                        await supabase.from('market_anomalies').insert({
                            symbol,
                            timeframe: cfg.interval,
                            anomaly_type: anomalyType,
                            start_price: openPrice,
                            extreme_price: anomalyType === 'PUMP' ? highPrice : lowPrice,
                            recovery_price: openPrice,
                            change_percent: change,
                            rsi_at_anomaly: rsi,
                            status: 'TRACKING'
                        });
                        console.log(`[ANOMALY DETECTED] ${symbol} ${cfg.interval} ${anomalyType} (${triggerType}) ${change.toFixed(2)}% (Body/ATR: ${(candleBody / atr).toFixed(1)}x)`);
                    }
                }
            }

            if (failed || !analyses['1h'] || !analyses['15m']) {
                return;
            }

            const tf4h = analyses['4h'] as any;
            const tf1h = analyses['1h'] as any;
            const tf15m = analyses['15m'] as any;
            const tf1m_scalp = analyses['1m_scalp'] as any;
            const tf1m_safe = analyses['1m_safe'] as any;

            let signals_to_process: Array<{ type: 'LONG' | 'SHORT', tf: string, ref: any, name: string }> = [];

            // Strategy 1: 4H Major Trend (EMA20/50 Cross)
            if (tf4h) {
                const volConfirm = tf4h.volRatio > 1.2;
                const notOverextended = tf4h.distFromEMA < 0.02; // Stricter entry (2% limit)
                if (tf4h.cross === 'BULLISH_CROSS' && volConfirm && tf4h.rsi > 50 && notOverextended) {
                    signals_to_process.push({ type: 'LONG', tf: '4h', ref: tf4h, name: '4H EMA20/50 Trend' });
                } else if (tf4h.cross === 'BEARISH_CROSS' && volConfirm && tf4h.rsi < 50 && notOverextended) {
                    signals_to_process.push({ type: 'SHORT', tf: '4h', ref: tf4h, name: '4H EMA20/50 Trend' });
                }
            }

            // Strategy 2: 1H Trend Optimization
            if (tf1h) {
                const volConfirm = tf1h.volRatio > 1.2;
                const notOverextended = tf1h.distFromEMA < 0.015; // 1.5% limit
                if (tf1h.cross === 'BULLISH_CROSS' && volConfirm && tf1h.rsi > 50 && notOverextended) {
                    signals_to_process.push({ type: 'LONG', tf: '1h', ref: tf1h, name: '1H EMA20/50 Trend' });
                } else if (tf1h.cross === 'BEARISH_CROSS' && volConfirm && tf1h.rsi < 50 && notOverextended) {
                    signals_to_process.push({ type: 'SHORT', tf: '1h', ref: tf1h, name: '1H EMA20/50 Trend' });
                }
            }

            // Strategy 3: 1H Trend + 15M Cross
            if (tf1h && tf15m) {
                const volConfirm = tf15m.volRatio > 1.2; // Relaxed from 1.5
                const notOverextended = tf15m.distFromEMA < 0.015; // Relaxed from 0.01
                const trendStrong = tf15m.isTrendStrengthening;

                if (tf1h.trend === 'BULLISH' && tf15m.cross === 'BULLISH_CROSS' && volConfirm && tf15m.rsi > 45 && tf15m.rsi < 75 && !tf15m.isExtremeVol && notOverextended && trendStrong) {
                    signals_to_process.push({ type: 'LONG', tf: '15m', ref: tf15m, name: '1H Trend + 15M Cross' });
                } else if (tf1h.trend === 'BEARISH' && tf15m.cross === 'BEARISH_CROSS' && volConfirm && tf15m.rsi < 55 && tf15m.rsi > 25 && !tf15m.isExtremeVol && notOverextended && trendStrong) {
                    signals_to_process.push({ type: 'SHORT', tf: '15m', ref: tf15m, name: '1H Trend + 15M Cross' });
                }
            }

            // Strategy 3: 1m Duo Schools (Must align with 15m trend + 1h trend)
            if (tf1h && tf15m && tf1m_scalp && tf1m_safe) {
                const tf15mTrend = tf15m.close > tf15m.sma20 ? 'BULLISH' : 'BEARISH';

                // School 1: Scalping (EMA5/13)
                const scalpVol = tf1m_scalp.volRatio > 1.2; // Relaxed from 1.5
                const scalpDist = tf1m_scalp.distFromEMA < 0.008; // Relaxed from 0.005

                if (tf1h.trend === 'BULLISH' && tf15mTrend === 'BULLISH' && tf1m_scalp.cross === 'BULLISH_CROSS' && scalpVol && tf1m_scalp.rsi > 45 && tf1m_scalp.rsi < 85 && scalpDist) {
                    signals_to_process.push({ type: 'LONG', tf: '1m', ref: tf1m_scalp, name: '1m SCALPING (MA5/13)' });
                } else if (tf1h.trend === 'BEARISH' && tf15mTrend === 'BEARISH' && tf1m_scalp.cross === 'BEARISH_CROSS' && scalpVol && tf1m_scalp.rsi < 55 && tf1m_scalp.rsi > 15 && scalpDist) {
                    signals_to_process.push({ type: 'SHORT', tf: '1m', ref: tf1m_scalp, name: '1m SCALPING (MA5/13)' });
                }

                // School 2: Safe Mode (EMA12/26)
                const safeVol = tf1m_safe.volRatio > 1.2; // Relaxed from 1.3
                const safeDist = tf1m_safe.distFromEMA < 0.005; // Relaxed from 0.003
                if (tf1h.trend === 'BULLISH' && tf15mTrend === 'BULLISH' && tf1m_safe.cross === 'BULLISH_CROSS' && safeVol && tf1m_safe.rsi > 50 && tf1m_safe.rsi < 75 && !tf1m_safe.isExtremeVol && safeDist) {
                    signals_to_process.push({ type: 'LONG', tf: '1m', ref: tf1m_safe, name: '1m AN TOÀN (MA12/26)' });
                } else if (tf1h.trend === 'BEARISH' && tf15mTrend === 'BEARISH' && tf1m_safe.cross === 'BEARISH_CROSS' && safeVol && tf1m_safe.rsi < 50 && tf1m_safe.rsi > 25 && !tf1m_safe.isExtremeVol && safeDist) {
                    signals_to_process.push({ type: 'SHORT', tf: '1m', ref: tf1m_safe, name: '1m AN TOÀN (MA12/26)' });
                }
            }

            // --- STRATEGY 4: RSI DIVERGENCE (15M/1H) ---
            [tf15m, tf1h].forEach((tf, idx) => {
                if (!tf) return;
                const tfName = idx === 0 ? '15m' : '1h';
                if (tf.divergence === 'BULLISH' && tf.rsi < 45) { // Relaxed from 40
                    signals_to_process.push({ type: 'LONG', tf: tfName, ref: tf, name: `PHÂN KỲ RSI BULLISH (${tfName})` });
                } else if (tf.divergence === 'BEARISH' && tf.rsi > 55) { // Relaxed from 60
                    signals_to_process.push({ type: 'SHORT', tf: tfName, ref: tf, name: `PHÂN KỲ RSI BEARISH (${tfName})` });
                }
            });

            // --- STRATEGY 5: ICHIMOKU CLOUD BREAK (15M/1H/4H) ---
            [tf15m, tf1h, tf4h].forEach((tf, idx) => {
                if (!tf) return;
                const names = ['15m', '1h', '4h'];
                const tfName = names[idx];
                const { tenkan, kijun, spanA, spanB } = tf.ichimoku;
                const aboveCloud = tf.close > spanA && tf.close > spanB;
                const belowCloud = tf.close < spanA && tf.close < spanB;

                if (aboveCloud && tenkan > kijun && tf.rsi > 45) { // Relaxed from 50
                    signals_to_process.push({ type: 'LONG', tf: tfName, ref: tf, name: `ICHIMOKU BULLISH (${tfName})` });
                } else if (belowCloud && tenkan < kijun && tf.rsi < 55) { // Relaxed from 50
                    signals_to_process.push({ type: 'SHORT', tf: tfName, ref: tf, name: `ICHIMOKU BEARISH (${tfName})` });
                }
            });

            // --- STRATEGY 6: KEY LEVELS + PRICE ACTION (15M/1H) ---
            [tf15m, tf1h].forEach((tf, idx) => {
                if (!tf) return;
                const tfName = idx === 0 ? '15m' : '1h';
                const { pivot, r1, r2, r3, s1, s2, s3 } = tf.pivots;
                const { pinBar, engulfing } = tf.priceAction;

                const threshold = tfName === '15m' ? 0.006 : 0.008; // 0.6% for 15m, 0.8% for 1h
                const nearLevel = (price: number, level: number) => Math.abs(price - level) / level < threshold;

                // LONG at Support
                if (pinBar === 'BULLISH' || engulfing === 'BULLISH') {
                    if (nearLevel(tf.close, s1) || nearLevel(tf.close, s2) || nearLevel(tf.close, s3) || nearLevel(tf.close, pivot)) {
                        signals_to_process.push({ type: 'LONG', tf: tfName, ref: tf, name: `PA AT SUPPORT (${tfName})` });
                    }
                }
                // SHORT at Resistance
                if (pinBar === 'BEARISH' || engulfing === 'BEARISH') {
                    if (nearLevel(tf.close, r1) || nearLevel(tf.close, r2) || nearLevel(tf.close, r3) || nearLevel(tf.close, pivot)) {
                        signals_to_process.push({ type: 'SHORT', tf: tfName, ref: tf, name: `PA AT RESISTANCE (${tfName})` });
                    }
                }
            });

            for (const sig of signals_to_process) {
                if (!allowedTimeframes.includes(sig.tf)) continue;

                const { data: active } = await supabase
                    .from('trading_history')
                    .select('id')
                    .eq('symbol', symbol)
                    .eq('status', 'PENDING')
                    .eq('timeframe', sig.tf)
                    .eq('strategy_name', sig.name) // Distinguish by name
                    .limit(1);

                if (!active || active.length === 0) {
                    const { target, stopLoss } = calculateDynamicTPSL(sig.ref.close, sig.type, sig.ref.swingHigh, sig.ref.swingLow, sig.ref.atr, sig.tf);
                    const icon = sig.type === 'LONG' ? '🟢' : '🔴';

                    const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                    const timestampStr = `${vnNow.getUTCHours().toString().padStart(2, '0')}:${vnNow.getUTCMinutes().toString().padStart(2, '0')} ${vnNow.getUTCDate().toString().padStart(2, '0')}/${(vnNow.getUTCMonth() + 1).toString().padStart(2, '0')}`;

                    const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
                    const tradeId = `${symbol.replace('USDT', '')}-${shortId}`;

                    const msg = `${icon} <b>NEW SIGNAL (${sig.tf}): ${symbol}</b>\n` +
                        `ID: <b>#${tradeId}</b>\n` +
                        `Trường phái: <b>${sig.name}</b>\n` +
                        `Type: <b>${sig.type}</b>\n` +
                        `Entry: $${sig.ref.close}\n` +
                        `Target: $${target.toFixed(2)}\n` +
                        `StopLoss: $${stopLoss.toFixed(2)}\n` +
                        `Volume: <b>${sig.ref.volRatio.toFixed(2)}x</b>\n` +
                        `RSI: ${sig.ref.rsi.toFixed(1)}\n` +
                        `Time: ${timestampStr}`;

                    let msgId = null;
                    const teleRes = await sendTelegram(msg, undefined, subscriberIds);
                    if (teleRes && teleRes.ok) msgId = teleRes.result.message_id;

                    const signalData: any = {
                        symbol, timeframe: sig.tf, signal: sig.type,
                        price_at_signal: sig.ref.close,
                        target_price: target, stop_loss: stopLoss,
                        status: 'PENDING',
                        telegram_message_id: msgId,
                        rsi: sig.ref.rsi, volume_ratio: sig.ref.volRatio,
                        strategy_name: sig.name,
                        trade_id: tradeId
                    };

                    const { error: insertError } = await supabase.from('trading_history').insert(signalData);

                    // FALLBACK: If new columns (strategy_name) are missing, insert without them
                    if (insertError && insertError.message.includes('column') && insertError.message.includes('not exist')) {
                        console.warn('New columns missing in DB, falling back to basic insert');
                        delete signalData.strategy_name;
                        delete signalData.pnl_reason;
                        delete signalData.trade_id;
                        await supabase.from('trading_history').insert(signalData);
                    }

                    newSignals.push({ symbol, signal: sig.type });
                }
            }
        }));

        return new Response(JSON.stringify({
            success: true,
            server_time: new Date().toISOString(),
            action_processed: action || 'none',
            new_signals: newSignals
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        console.error('Main Handler Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
